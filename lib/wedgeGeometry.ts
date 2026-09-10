export type Wedge = {
  color: string
  path: string
}

export function buildWedges(
  colors: string[],
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number
): Wedge[] {
  const count = colors.length
  if (count === 0) return []

  const anglePerWedge = (2 * Math.PI) / count
  const wedges: Wedge[] = []

  for (let i = 0; i < count; i++) {
    const startAngle = i * anglePerWedge - Math.PI / 2
    const endAngle = startAngle + anglePerWedge

    const x1Outer = centerX + outerRadius * Math.cos(startAngle)
    const y1Outer = centerY + outerRadius * Math.sin(startAngle)
    const x2Outer = centerX + outerRadius * Math.cos(endAngle)
    const y2Outer = centerY + outerRadius * Math.sin(endAngle)

    const x1Inner = centerX + innerRadius * Math.cos(endAngle)
    const y1Inner = centerY + innerRadius * Math.sin(endAngle)
    const x2Inner = centerX + innerRadius * Math.cos(startAngle)
    const y2Inner = centerY + innerRadius * Math.sin(startAngle)

    const largeArc = anglePerWedge > Math.PI ? 1 : 0

    const path = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
      'Z',
    ].join(' ')

    wedges.push({ color: colors[i], path })
  }

  return wedges
}
