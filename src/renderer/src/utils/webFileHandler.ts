import { webAPIClient, ConversionTask } from '../../../utils/apiClient';
import { webOnlyConverter } from '../../../utils/webOnlyConverter';

export class WebFileHandler {
  static async selectFiles(): Promise<ConversionTask[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = '.docx,.pdf,.pptx,.xlsx,.html,.txt,.jpg,.jpeg,.png,.gif,.mp3,.wav'
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const tasks: ConversionTask[] = Array.from(files).map(file => ({
            id: `${Date.now()}-${Math.random()}`,
            inputPath: file.name,
            outputPath: '',
            fileName: file.name,
            fileSize: file.size,
            status: 'pending' as const,
            progress: 0,
            file
          }))
          resolve(tasks)
        } else {
          resolve([])
        }
      }
      
      input.click()
    })
  }

  static async selectFolder(): Promise<ConversionTask[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = '.docx,.pdf,.pptx,.xlsx,.html,.txt,.jpg,.jpeg,.png,.gif,.mp3,.wav'
      // @ts-ignore - webkitdirectory is not in TypeScript types but is supported
      input.webkitdirectory = true
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const supportedFiles = Array.from(files).filter(file => 
            file.name.match(/\.(docx|pdf|pptx|xlsx|html|txt|jpg|jpeg|png|gif|mp3|wav)$/i)
          )
          const tasks: ConversionTask[] = supportedFiles.map(file => ({
            id: `${Date.now()}-${Math.random()}`,
            inputPath: file.webkitRelativePath || file.name,
            outputPath: '',
            fileName: file.name,
            status: 'pending' as const,
            progress: 0,
            file
          }))
          resolve(tasks)
        } else {
          resolve([])
        }
      }
      
      input.click()
    })
  }

  static async convertFiles(
    tasks: ConversionTask[], 
    outputDir: string,
    onProgress?: (task: ConversionTask) => void
  ): Promise<ConversionTask[]> {
    // Check if we're in production (Vercel) or development
    const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app');
    
    if (isProduction) {
      // Use web-only converter for Vercel deployment
      console.log('Using web-only converter for production deployment');
      return webOnlyConverter.convertFiles(tasks, outputDir, onProgress);
    } else {
      // Use API client for local development
      console.log('Using API client for local development');
      
      // Extract files from tasks
      const files = tasks.map(task => task.file).filter(Boolean) as File[];
      
      if (files.length === 0) {
        throw new Error('No files to convert');
      }

      try {
        // Check API health first
        const isHealthy = await this.checkAPIHealth();
        if (!isHealthy) {
          console.warn('API server not available, falling back to web-only converter');
          return webOnlyConverter.convertFiles(tasks, outputDir, onProgress);
        }

        // Use the web API client for conversion
        const convertedTasks = await webAPIClient.convertFiles(files, {}, onProgress);
        
        // Auto-download completed files
        for (const task of convertedTasks) {
          if (task.status === 'completed' && task.outputPath) {
            try {
              const outputFileName = task.fileName.replace(/\.[^/.]+$/, '.md');
              await webAPIClient.downloadFile(task.id, outputFileName);
            } catch (downloadError) {
              console.error('Auto-download failed:', downloadError);
            }
          }
        }
        
        return convertedTasks;
      } catch (error) {
        console.error('API conversion failed, falling back to web-only converter:', error);
        return webOnlyConverter.convertFiles(tasks, outputDir, onProgress);
      }
    }
  }

  static async selectOutputDirectory(): Promise<string> {
    // In web environment, files are downloaded to default download folder
    return 'Downloads';
  }

  static async getDefaultOutputDirectory(): Promise<string> {
    return 'Downloads';
  }

  static async openFolder(path: string): Promise<void> {
    // Can't open folders in web environment
    console.log(`Would open folder: ${path}`);
  }

  static async checkAPIHealth(): Promise<boolean> {
    try {
      // In production, always return true since we use web-only converter
      const isProduction = process.env.NODE_ENV === 'production' || window.location.hostname.includes('vercel.app');
      if (isProduction) {
        return true;
      }
      
      await webAPIClient.checkHealth();
      return true;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }

  static getAppVersion(): string {
    return '1.0.0-web'
  }
}