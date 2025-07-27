import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Moon, Sun, Monitor } from 'lucide-react'
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
      className="h-12 bg-surface-light dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 select-none"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* App Title */}
      <div className="flex items-center space-x-3">
        <motion.div
          className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </motion.div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary dark:text-text-inverse">
            DocX to Markdown Converter
          </h1>
          <p className="text-xs text-text-secondary dark:text-gray-400">
            Modern bulk document conversion
          </p>
        </div>
      </div>

      {/* Theme Switcher */}
      <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {themeOptions.map(({ value, icon: Icon, label }) => (
          <motion.button
            key={value}
            onClick={() => setTheme(value)}
            className={`p-2 rounded-md transition-all duration-200 ${
              theme === value
                ? 'bg-white dark:bg-gray-700 shadow-sm text-primary-600 dark:text-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={`Switch to ${label} theme`}
          >
            <Icon className="w-4 h-4" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
