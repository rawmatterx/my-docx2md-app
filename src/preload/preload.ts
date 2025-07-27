import { contextBridge, ipcRenderer } from 'electron'

export interface ConversionTask {
  id: string
  inputPath: string
  outputPath: string
  fileName: string
  fileSize: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  errorMessage?: string
}

export interface ElectronAPI {
  // File operations
  selectFiles: () => Promise<ConversionTask[]>
  selectFolder: () => Promise<ConversionTask[]>
  selectOutputDirectory: () => Promise<string | null>
  getDefaultOutputDirectory: () => Promise<string>
  
  // Conversion operations
  convertFiles: (tasks: ConversionTask[], outputDir: string) => Promise<ConversionTask[]>
  
  // Utility operations
  openFolder: (folderPath: string) => Promise<void>
  getAppVersion: () => Promise<string>
  
  // Event listeners
  onConversionProgress: (callback: (task: ConversionTask) => void) => void
  removeAllListeners: (channel: string) => void
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectOutputDirectory: () => ipcRenderer.invoke('select-output-directory'),
  getDefaultOutputDirectory: () => ipcRenderer.invoke('get-default-output-directory'),
  convertFiles: (tasks: ConversionTask[], outputDir: string) => 
    ipcRenderer.invoke('convert-files', tasks, outputDir),
  openFolder: (folderPath: string) => ipcRenderer.invoke('open-folder', folderPath),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Event listeners
  onConversionProgress: (callback: (task: ConversionTask) => void) => {
    ipcRenderer.on('conversion-progress', (_, task) => callback(task))
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel)
  }
} as ElectronAPI)

// Type declaration for global window object
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
