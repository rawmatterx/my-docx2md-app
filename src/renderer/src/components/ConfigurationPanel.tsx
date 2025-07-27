import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  FolderOpen, 
  Eye, 
  BarChart3, 
  FileText, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Folder
} from 'lucide-react'
import type { ConversionTask } from '../../../preload/preload'

interface ConfigurationPanelProps {
  outputDirectory: string
  onSelectOutputDirectory: () => void
  tasks: ConversionTask[]
  isConverting: boolean
}

export function ConfigurationPanel({
  outputDirectory,
  onSelectOutputDirectory,
  tasks,
  isConverting
}: ConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState<'settings' | 'preview' | 'logs'>('settings')

  const stats = {
    total: tasks.length,
    totalSize: tasks.reduce((sum, task) => sum + task.fileSize, 0),
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    pending: tasks.filter(t => t.status === 'pending').length
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatPath = (path: string) => {
    if (path.length > 40) {
      return '...' + path.slice(-37)
    }
    return path
  }

  const tabs = [
    { id: 'settings' as const, label: 'Settings', icon: Settings },
    { id: 'preview' as const, label: 'Preview', icon: Eye },
    { id: 'logs' as const, label: 'Summary', icon: BarChart3 }
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-br from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-900">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Configuration
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-5">
          Customize settings and preview results
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-8 pt-6">
        <div className="flex space-x-1 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl p-1.5 backdrop-blur-sm">
          {tabs.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === id
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-lg scale-105'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
              }`}
              whileHover={{ scale: activeTab === id ? 1.05 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </div>
          Configuration & Output
        </h2>
        <p className="text-sm text-text-secondary dark:text-gray-400">
          Configure settings and preview results
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 pt-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-6"
            >
              {/* Output Directory */}
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-inverse mb-3">
                  Output Directory
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <Folder className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-mono text-text-primary dark:text-text-inverse truncate">
                        {formatPath(outputDirectory)}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={onSelectOutputDirectory}
                    disabled={isConverting}
                    className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                      isConverting
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300'
                    }`}
                    whileHover={!isConverting ? { scale: 1.02 } : {}}
                    whileTap={!isConverting ? { scale: 0.98 } : {}}
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Change Directory</span>
                  </motion.button>
                </div>
              </div>

              {/* Conversion Settings */}
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-inverse mb-3">
                  Conversion Options
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-inverse">
                        Preserve Formatting
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        Keep headings, lists, and tables
                      </p>
                    </div>
                    <div className="w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-inverse">
                        Link Preservation
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        Maintain hyperlinks and references
                      </p>
                    </div>
                    <div className="w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-text-primary dark:text-text-inverse">
                        Image References
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        Convert image references to Markdown
                      </p>
                    </div>
                    <div className="w-5 h-5 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-success-600 dark:text-success-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Conversion Engine
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Using Mammoth.js + html2text for high-quality DOCX to Markdown conversion
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preview' && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Preview Coming Soon
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Side-by-side preview of converted content will be available in the next update
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6 space-y-6"
            >
              {/* Statistics Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">
                        {stats.total}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        Total Files
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">
                        {stats.completed}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        Completed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-error-100 dark:bg-error-900/30 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-error-600 dark:text-error-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">
                        {stats.failed}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        Failed
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-text-primary dark:text-text-inverse">
                        {formatFileSize(stats.totalSize)}
                      </p>
                      <p className="text-xs text-text-secondary dark:text-gray-400">
                        Total Size
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-inverse mb-4">
                  Recent Activity
                </h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No activity yet
                      </p>
                    </div>
                  ) : (
                    tasks.slice().reverse().map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          task.status === 'completed' ? 'bg-success-500' :
                          task.status === 'failed' ? 'bg-error-500' :
                          task.status === 'processing' ? 'bg-warning-500' :
                          'bg-gray-400'
                        }`} />
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary dark:text-text-inverse truncate">
                            {task.fileName}
                          </p>
                          <p className="text-xs text-text-secondary dark:text-gray-400">
                            {task.status === 'completed' && 'Successfully converted'}
                            {task.status === 'failed' && 'Conversion failed'}
                            {task.status === 'processing' && 'Converting...'}
                            {task.status === 'pending' && 'Waiting to process'}
                          </p>
                        </div>

                        <div className="text-xs text-text-secondary dark:text-gray-400">
                          {formatFileSize(task.fileSize)}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
