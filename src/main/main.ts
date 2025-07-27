import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import { readdir, stat, readFile, writeFile, mkdir } from 'fs/promises'
import mammoth from 'mammoth'
// @ts-ignore
import { convert as html2text } from 'html2text'

interface ConversionTask {
  id: string
  inputPath: string
  outputPath: string
  fileName: string
  fileSize: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
}

class ConverterApp {
  private mainWindow: BrowserWindow | null = null
  private isDev = process.env.NODE_ENV === 'development'

  constructor() {
    this.setupApp()
    this.setupIPC()
  }

  private setupApp() {
    app.whenReady().then(() => {
      this.createWindow()
      
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow()
        }
      })
    })

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 700,
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js'),
      },
      show: false,
    })

    // Load the app
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:4000')
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })
  }

  private setupIPC() {
    // File selection handlers
    ipcMain.handle('select-files', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Word Documents', extensions: ['docx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      })
      
      if (!result.canceled) {
        return this.getFileInfo(result.filePaths)
      }
      return []
    })

    ipcMain.handle('select-folder', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory']
      })
      
      if (!result.canceled) {
        const folderPath = result.filePaths[0]
        const docxFiles = await this.findDocxFiles(folderPath)
        return this.getFileInfo(docxFiles)
      }
      return []
    })

    ipcMain.handle('select-output-directory', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory']
      })
      
      if (!result.canceled) {
        return result.filePaths[0]
      }
      return null
    })

    // Conversion handler
    ipcMain.handle('convert-files', async (_, tasks: ConversionTask[], outputDir: string) => {
      return this.convertFiles(tasks, outputDir)
    })

    // Utility handlers
    ipcMain.handle('open-folder', async (_, folderPath: string) => {
      shell.openPath(folderPath)
    })

    ipcMain.handle('get-app-version', () => {
      return app.getVersion()
    })

    // Get default output directory
    ipcMain.handle('get-default-output-directory', () => {
      const homeDir = require('os').homedir()
      return `${homeDir}/Documents/Converted_Markdown`
    })
  }

  private async getFileInfo(filePaths: string[]): Promise<ConversionTask[]> {
    const tasks: ConversionTask[] = []
    
    for (const filePath of filePaths) {
      try {
        const stats = await stat(filePath)
        const fileName = filePath.split('/').pop() || filePath.split('\\').pop() || 'unknown'
        
        tasks.push({
          id: `${Date.now()}-${Math.random()}`,
          inputPath: filePath,
          outputPath: '',
          fileName,
          fileSize: stats.size,
          status: 'pending'
        })
      } catch (error) {
        console.error(`Error getting file info for ${filePath}:`, error)
      }
    }
    
    return tasks
  }

  private async findDocxFiles(folderPath: string): Promise<string[]> {
    const docxFiles: string[] = []
    
    try {
      const items = await readdir(folderPath, { withFileTypes: true })
      
      for (const item of items) {
        const fullPath = join(folderPath, item.name)
        
        if (item.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = await this.findDocxFiles(fullPath)
          docxFiles.push(...subFiles)
        } else if (item.name.toLowerCase().endsWith('.docx')) {
          docxFiles.push(fullPath)
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${folderPath}:`, error)
    }
    
    return docxFiles
  }

  private async convertFiles(tasks: ConversionTask[], outputDir: string): Promise<ConversionTask[]> {
    // Ensure output directory exists
    try {
      await mkdir(outputDir, { recursive: true })
    } catch (error) {
      console.error('Error creating output directory:', error)
    }

    const updatedTasks: ConversionTask[] = []

    for (const task of tasks) {
      const updatedTask = { ...task }
      
      try {
        // Update status to processing
        updatedTask.status = 'processing'
        this.mainWindow?.webContents.send('conversion-progress', updatedTask)
        
        // Set output path
        const outputFileName = task.fileName.replace(/\.docx$/i, '.md')
        updatedTask.outputPath = join(outputDir, outputFileName)
        
        // Convert file
        await this.convertSingleFile(task.inputPath, updatedTask.outputPath)
        
        updatedTask.status = 'completed'
      } catch (error) {
        updatedTask.status = 'failed'
        updatedTask.errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Conversion failed for ${task.fileName}:`, error)
      }
      
      updatedTasks.push(updatedTask)
      
      // Send progress update
      this.mainWindow?.webContents.send('conversion-progress', updatedTask)
    }

    return updatedTasks
  }

  private async convertSingleFile(inputPath: string, outputPath: string): Promise<void> {
    try {
      // Read DOCX file
      const docxBuffer = await readFile(inputPath)
      
      // Convert to HTML using mammoth
      const result = await mammoth.convertToHtml({ buffer: docxBuffer })
      const htmlContent = result.value
      
      // Convert HTML to Markdown
      const markdownContent = html2text(htmlContent, {
        wordwrap: false,
        ignoreHref: false,
        ignoreImage: false,
      })
      
      // Write Markdown file
      await writeFile(outputPath, markdownContent, 'utf-8')
    } catch (error) {
      throw new Error(`Failed to convert file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Initialize the app
new ConverterApp()
