// Web-only converter for Vercel deployment (without server dependency)
import * as mammoth from 'mammoth';

export interface ConversionTask {
  id: string;
  fileName: string;
  inputPath: string;
  outputPath?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  errorMessage?: string;
  file?: File;
  metadata?: {
    title?: string;
    word_count?: number;
    char_count?: number;
  };
}

class WebOnlyConverter {
  // Convert DOCX files using mammoth.js (client-side)
  private async convertDocx(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      // Convert HTML to Markdown (simple conversion)
      let markdown = result.value
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
        .trim();
      return markdown;
    } catch (error) {
      throw new Error(`DOCX conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert text files
  private async convertText(file: File): Promise<string> {
    try {
      const text = await file.text();
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      return `# ${fileName}\n\n${text}`;
    } catch (error) {
      throw new Error(`Text conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert HTML files
  private async convertHtml(file: File): Promise<string> {
    try {
      const html = await file.text();
      // Simple HTML to Markdown conversion
      let markdown = html
        .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
        .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
        .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
        .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
        .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
        .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
        .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
        .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
        .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
          return content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n') + '\n';
        })
        .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
          let counter = 1;
          return content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => `${counter++}. $1\n`) + '\n';
        })
        .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up multiple newlines
        .trim();

      return markdown;
    } catch (error) {
      throw new Error(`HTML conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert single file based on type
  private async convertSingleFile(file: File): Promise<string> {
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.docx')) {
      return this.convertDocx(file);
    } else if (fileName.endsWith('.txt')) {
      return this.convertText(file);
    } else if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      return this.convertHtml(file);
    } else {
      // For other file types, treat as text
      return this.convertText(file);
    }
  }

  // Download file helper
  private downloadFile(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  // Main conversion method
  async convertFiles(
    tasks: ConversionTask[],
    outputDir: string = 'Downloads',
    onProgress?: (task: ConversionTask) => void
  ): Promise<ConversionTask[]> {
    const updatedTasks: ConversionTask[] = [];

    for (const task of tasks) {
      const updatedTask = { ...task };
      
      try {
        updatedTask.status = 'processing';
        updatedTask.progress = 10;
        onProgress?.(updatedTask);
        
        if (!task.file) {
          throw new Error('File not available');
        }

        // Convert file
        updatedTask.progress = 50;
        onProgress?.(updatedTask);
        
        const markdownContent = await this.convertSingleFile(task.file);
        
        // Create metadata
        const wordCount = markdownContent.split(/\s+/).length;
        const charCount = markdownContent.length;
        
        updatedTask.metadata = {
          title: task.fileName.replace(/\.[^/.]+$/, ''),
          word_count: wordCount,
          char_count: charCount
        };
        
        updatedTask.progress = 90;
        onProgress?.(updatedTask);
        
        // Download the file
        const outputFileName = task.fileName.replace(/\.[^/.]+$/, '.md');
        updatedTask.outputPath = `${outputDir}/${outputFileName}`;
        
        this.downloadFile(markdownContent, outputFileName);
        
        updatedTask.status = 'completed';
        updatedTask.progress = 100;
      } catch (error) {
        updatedTask.status = 'failed';
        updatedTask.progress = 0;
        updatedTask.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }
      
      updatedTasks.push(updatedTask);
      onProgress?.(updatedTask);
    }

    return updatedTasks;
  }

  // Health check (always returns true for web-only version)
  async checkHealth(): Promise<boolean> {
    return true;
  }
}

// Create singleton instance
export const webOnlyConverter = new WebOnlyConverter();

export default webOnlyConverter;
