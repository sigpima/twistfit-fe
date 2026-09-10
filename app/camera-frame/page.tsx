'use client'

import { useState } from 'react'
import CameraView from '@/components/CameraView'
import FrameOverlay from '@/components/FrameOverlay'
import FrameSwitcher from '@/components/FrameSwitcher'
import { PALETTES } from '@/lib/palettes'
import { nextIndex, prevIndex } from '@/lib/frameCycle'

export default function CameraFramePage() {
  const [index, setIndex] = useState(0)
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
