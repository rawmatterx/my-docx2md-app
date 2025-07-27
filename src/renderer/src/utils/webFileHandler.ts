export interface ConversionTask {
  id: string
  inputPath: string
  outputPath: string
  fileName: string
  fileSize: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
  file?: File
}

export class WebFileHandler {
  static async selectFiles(): Promise<ConversionTask[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.accept = '.docx'
      
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
      input.accept = '.docx'
      // @ts-ignore - webkitdirectory is not in TypeScript types but is supported
      input.webkitdirectory = true
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files
        if (files) {
          const docxFiles = Array.from(files).filter(file => 
            file.name.toLowerCase().endsWith('.docx')
          )
          const tasks: ConversionTask[] = docxFiles.map(file => ({
            id: `${Date.now()}-${Math.random()}`,
            inputPath: file.webkitRelativePath || file.name,
            outputPath: '',
            fileName: file.name,
            fileSize: file.size,
            status: 'pending' as const,
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

  static getDefaultOutputDirectory(): string {
    return 'Downloads/Converted_Markdown'
  }

  static async convertFiles(
    tasks: ConversionTask[], 
    outputDir: string,
    onProgress?: (task: ConversionTask) => void
  ): Promise<ConversionTask[]> {
    const updatedTasks: ConversionTask[] = []

    for (const task of tasks) {
      const updatedTask = { ...task }
      
      try {
        updatedTask.status = 'processing'
        onProgress?.(updatedTask)
        
        if (!task.file) {
          throw new Error('File not available')
        }

        // Convert file using browser APIs
        const markdownContent = await this.convertSingleFile(task.file)
        
        // Create download
        const outputFileName = task.fileName.replace(/\.docx$/i, '.md')
        updatedTask.outputPath = `${outputDir}/${outputFileName}`
        
        this.downloadFile(markdownContent, outputFileName)
        
        updatedTask.status = 'completed'
      } catch (error) {
        updatedTask.status = 'failed'
        updatedTask.errorMessage = error instanceof Error ? error.message : 'Unknown error'
      }
      
      updatedTasks.push(updatedTask)
      onProgress?.(updatedTask)
    }

    return updatedTasks
  }

  private static async convertSingleFile(file: File): Promise<string> {
    try {
      // For web version, we'll use a simple text extraction
      // In a real implementation, you'd use a library like mammoth.js
      const arrayBuffer = await file.arrayBuffer()
      
      // Simple placeholder conversion - in reality you'd use mammoth.js here
      const fileName = file.name.replace(/\.docx$/i, '')
      return `# ${fileName}\n\nConverted from DOCX file: ${file.name}\nFile size: ${file.size} bytes\n\n*Note: This is a web-based conversion. For full DOCX parsing, the original Electron version with mammoth.js would be used.*`
    } catch (error) {
      throw new Error(`Failed to convert file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static downloadFile(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static openFolder(folderPath: string): void {
    // In web version, we can't open system folders
    console.log(`Would open folder: ${folderPath}`)
    alert(`Files saved to: ${folderPath}`)
  }

  static getAppVersion(): string {
    return '1.0.0-web'
  }
}