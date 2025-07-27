import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Moon, Sun, Monitor, Sparkles } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

export function TitleBar() {
  const { theme, setTheme, isDark } = useTheme()

  const themeOptions = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' }
  ]

  return (
    <motion.div
      className="h-16 bg-gradient-to-r from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between px-8 select-none backdrop-blur-xl"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* App Title */}
      <div className="flex items-center space-x-4">
        <motion.div
          className="relative p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FileText className="w-6 h-6 text-white" />
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-2 h-2 text-yellow-600 m-0.5" />
          </motion.div>
        </motion.div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            DocX to Markdown Converter
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Transform documents with AI-powered precision
          </p>
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="flex items-center space-x-1 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-sm rounded-xl p-1.5 shadow-sm border border-neutral-200/50 dark:border-neutral-700/50">
        {themeOptions.map(({ value, icon: Icon, label }) => (
          <motion.button
            key={value}
            onClick={() => setTheme(value)}
            className={`p-2.5 rounded-lg transition-all duration-300 ${
              theme === value
                ? 'bg-primary-500 shadow-lg text-white scale-110'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
            }`}
            whileHover={{ scale: theme === value ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={`Switch to ${label} theme`}
          >
            <Icon className="w-5 h-5" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
