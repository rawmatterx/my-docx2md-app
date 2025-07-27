// Vercel serverless function for file conversion
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Microsoft MarkItDown conversion function
async function convertWithMarkItDown(inputPath, outputPath, options = {}) {
  return new Promise((resolve, reject) => {
    const pythonScript = `
import sys
import json
import os
from markitdown import MarkItDown

def convert_file(input_path, output_path, options):
    try:
        md = MarkItDown()
        result = md.convert(input_path)
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
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

    const tempScriptPath = `/tmp/convert_${uuidv4()}.py`;
    
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
      fs.unlink(tempScriptPath, () => {});
      
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
      fs.unlink(tempScriptPath, () => {});
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      uploadDir: '/tmp',
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    if (!files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const fileId = uuidv4();
    const inputPath = file.filepath;
    const outputFileName = file.originalFilename?.replace(/\.[^/.]+$/, '.md') || 'converted.md';
    const outputPath = `/tmp/${fileId}-${outputFileName}`;

    // Convert file using MarkItDown
    const result = await convertWithMarkItDown(inputPath, outputPath);

    // Read the converted file
    const markdownContent = fs.readFileSync(outputPath, 'utf-8');

    // Clean up files
    fs.unlink(inputPath, () => {});
    fs.unlink(outputPath, () => {});

    res.status(200).json({
      success: true,
      fileId,
      content: markdownContent,
      metadata: result.metadata,
      filename: outputFileName
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ 
      error: 'Conversion failed',
      message: error.message 
    });
  }
}
