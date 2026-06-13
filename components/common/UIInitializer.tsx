'use client'

import { useEffect } from 'react'
import { useGlobalUI } from '@/context/GlobalUIContext'
import { registerGlobalUIHandlers } from '@/services/api'

export default function UIInitializer() {
  const { showLoading, hideLoading, showError } = useGlobalUI()

  useEffect(() => {
    registerGlobalUIHandlers(showLoading, hideLoading, showError)
  }, [showLoading, hideLoading, showError])

  return null
}
