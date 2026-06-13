'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface ErrorInfo {
  title: string
  message: string
  code?: number
}

interface GlobalUIContextType {
  isLoading: boolean
  error: ErrorInfo | null
  showLoading: () => void
  hideLoading: () => void
  showError: (title: string, message: string, code?: number) => void
  clearError: () => void
}

const GlobalUIContext = createContext<GlobalUIContextType | undefined>(undefined)

export function GlobalUIProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ErrorInfo | null>(null)

  const showLoading = useCallback(() => {
    setIsLoading(true)
  }, [])

  const hideLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  const showError = useCallback((title: string, message: string, code?: number) => {
    setError({ title, message, code })
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <GlobalUIContext.Provider
      value={{
        isLoading,
        error,
        showLoading,
        hideLoading,
        showError,
        clearError,
      }}
    >
      {children}
    </GlobalUIContext.Provider>
  )
}

export function useGlobalUI() {
  const context = useContext(GlobalUIContext)
  if (context === undefined) {
    throw new Error('useGlobalUI must be used within a GlobalUIProvider')
  }
  return context
}
