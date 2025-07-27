import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ConversionTask } from '../../../preload/preload'

interface ConversionStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
}

interface ConversionContextType {
  stats: ConversionStats
  updateStats: (tasks: ConversionTask[]) => void
  isConverting: boolean
  setIsConverting: (converting: boolean) => void
  lastConversionTime: Date | null
  setLastConversionTime: (time: Date) => void
}

const ConversionContext = createContext<ConversionContextType | undefined>(undefined)

export function ConversionProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<ConversionStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  })
  const [isConverting, setIsConverting] = useState(false)
  const [lastConversionTime, setLastConversionTime] = useState<Date | null>(null)

  const updateStats = useCallback((tasks: ConversionTask[]) => {
    const newStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      processing: tasks.filter(t => t.status === 'processing').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length
    }
    setStats(newStats)
  }, [])

  return (
    <ConversionContext.Provider value={{
      stats,
      updateStats,
      isConverting,
      setIsConverting,
      lastConversionTime,
      setLastConversionTime
    }}>
      {children}
    </ConversionContext.Provider>
  )
}

export function useConversion() {
  const context = useContext(ConversionContext)
  if (context === undefined) {
    throw new Error('useConversion must be used within a ConversionProvider')
  }
  return context
}
