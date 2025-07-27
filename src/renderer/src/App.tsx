import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WebFileHandler, ConversionTask } from './utils/webFileHandler'
import { FileManagementPanel } from './components/FileManagementPanel'
import { ProcessingPanel } from './components/ProcessingPanel'
import { ConfigurationPanel } from './components/ConfigurationPanel'
import { ThemeProvider } from './contexts/ThemeContext'
import { ConversionProvider } from './contexts/ConversionContext'
import { TitleBar } from './components/TitleBar'

function App() {
  const [tasks, setTasks] = useState<ConversionTask[]>([])
  const [outputDirectory, setOutputDirectory] = useState<string>('')
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)

  useEffect(() => {
    const defaultDir = WebFileHandler.getDefaultOutputDirectory()
    setOutputDirectory(defaultDir)
  }, [])

  useEffect(() => {
    const handleProgress = (task: ConversionTask) => {
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === task.id ? task : t)
      )
    }

    // Store the handler for use in conversion
    window.conversionProgressHandler = handleProgress
  }, [])

  const handleAddFiles = useCallback(async () => {
    try {
      const selectedTasks = await WebFileHandler.selectFiles()
      setTasks(prev => [...prev, ...selectedTasks])
    } catch (error) {
      console.error('Error adding files:', error)
    }
  }, [])

  const handleAddFolder = useCallback(async () => {
    try {
      const selectedTasks = await WebFileHandler.selectFolder()
      setTasks(prev => [...prev, ...selectedTasks])
    } catch (error) {
      console.error('Error adding folder:', error)
    }
  }, [])

  const handleRemoveTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
  }, [])

  const handleClearAll = useCallback(() => {
    setTasks([])
    setConversionProgress(0)
  }, [])

  const handleSelectOutputDirectory = useCallback(async () => {
    try {
      // In web version, user can type the directory name
      const directory = prompt('Enter output directory name:', outputDirectory)
      if (directory) {
        setOutputDirectory(directory)
      }
    } catch (error) {
      console.error('Error selecting output directory:', error)
    }
  }, [])

  const handleStartConversion = useCallback(async () => {
    if (tasks.length === 0 || isConverting) return

    setIsConverting(true)
    setConversionProgress(0)

    try {
      // Reset all tasks to pending
      const resetTasks = tasks.map(task => ({ ...task, status: 'pending' as const }))
      setTasks(resetTasks)

      // Start conversion
      await WebFileHandler.convertFiles(
        resetTasks, 
        outputDirectory,
        window.conversionProgressHandler
      )
    } catch (error) {
      console.error('Conversion error:', error)
    } finally {
      setIsConverting(false)
    }
  }, [tasks, outputDirectory, isConverting])

  const handleOpenOutputFolder = useCallback(async () => {
    if (outputDirectory) {
      try {
        WebFileHandler.openFolder(outputDirectory)
      } catch (error) {
        console.error('Error opening folder:', error)
      }
    }
  }, [outputDirectory])

  return (
    <ThemeProvider>
      <ConversionProvider>
        <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
          {/* Title Bar */}
          <TitleBar />
          
          {/* Main Content - Three Panel Layout */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-30 dark:opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-transparent to-emerald-500/5"></div>
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
            </div>
            
            {/* Left Panel - File Management (30%) */}
            <motion.div 
              className="w-[30%] min-w-[380px] panel-border bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl relative z-10"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <FileManagementPanel
                tasks={tasks}
                onAddFiles={handleAddFiles}
                onAddFolder={handleAddFolder}
                onRemoveTask={handleRemoveTask}
                onClearAll={handleClearAll}
              />
            </motion.div>

            {/* Center Panel - Processing & Progress (40%) */}
            <motion.div 
              className="flex-1 bg-transparent relative z-10"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ProcessingPanel
                tasks={tasks}
                isConverting={isConverting}
                conversionProgress={conversionProgress}
                onStartConversion={handleStartConversion}
                onOpenOutputFolder={handleOpenOutputFolder}
                outputDirectory={outputDirectory}
              />
            </motion.div>

            {/* Right Panel - Configuration & Output (30%) */}
            <motion.div 
              className="w-[30%] min-w-[380px] border-l border-gray-200/50 dark:border-gray-700/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl relative z-10"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <ConfigurationPanel
                outputDirectory={outputDirectory}
                onSelectOutputDirectory={handleSelectOutputDirectory}
                tasks={tasks}
                isConverting={isConverting}
              />
            </motion.div>
          </div>
        </div>
      </ConversionProvider>
    </ThemeProvider>
  )
}

// Extend window interface for progress handler
declare global {
  interface Window {
    conversionProgressHandler?: (task: ConversionTask) => void
  }
}

export default App