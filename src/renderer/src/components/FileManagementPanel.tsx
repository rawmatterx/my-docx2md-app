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
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-text-primary dark:text-text-inverse mb-2">
          File Management
        </h2>
        <p className="text-sm text-text-secondary dark:text-gray-400">
          Add DOCX files to convert to Markdown
        </p>
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
          className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-all duration-200"
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
                    className="group bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
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
