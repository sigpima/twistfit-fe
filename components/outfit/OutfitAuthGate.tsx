'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { useLoginRequiredModal } from '@/components/auth/LoginRequiredModalProvider'

export default function OutfitAuthGate() {
  const { user, isHydrated } = useAuth()
  const { openLoginRequiredModal } = useLoginRequiredModal()
  const router = useRouter()

  useEffect(() => {
    if (!isHydrated || user) return
    openLoginRequiredModal()
    router.replace('/')
  }, [isHydrated, user, openLoginRequiredModal, router])

  return null
}
