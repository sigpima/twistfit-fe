'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import CameraView from '@/components/CameraView'
import FrameOverlay from '@/components/FrameOverlay'
import FrameSwitcher from '@/components/FrameSwitcher'
import { PALETTES } from '@/lib/palettes'
import { nextIndex, prevIndex } from '@/lib/frameCycle'
import { resolvePaletteIndex } from '@/lib/resolvePaletteIndex'

export default function CameraFramePage() {
  const searchParams = useSearchParams()
  const [index, setIndex] = useState(() => resolvePaletteIndex(searchParams.get('palette')))
  const current = PALETTES[index]

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden bg-black">
      <CameraView />
      <FrameOverlay colors={current.colors} />
      <FrameSwitcher
        currentName={current.name}
        onPrev={() => setIndex((i) => prevIndex(i, PALETTES.length))}
        onNext={() => setIndex((i) => nextIndex(i, PALETTES.length))}
      />
    </main>
  )
}
