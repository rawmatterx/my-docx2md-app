import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  FolderOpen, 
  FileText, 
  X, 
  Trash2, 
  Plus,
  File,
  AlertCircle
} from 'lucide-react'
import type { ConversionTask } from '../../../preload/preload'

interface FileManagementPanelProps {
  tasks: ConversionTask[]
  onAddFiles: () => void
  onAddFolder: () => void
  onRemoveTask: (taskId: string) => void
  onClearAll: () => void
}

export function FileManagementPanel({
  tasks,
  onAddFiles,
  onAddFolder,
  onRemoveTask,
  onClearAll
}: FileManagementPanelProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }, [])

  const getStatusIcon = useCallback((status: ConversionTask['status']) => {
    switch (status) {
      case 'pending':
        return <File className="w-4 h-4 text-gray-400" />
      case 'processing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <File className="w-4 h-4 text-warning-500" />
          </motion.div>
        )
      case 'completed':
        return <File className="w-4 h-4 text-success-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-error-500" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    // Handle file drop - would need to implement file handling logic
    console.log('Files dropped:', e.dataTransfer.files)
  }, [])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-2 h-8 bg-gradient-to-b from-primary-500 to-primary-600 rounded-full"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            File Management
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-5">
          Add DOCX files to convert to Markdown format
        </p>
      </div>

      {/* Stats Bar */}
      <div className="px-8 py-4 bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200/30 dark:border-neutral-700/30">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tasks.length} files selected
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {formatFileSize(tasks.reduce((sum, task) => sum + task.fileSize, 0))} total
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-8 space-y-4">
        <motion.button
          onClick={onAddFiles}
          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1 bg-white/20 rounded-lg">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-lg">Add Files</span>
        </motion.button>

        <motion.button
          onClick={onAddFolder}
          className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg border border-neutral-200 dark:border-neutral-600"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="p-1 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
            <FolderOpen className="w-5 h-5" />
          </div>
          <span className="text-lg">Add Folder</span>
        </motion.button>

        {tasks.length > 0 && (
          <motion.button
            onClick={onClearAll}
            className="w-full flex items-center justify-center space-x-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium py-3 px-4 rounded-xl transition-all duration-200 border border-red-200 dark:border-red-800"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </motion.button>
        )}
      </div>

      {/* Drag and Drop Zone */}
      <div
        className={`mx-8 mb-6 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
          isDragOver
            ? 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20 scale-105'
            : 'border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <motion.div
          animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            isDragOver ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-neutral-100 dark:bg-neutral-800'
          }`}>
            <Upload className={`w-8 h-8 ${
              isDragOver ? 'text-primary-500' : 'text-gray-400'
            }`} />
          </div>
          <p className={`text-lg font-semibold mb-2 ${
            isDragOver ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {isDragOver ? 'Drop files here' : 'Drag & drop DOCX files'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            or use the buttons above to browse
          </p>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 space-y-3">
        <motion.button
          onClick={onAddFiles}
          className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          <span>Add Files</span>
        </motion.button>

        <motion.button
          onClick={onAddFolder}
          className="w-full flex items-center justify-center space-x-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium py-3 px-4 rounded-lg transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FolderOpen className="w-5 h-5" />
          <span>Add Folder</span>
        </motion.button>

        {tasks.length > 0 && (
          <motion.button
            onClick={onClearAll}
            className="w-full flex items-center justify-center space-x-2 bg-error-50 hover:bg-error-100 dark:bg-error-900/20 dark:hover:bg-error-900/30 text-error-600 dark:text-error-400 font-medium py-2 px-4 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </motion.button>
        )}
      </div>

      {/* Drag and Drop Zone */}
      <div
        className={`mx-6 mb-4 border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <motion.div
          animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Upload className={`w-8 h-8 mx-auto mb-2 ${
            isDragOver ? 'text-primary-500' : 'text-gray-400'
          }`} />
          <p className={`text-sm font-medium ${
            isDragOver ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
          }`}>
            {isDragOver ? 'Drop files here' : 'Drag & drop DOCX files'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            or use the buttons above
          </p>
        </motion.div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-hidden">
        <div className="px-6 mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-text-primary dark:text-text-inverse">
            Files ({tasks.length})
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6">
          <AnimatePresence>
            {tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No files added yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Add some DOCX files to get started
                </p>
              </motion.div>
            ) : (
              <div className="space-y-2 pb-6">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(task.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary dark:text-text-inverse truncate">
                          {task.fileName}
                        </p>
                        <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                          {formatFileSize(task.fileSize)}
                        </p>
                        
                        {/* Status Badge */}
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                          task.status === 'pending' ? 'status-pending' :
                          task.status === 'processing' ? 'status-processing' :
                          task.status === 'completed' ? 'status-completed' :
                          'status-failed'
                        }`}>
                          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </div>

                        {/* Error Message */}
                        {task.status === 'failed' && task.errorMessage && (
                          <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                            {task.errorMessage}
                          </p>
                        )}
                      </div>

                      <motion.button
                        onClick={() => onRemoveTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-error-500 transition-all duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
