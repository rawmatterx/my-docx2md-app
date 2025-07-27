import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Zap,
  FolderOpen,
  TrendingUp
} from 'lucide-react'
import type { ConversionTask } from '../../../preload/preload'

interface ProcessingPanelProps {
  tasks: ConversionTask[]
  isConverting: boolean
  conversionProgress: number
  onStartConversion: () => void
  onOpenOutputFolder: () => void
  outputDirectory: string
}

export function ProcessingPanel({
  tasks,
  isConverting,
  conversionProgress,
  onStartConversion,
  onOpenOutputFolder,
  outputDirectory
}: ProcessingPanelProps) {
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    processing: tasks.filter(t => t.status === 'processing').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length
  }

  const canStartConversion = tasks.length > 0 && !isConverting

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-8 border-b border-white/20 bg-gradient-to-br from-white/50 to-white">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Processing Center
          </h2>
        </div>
        <p className="text-sm text-slate-600 ml-5">
          Monitor conversion progress and manage operations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="px-8 py-6 bg-gradient-to-r from-gray-50/50 to-white dark:from-gray-800/30 dark:to-gray-900/30">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.processing}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
          </div>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="p-8">
        <motion.button
          onClick={onStartConversion}
          disabled={!canStartConversion}
          className={`w-full flex items-center justify-center space-x-4 font-bold py-6 px-8 rounded-2xl transition-all duration-300 ${
            canStartConversion
              ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white shadow-2xl hover:shadow-green-500/25 transform hover:scale-105'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
          }`}
          whileHover={canStartConversion ? { scale: 1.02, y: -2 } : {}}
          whileTap={canStartConversion ? { scale: 0.98 } : {}}
        >
          {isConverting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="p-2 bg-white/20 rounded-xl"
              >
                <Zap className="w-8 h-8" />
              </motion.div>
              <div>
                <div className="text-xl">Converting Files...</div>
                <div className="text-sm opacity-80">AI-powered transformation in progress</div>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 bg-white/20 rounded-xl">
                <Play className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xl">Start Conversion</div>
                <div className="text-sm opacity-80">Transform {stats.total} files to Markdown</div>
              </div>
            </>
          )}
        </motion.button>
      </div>

      {/* Progress Section */}
      <AnimatePresence>
        {(isConverting || stats.completed > 0 || stats.failed > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 mb-6"
          >
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary dark:text-text-inverse">
                  Progress Overview
                </h3>
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {Math.round(conversionProgress)}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${conversionProgress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-success-600 dark:text-success-400">
                    {stats.completed}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Completed
                  </div>
                </div>
                
                <div className="text-center p-3 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-error-600 dark:text-error-400">
                    {stats.failed}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Failed
                  </div>
                </div>

                <div className="text-center p-3 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                    {stats.processing}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Processing
                  </div>
                </div>

                <div className="text-center p-3 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-slate-600">
                    {stats.pending}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Pending
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time File Status */}
      <div className="flex-1 overflow-hidden">
        <div className="px-6 mb-4">
          <h3 className="text-lg font-semibold text-text-primary dark:text-text-inverse mb-3">
            Real-time Status
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6">
          <AnimatePresence>
            {tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Ready to Convert
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Add files to see real-time conversion progress
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3 pb-6">
                {tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-white dark:bg-neutral-800 rounded-lg p-4 shadow-sm border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {task.status === 'pending' && (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        {task.status === 'processing' && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Zap className="w-5 h-5 text-warning-500" />
                          </motion.div>
                        )}
                        {task.status === 'completed' && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <CheckCircle className="w-5 h-5 text-success-500" />
                          </motion.div>
                        )}
                        {task.status === 'failed' && (
                          <AlertCircle className="w-5 h-5 text-error-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary dark:text-text-inverse truncate">
                          {task.fileName}
                        </p>
                        
                        {/* Status Text */}
                        <p className={`text-xs mt-1 ${
                          task.status === 'pending' ? 'text-gray-500' :
                          task.status === 'processing' ? 'text-warning-600 dark:text-warning-400' :
                          task.status === 'completed' ? 'text-success-600 dark:text-success-400' :
                          'text-error-600 dark:text-error-400'
                        }`}>
                          {task.status === 'pending' && 'Waiting to process...'}
                          {task.status === 'processing' && 'Converting to Markdown...'}
                          {task.status === 'completed' && 'Successfully converted'}
                          {task.status === 'failed' && (task.errorMessage || 'Conversion failed')}
                        </p>
                      </div>

                      {/* Processing Animation */}
                      {task.status === 'processing' && (
                        <div className="flex space-x-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-warning-500 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Output Folder Action */}
      {outputDirectory && (stats.completed > 0 || !isConverting) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 border-t border-gray-200 dark:border-gray-700"
        >
          <motion.button
            onClick={onOpenOutputFolder}
            className="w-full flex items-center justify-center space-x-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium py-3 px-4 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FolderOpen className="w-5 h-5" />
            <span>Open Output Folder</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}
