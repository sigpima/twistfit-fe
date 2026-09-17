'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useOutfitFlow, type FlowStep } from './OutfitFlowProvider'
import OutfitStepper from './OutfitStepper'
import OutfitAuthGate from './OutfitAuthGate'

const STEP_BY_PATHNAME: Record<string, FlowStep> = {
  '/outfit/step-1': 1,
  '/outfit/step-2': 2,
  '/outfit/step-3': 3,
}

export default function OutfitFlowChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const currentStep = STEP_BY_PATHNAME[pathname] ?? 1
  const { maxStepReached, markStepVisited } = useOutfitFlow()

  useEffect(() => {
    markStepVisited(currentStep)
  }, [currentStep, markStepVisited])

  return (
    <>
      <OutfitAuthGate />
      <OutfitStepper currentStep={currentStep} maxStepReached={Math.max(currentStep, maxStepReached) as FlowStep} />
      {children}
    </>
  )
}
