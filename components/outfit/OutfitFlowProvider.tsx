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

export type Undertone = 'warm' | 'cool' | 'neutral'

export type Model = {
  id: string
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
}

export const FALLBACK_MODEL: Model = {
  id: 'carmen',
  name: 'Carmen',
  image: '/outfit/models/carmen-card.jpg',
  dossierImage: '/outfit/models/carmen-dossier.jpg',
  poseCount: 15,
  tagline: 'Tông da: Warm Neutral',
  undertone: 'neutral',
  height: '1m65',
  bodyShape: 'Đồng hồ cát',
  waist: '64cm',
  personalColor: 'Autumn Soft',
}

export type Pose = {
  id: string
  label: string
}

export const DEFAULT_POSE: Pose = { id: 'front', label: 'Đứng thẳng phía trước' }

export type FlowStep = 1 | 2 | 3 | 4

type OutfitFlowContextValue = {
  selectedGarment: Garment
  setSelectedGarment: (garment: Garment) => void
  selectedModel: Model
  setSelectedModel: (model: Model) => void
  selectedPose: Pose
  setSelectedPose: (pose: Pose) => void
  maxStepReached: FlowStep
  markStepVisited: (step: FlowStep) => void
}

const OutfitFlowContext = createContext<OutfitFlowContextValue | null>(null)

export function OutfitFlowProvider({
  children,
  initialModel,
}: {
  children: ReactNode
  initialModel?: Model
}) {
  const [selectedGarment, setSelectedGarment] = useState<Garment>(DEFAULT_GARMENT)
  const [selectedModel, setSelectedModel] = useState<Model>(initialModel ?? FALLBACK_MODEL)
  const [selectedPose, setSelectedPose] = useState<Pose>(DEFAULT_POSE)
  const [maxStepReached, setMaxStepReached] = useState<FlowStep>(1)

  function markStepVisited(step: FlowStep) {
    setMaxStepReached((current) => (step > current ? step : current))
  }

  return (
    <OutfitFlowContext.Provider
      value={{
        selectedGarment,
        setSelectedGarment,
        selectedModel,
        setSelectedModel,
        selectedPose,
        setSelectedPose,
        maxStepReached,
        markStepVisited,
      }}
    >
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
