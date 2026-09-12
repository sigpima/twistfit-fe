'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export type Garment = {
  id: string
  name: string
  image: string
  thumbnail: string
  matchScore: string
  tone: string
  type: string
}

export const DEFAULT_GARMENT: Garment = {
  id: 'peplum-pink',
  name: 'Áo Peplum Voan Xếp Ly Hồng Phấn',
  image: '/outfit/garment-peplum-main.jpg',
  thumbnail: '/outfit/garment-peplum-thumb.jpg',
  matchScore: '98%',
  tone: 'Light Summer',
  type: 'Top',
}

type OutfitFlowContextValue = {
  selectedGarment: Garment
  setSelectedGarment: (garment: Garment) => void
}

const OutfitFlowContext = createContext<OutfitFlowContextValue | null>(null)

export function OutfitFlowProvider({ children }: { children: ReactNode }) {
  const [selectedGarment, setSelectedGarment] = useState<Garment>(DEFAULT_GARMENT)

  return (
    <OutfitFlowContext.Provider value={{ selectedGarment, setSelectedGarment }}>
      {children}
    </OutfitFlowContext.Provider>
  )
}

export function useOutfitFlow() {
  const context = useContext(OutfitFlowContext)
  if (!context) {
    throw new Error('useOutfitFlow must be used within an OutfitFlowProvider')
  }
  return context
}
