import axios, { AxiosProgressEvent } from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = (typeof window !== 'undefined' && (window as any).VITE_API_URL) || 'http://localhost:3001';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 300000, // 5 minutes timeout for large files
});

// Socket.io connection
let socket: Socket | null = null;

export interface ConversionTask {
  id: string;
  fileName: string;
  inputPath: string;
  outputPath?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  file?: File;
  jobId?: string;
  metadata?: {
    title?: string;
    word_count?: number;
    char_count?: number;
  };
}

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimetype: string;
  status: string;
}

export interface ConversionJob {
  fileId: string;
  jobId: string;
  status: string;
}

export interface ConversionProgress {
  fileId: string;
  jobId?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputPath?: string;
  metadata?: any;
  error?: string;
}

class WebAPIClient {
  private progressCallbacks: Map<string, (task: ConversionTask) => void> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    if (!socket) {
      socket = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      socket.on('connect', () => {
        console.log('Connected to conversion server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from conversion server');
      });

      socket.on('conversion-progress', (data: ConversionProgress) => {
        const callback = this.progressCallbacks.get(data.fileId);
        if (callback) {
          const task: ConversionTask = {
            id: data.fileId,
            fileName: '', // Will be updated by the calling component
            inputPath: '',
            status: data.status,
            progress: data.progress,
            outputPath: data.outputPath,
            errorMessage: data.error,
            jobId: data.jobId,
            metadata: data.metadata,
          };
          callback(task);
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('API server is not available');
    }
  }

  // Upload files
  async uploadFiles(
    files: File[],
    onProgress?: (fileId: string, progress: number) => void
  ): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await apiClient.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // For simplicity, we'll use the first file's progress for all files
            // In a real implementation, you'd track individual file progress
            files.forEach((_, index) => {
              onProgress(`upload-${index}`, progress);
            });
          }
        },
      });

      if (response.data.success) {
        return response.data.files;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error('Failed to upload files');
    }
  }

  // Start conversion
  async startConversion(
    files: UploadedFile[],
    options: Record<string, any> = {}
  ): Promise<ConversionJob[]> {
    try {
      const response = await apiClient.post('/convert', {
        files,
        options,
      });

      if (response.data.success) {
        return response.data.jobs;
      } else {
        throw new Error('Conversion failed to start');
      }
    } catch (error) {
      console.error('Conversion start error:', error);
      throw new Error('Failed to start conversion');
    }
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Status check error:', error);
      throw new Error('Failed to get job status');
    }
  }

  // Get all jobs
  async getAllJobs(): Promise<{ jobs: any[]; stats: any }> {
    try {
      const response = await apiClient.get('/jobs');
      return response.data;
    } catch (error) {
      console.error('Jobs fetch error:', error);
      throw new Error('Failed to get jobs');
    }
  }

  // Download file
  async downloadFile(fileId: string, fileName: string): Promise<void> {
    try {
      const response = await apiClient.get(`/download/${fileId}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error('Failed to download file');
    }
  }

  // Register progress callback
  onConversionProgress(fileId: string, callback: (task: ConversionTask) => void): void {
    this.progressCallbacks.set(fileId, callback);
    
    // Join socket room for this file
    if (socket) {
      socket.emit('join-file', fileId);
    }
  }

  // Unregister progress callback
  offConversionProgress(fileId: string): void {
    this.progressCallbacks.delete(fileId);
    
    // Leave socket room for this file
    if (socket) {
      socket.emit('leave-file', fileId);
    }
  }

  // Convert files (main method that combines upload and conversion)
  async convertFiles(
    files: File[],
    options: Record<string, any> = {},
    onProgress?: (task: ConversionTask) => void
  ): Promise<ConversionTask[]> {
    const tasks: ConversionTask[] = files.map((file, index) => ({
      id: `task-${Date.now()}-${index}`,
      fileName: file.name,
      inputPath: '',
      status: 'pending',
      progress: 0,
      file,
    }));

    try {
      // Step 1: Upload files
      for (const task of tasks) {
        if (onProgress) {
          task.status = 'uploading';
          onProgress(task);
        }
      }

      const uploadedFiles = await this.uploadFiles(
        files,
        (fileId, progress) => {
          // Update upload progress for all tasks
          tasks.forEach((task) => {
            if (task.status === 'uploading') {
              task.progress = Math.min(progress * 0.3, 30); // Upload is 30% of total progress
              if (onProgress) onProgress(task);
            }
          });
        }
      );

      // Update tasks with uploaded file info
      tasks.forEach((task, index) => {
        if (uploadedFiles[index]) {
          task.id = uploadedFiles[index].id;
          task.status = 'uploaded';
          task.progress = 30;
          if (onProgress) onProgress(task);
        }
      });

      // Step 2: Start conversion
      const jobs = await this.startConversion(uploadedFiles, options);

      // Update tasks with job info and register progress callbacks
      tasks.forEach((task, index) => {
        if (jobs[index]) {
          task.jobId = jobs[index].jobId;
          task.status = 'queued';
          task.progress = 35;
          
          // Register progress callback for this task
          this.onConversionProgress(task.id, (updatedTask) => {
            // Update the task with new progress
            Object.assign(task, {
              status: updatedTask.status,
              progress: Math.max(updatedTask.progress * 0.7 + 30, task.progress), // Conversion is 70% of total progress
              outputPath: updatedTask.outputPath,
              errorMessage: updatedTask.errorMessage,
              metadata: updatedTask.metadata,
            });
            
            if (onProgress) onProgress(task);
          });
          
          if (onProgress) onProgress(task);
        }
      });

      return tasks;
    } catch (error) {
      // Update all tasks to failed status
      tasks.forEach((task) => {
        task.status = 'failed';
        task.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (onProgress) onProgress(task);
      });
      
      throw error;
    }
  }

  // Cleanup method
  cleanup(): void {
    this.progressCallbacks.clear();
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
}

// Create singleton instance
export const webAPIClient = new WebAPIClient();

// Legacy compatibility methods for existing components
export const electronAPI = {
  selectFiles: async (): Promise<string[]> => {
    // For web, we'll use file input instead
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = '.docx,.pdf,.pptx,.xlsx,.html,.txt,.jpg,.jpeg,.png,.gif,.mp3,.wav';
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          const filePaths = Array.from(files).map(file => file.name);
          resolve(filePaths);
        } else {
          resolve([]);
        }
      };
      
      input.click();
    });
  },

  selectFolder: async (): Promise<string[]> => {
    // For web, we'll use directory input
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          const filePaths = Array.from(files)
            .filter(file => file.name.match(/\.(docx|pdf|pptx|xlsx|html|txt|jpg|jpeg|png|gif|mp3|wav)$/i))
            .map(file => file.webkitRelativePath || file.name);
          resolve(filePaths);
        } else {
          resolve([]);
        }
      };
      
      input.click();
    });
  },

  selectOutputDirectory: async (): Promise<string> => {
    // For web, downloads go to default download folder
    return 'Downloads';
  },

  getDefaultOutputDirectory: async (): Promise<string> => {
    return 'Downloads';
  },

  convertFiles: async (
    tasks: ConversionTask[],
    outputDir: string
  ): Promise<ConversionTask[]> => {
    // Extract files from tasks
    const files = tasks.map(task => task.file).filter(Boolean) as File[];
    
    if (files.length === 0) {
      throw new Error('No files to convert');
    }

    return webAPIClient.convertFiles(files);
  },

  openFolder: async (folderPath: string): Promise<void> => {
    // For web, we can't open folders, so we'll just log
    console.log(`Would open folder: ${folderPath}`);
  },

  getAppVersion: async (): Promise<string> => {
    return '1.0.0-web';
  },

  onConversionProgress: (callback: (task: ConversionTask) => void) => {
    // This will be handled by the webAPIClient
    console.log('Conversion progress listener registered');
  },

  removeAllListeners: (channel: string) => {
    console.log(`Removing listeners for channel: ${channel}`);
  },
};

export default webAPIClient;
