'use client'

import React from 'react'
import { useGlobalUI } from '@/context/GlobalUIContext'
import { Loader2, AlertTriangle, X } from 'lucide-react'

export default function GlobalOverlay() {
  const { isLoading, error, clearError } = useGlobalUI()

  if (!isLoading && !error) return null

  return (
    <>
      {/* 1. Fullscreen Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/70 backdrop-blur-md transition-all duration-300">
          <div className="relative flex flex-col items-center p-8 bg-card/45 border border-border/60 rounded-3xl shadow-2xl max-w-xs text-center space-y-4">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-3xl pointer-events-none" />
            <div className="relative p-4 bg-primary/10 rounded-2xl">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
            <div className="space-y-1 relative z-10">
              <h3 className="text-sm font-bold text-foreground">Đang xử lý</h3>
              <p className="text-xs text-muted-foreground">Vui lòng đợi trong giây lát...</p>
            </div>
          </div>
        </div>
      )}

      {/* 2. Global Error Popup Modal */}
      {error && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Top decorative gradient bar */}
            <div className="h-1.5 w-full bg-rose-500" />

            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="text-base font-bold text-foreground leading-snug">
                    {error.title}
                  </h3>
                  {error.code && (
                    <span className="text-[10px] font-mono bg-rose-500/10 text-rose-500 px-2 py-0.5 rounded">
                      Mã lỗi: {error.code}
                    </span>
                  )}
                </div>
                <button 
                  onClick={clearError}
                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message */}
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {error.message}
              </p>

              {/* Action Buttons */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={clearError}
                  className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-550 active:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/10 transition-all cursor-pointer text-center"
                >
                  Đồng ý
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
