'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import LoginRequiredModal from './LoginRequiredModal'

type LoginRequiredModalContextValue = {
  isOpen: boolean
  openLoginRequiredModal: () => void
  closeLoginRequiredModal: () => void
}

const LoginRequiredModalContext = createContext<LoginRequiredModalContextValue | null>(null)

export function LoginRequiredModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const value: LoginRequiredModalContextValue = {
    isOpen,
    openLoginRequiredModal: () => setIsOpen(true),
    closeLoginRequiredModal: () => setIsOpen(false),
  }

  return (
    <LoginRequiredModalContext.Provider value={value}>
      {children}
      <LoginRequiredModal isOpen={isOpen} onClose={value.closeLoginRequiredModal} />
    </LoginRequiredModalContext.Provider>
  )
}

export function useLoginRequiredModal() {
  const context = useContext(LoginRequiredModalContext)
  if (!context) {
    throw new Error('useLoginRequiredModal must be used within a LoginRequiredModalProvider')
  }
  return context
}
