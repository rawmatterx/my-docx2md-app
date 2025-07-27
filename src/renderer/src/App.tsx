import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileManagementPanel } from './components/FileManagementPanel'
import { ProcessingPanel } from './components/ProcessingPanel'
import { ConfigurationPanel } from './components/ConfigurationPanel'
import { TitleBar } from './components/TitleBar'
import { WebFileHandler } from './utils/webFileHandler'
import { ConversionTask, webAPIClient } from '../../utils/apiClient'

function App() {
  const [tasks, setTasks] = useState<ConversionTask[]>([])
  const [outputDirectory, setOutputDirectory] = useState<string>('Downloads')
  const [isConverting, setIsConverting] = useState(false)
  const [conversionProgress, setConversionProgress] = useState(0)

  useEffect(() => {
    // Always use web environment
    setIsConverting(false);
    setOutputDirectory('Downloads');

    // Check API health on startup
    const checkAPIHealth = async () => {
      try {
        await webAPIClient.checkHealth();
        console.log('API server is healthy');
      } catch (error) {
        console.error('API server is not available:', error);
        // You could show a notification to the user here
      }
    };

    checkAPIHealth();

    // Cleanup on unmount
    return () => {
      webAPIClient.cleanup();
    };
  }, []);

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

  const handleOutputDirectorySelection = useCallback(async () => {
    try {
      const directory = await WebFileHandler.selectOutputDirectory();
      setOutputDirectory(directory);
    } catch (error) {
      console.error('Output directory selection failed:', error);
    }
  }, [])

  const handleConversion = useCallback(async () => {
    if (tasks.length === 0) return;

    setIsConverting(true);
    
    try {
      await WebFileHandler.convertFiles(
        tasks, 
        outputDirectory, 
        (updatedTask) => {
          setTasks(prevTasks => 
            prevTasks.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t)
          );
        }
      );
    } catch (error) {
      console.error('Conversion failed:', error);
    } finally {
      setIsConverting(false);
    }
  }, [tasks, outputDirectory, isConverting])

  const handleOpenOutputFolder = useCallback(async () => {
    try {
      await WebFileHandler.openFolder(outputDirectory);
    } catch (error) {
      console.error('Failed to open output folder:', error);
    }
  }, [outputDirectory])

  return (
    <div>
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
        {/* Title Bar */}
        <TitleBar />
        
        {/* Main Content - Three Panel Layout */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-30 dark:opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-emerald-500/5"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
          </div>
          
          {/* Left Panel - File Management (30%) */}
          <motion.div 
            className="w-[30%] min-w-[380px] panel-border bg-white/60 relative z-10"
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
              onStartConversion={handleConversion}
              onOpenOutputFolder={handleOpenOutputFolder}
              outputDirectory={outputDirectory}
            />
          </motion.div>

          {/* Right Panel - Configuration & Output (30%) */}
          <motion.div 
            className="w-[30%] min-w-[380px] border-l border-white/20 bg-white/60 relative z-10"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <ConfigurationPanel
              outputDirectory={outputDirectory}
              onSelectOutputDirectory={handleOutputDirectorySelection}
              tasks={tasks}
              isConverting={isConverting}
            />
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Extend window interface for progress handler
declare global {
  interface Window {
    conversionProgressHandler?: (task: ConversionTask) => void
  }
}

export default App