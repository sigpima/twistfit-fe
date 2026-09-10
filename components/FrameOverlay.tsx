'use client'

import { buildWedges } from '@/lib/wedgeGeometry'

type FrameOverlayProps = {
  colors: string[]
}

const VIEWBOX_SIZE = 200
const CENTER = VIEWBOX_SIZE / 2
const INNER_RADIUS = 55
const OUTER_RADIUS = 95
const OVAL_STRETCH_Y = 1.3

export default function FrameOverlay({ colors }: FrameOverlayProps) {
  const wedges = buildWedges(colors, CENTER, CENTER, INNER_RADIUS, OUTER_RADIUS)

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <mask id="oval-cutout">
          <rect x="0" y="0" width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} fill="white" />
          <ellipse
            cx={CENTER}
            cy={CENTER}
            rx={INNER_RADIUS}
            ry={INNER_RADIUS * OVAL_STRETCH_Y}
            fill="black"
          />
        </mask>
      </defs>

      <rect
        x="0"
        y="0"
        width={VIEWBOX_SIZE}
        height={VIEWBOX_SIZE}
        fill="rgba(0,0,0,0.55)"
        mask="url(#oval-cutout)"
      />

      <g
        data-testid="wedge-ring"
        transform={`translate(${CENTER} ${CENTER}) scale(1 ${OVAL_STRETCH_Y}) translate(${-CENTER} ${-CENTER})`}
      >
        {wedges.map((wedge, index) => (
          <path key={index} d={wedge.path} fill={wedge.color} opacity={0.9} />
        ))}
      </g>
    </svg>
  )
}
