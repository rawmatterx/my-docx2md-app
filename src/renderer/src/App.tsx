import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileManagementPanel } from './components/FileManagementPanel'
import { ProcessingPanel } from './components/ProcessingPanel'
import { ConfigurationPanel } from './components/ConfigurationPanel'
import { ThemeProvider } from './contexts/ThemeContext'
import { ConversionProvider } from './contexts/ConversionContext'
import { TitleBar } from './components/TitleBar'
import type { ConversionTask } from '../../preload/preload'

function App() {
  const [tasks, setTasks] = useState<ConversionTask[]>([])
  const [outputDirectory, setOutputDirectory] = useState<string>('')
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)

  // Initialize default output directory
  useEffect(() => {
    const initializeOutputDir = async () => {
      try {
        // Get default output directory from Electron main process
        const defaultDir = await window.electronAPI.getDefaultOutputDirectory()
        setOutputDirectory(defaultDir)
      } catch (error) {
        console.error('Failed to get default output directory:', error)
        // Fallback to a safe default
        setOutputDirectory('~/Documents/Converted_Markdown')
      }
    }
    
    initializeOutputDir()
  }, [])

  // Listen for conversion progress updates
  useEffect(() => {
    const handleConversionProgress = (updatedTask: ConversionTask) => {
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      )
      
      // Update overall progress
      setTasks(currentTasks => {
        const completed = currentTasks.filter(t => 
          t.status === 'completed' || t.status === 'failed'
        ).length
        const total = currentTasks.length
        setConversionProgress(total > 0 ? (completed / total) * 100 : 0)
        return currentTasks
      })
    }

    window.electronAPI.onConversionProgress(handleConversionProgress)

    return () => {
      window.electronAPI.removeAllListeners('conversion-progress')
    }
  }, [])

  const handleAddFiles = useCallback(async () => {
    try {
      const newTasks = await window.electronAPI.selectFiles()
      setTasks(prevTasks => [...prevTasks, ...newTasks])
    } catch (error) {
      console.error('Error adding files:', error)
    }
  }, [])

  const handleAddFolder = useCallback(async () => {
    try {
      const newTasks = await window.electronAPI.selectFolder()
      setTasks(prevTasks => [...prevTasks, ...newTasks])
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
      const selectedDir = await window.electronAPI.selectOutputDirectory()
      if (selectedDir) {
        setOutputDirectory(selectedDir)
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
      await window.electronAPI.convertFiles(resetTasks, outputDirectory)
    } catch (error) {
      console.error('Conversion error:', error)
    } finally {
      setIsConverting(false)
    }
  }, [tasks, outputDirectory, isConverting])

  const handleOpenOutputFolder = useCallback(async () => {
    if (outputDirectory) {
      try {
        await window.electronAPI.openFolder(outputDirectory)
      } catch (error) {
        console.error('Error opening folder:', error)
      }
    }
  }, [outputDirectory])

  return (
    <ThemeProvider>
      <ConversionProvider>
        <div className="h-screen flex flex-col bg-background-light dark:bg-background-dark">
          {/* Title Bar */}
          <TitleBar />
          
          {/* Main Content - Three Panel Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - File Management (30%) */}
            <motion.div 
              className="w-[30%] min-w-[320px] panel-border bg-surface-light dark:bg-surface-dark"
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
              className="flex-1 bg-background-light dark:bg-background-dark"
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
              className="w-[30%] min-w-[320px] border-l border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark"
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

export default App
