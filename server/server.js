import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import Queue from 'bull';
import Redis from 'redis';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const OUTPUT_DIR = path.join(process.cwd(), 'outputs');

// Ensure directories exist
await fs.ensureDir(UPLOAD_DIR);
await fs.ensureDir(OUTPUT_DIR);

// Redis connection for job queue
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true
});

// Create job queue
const conversionQueue = new Queue('file conversion', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
  }
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document formats
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/pdf',
      'text/html',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'), false);
    }
  }
});

// Job processing
conversionQueue.process(async (job) => {
  const { fileId, inputPath, outputPath, options = {} } = job.data;
  
  try {
    // Update job progress
    await job.progress(10);
    
    // Use Microsoft MarkItDown for conversion
    const result = await convertWithMarkItDown(inputPath, outputPath, options);
    
    await job.progress(90);
    
    // Emit progress to connected clients
    io.emit('conversion-progress', {
      fileId,
      status: 'completed',
      progress: 100,
      outputPath: result.outputPath,
      metadata: result.metadata
    });
    
    await job.progress(100);
    
    return result;
  } catch (error) {
    console.error('Conversion failed:', error);
    
    // Emit error to connected clients
    io.emit('conversion-progress', {
      fileId,
      status: 'failed',
      progress: 0,
      error: error.message
    });
    
    throw error;
  }
});

// Microsoft MarkItDown conversion function
async function convertWithMarkItDown(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import sys
import json
from markitdown import MarkItDown

def convert_file(input_path, output_path, options):
    try:
        md = MarkItDown()
        result = md.convert(input_path)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(result.text_content)
        
        return {
            'success': True,
            'output_path': output_path,
            'metadata': {
                'title': getattr(result, 'title', ''),
                'word_count': len(result.text_content.split()),
                'char_count': len(result.text_content)
            }
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    options = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
    
    result = convert_file(input_path, output_path, options)
    print(json.dumps(result))
`;

    const tempScriptPath = path.join(process.cwd(), `convert_${uuidv4()}.py`);
    
    // Write temporary Python script
    fs.writeFileSync(tempScriptPath, pythonScript);
    
    // Execute Python script
    const pythonProcess = spawn('python3', [
      tempScriptPath,
      inputPath,
      outputPath,
      JSON.stringify(options)
    ]);
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      // Clean up temporary script
      fs.unlink(tempScriptPath).catch(console.error);
      
      if (code === 0) {
        try {
          const result = JSON.parse(output.trim());
          if (result.success) {
            resolve({
              outputPath: result.output_path,
              metadata: result.metadata
            });
          } else {
            reject(new Error(result.error));
          }
        } catch (parseError) {
          reject(new Error(`Failed to parse conversion result: ${parseError.message}`));
        }
      } else {
        reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      // Clean up temporary script
      fs.unlink(tempScriptPath).catch(console.error);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const uploadedFiles = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      status: 'uploaded'
    }));
    
    res.json({
      success: true,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Start conversion endpoint
app.post('/api/convert', async (req, res) => {
  try {
    const { files, options = {} } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for conversion' });
    }
    
    const jobs = [];
    
    for (const file of files) {
      const inputPath = path.join(UPLOAD_DIR, file.filename);
      const outputFileName = file.originalName.replace(/\.[^/.]+$/, '.md');
      const outputPath = path.join(OUTPUT_DIR, `${file.id}-${outputFileName}`);
      
      // Add job to queue
      const job = await conversionQueue.add('convert', {
        fileId: file.id,
        inputPath,
        outputPath,
        originalName: file.originalName,
        options
      });
      
      jobs.push({
        fileId: file.id,
        jobId: job.id,
        status: 'queued'
      });
      
      // Emit initial status
      io.emit('conversion-progress', {
        fileId: file.id,
        status: 'queued',
        progress: 0
      });
    }
    
    res.json({
      success: true,
      jobs
    });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Conversion failed to start' });
  }
});

// Download converted file
app.get('/api/download/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const files = await fs.readdir(OUTPUT_DIR);
    const targetFile = files.find(file => file.startsWith(fileId));
    
    if (!targetFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const filePath = path.join(OUTPUT_DIR, targetFile);
    const originalName = targetFile.replace(`${fileId}-`, '');
    
    res.download(filePath, originalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Download failed' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// Get job status
app.get('/api/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await conversionQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const state = await job.getState();
    const progress = job.progress();
    
    res.json({
      jobId,
      state,
      progress,
      data: job.data
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ error: 'Status check failed' });
  }
});

// Bulk conversion status
app.get('/api/queue/stats', async (req, res) => {
  try {
    const waiting = await conversionQueue.getWaiting();
    const active = await conversionQueue.getActive();
    const completed = await conversionQueue.getCompleted();
    const failed = await conversionQueue.getFailed();
    
    res.json({
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    });
  } catch (error) {
    console.error('Queue stats error:', error);
    res.status(500).json({ error: 'Failed to get queue stats' });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
  
  // Join room for specific file updates
  socket.on('join-file', (fileId) => {
    socket.join(`file-${fileId}`);
  });
  
  // Leave file room
  socket.on('leave-file', (fileId) => {
    socket.leave(`file-${fileId}`);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await conversionQueue.close();
  await redis.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 MarkItDown Conversion API running on port ${PORT}`);
  console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
  console.log(`📄 Output directory: ${OUTPUT_DIR}`);
});

export default app;
