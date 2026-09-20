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

export type Model = {
  id: string
  name: string
  image: string
  sideImage: string | null
}

export const FALLBACK_MODEL: Model = {
  id: 'female-1',
  name: 'Dáng cao gầy',
  image: '/outfit/models/female-1.jpg',
  sideImage: '/outfit/models/female-1-side.jpg',
}

export type FlowStep = 1 | 2 | 3

export type OccasionTag = string
export type StyleTag = string
export type OccasionStyleMode = 'occasion' | 'style'

type OutfitFlowContextValue = {
  selectedGarment: Garment
  setSelectedGarment: (garment: Garment) => void
  selectedModel: Model
  setSelectedModel: (model: Model) => void
  maxStepReached: FlowStep
  markStepVisited: (step: FlowStep) => void
  occasionStyleMode: OccasionStyleMode
  setOccasionStyleMode: (mode: OccasionStyleMode) => void
  selectedOccasion: OccasionTag
  setSelectedOccasion: (tag: OccasionTag) => void
  selectedStyle: StyleTag
  setSelectedStyle: (tag: StyleTag) => void
  jobId: number | null
  setJobId: (id: number | null) => void
  suggestAccessories: boolean
  setSuggestAccessories: (value: boolean) => void
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
  const [maxStepReached, setMaxStepReached] = useState<FlowStep>(1)
  const [occasionStyleMode, setOccasionStyleMode] = useState<OccasionStyleMode>('occasion')
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionTag>('hang-ngay')
  const [selectedStyle, setSelectedStyle] = useState<StyleTag>('casual')
  const [jobId, setJobId] = useState<number | null>(null)
  const [suggestAccessories, setSuggestAccessories] = useState(true)

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
        maxStepReached,
        markStepVisited,
        occasionStyleMode,
        setOccasionStyleMode,
        selectedOccasion,
        setSelectedOccasion,
        selectedStyle,
        setSelectedStyle,
        jobId,
        setJobId,
        suggestAccessories,
        setSuggestAccessories,
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
