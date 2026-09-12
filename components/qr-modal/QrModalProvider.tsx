'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import QrModal from './QrModal'

type QrModalContextValue = {
  isOpen: boolean
  openQrModal: () => void
  closeQrModal: () => void
}

const QrModalContext = createContext<QrModalContextValue | null>(null)

export function QrModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const value: QrModalContextValue = {
    isOpen,
    openQrModal: () => setIsOpen(true),
    closeQrModal: () => setIsOpen(false),
  }

  return (
    <QrModalContext.Provider value={value}>
      {children}
      <QrModal isOpen={isOpen} onClose={value.closeQrModal} />
    </QrModalContext.Provider>
  )
}

export function useQrModal() {
  const context = useContext(QrModalContext)
  if (!context) {
    throw new Error('useQrModal must be used within a QrModalProvider')
  }
  return context
}
