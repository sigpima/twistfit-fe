import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import FrameOverlay from './FrameOverlay'

describe('FrameOverlay', () => {
  it('renders one SVG path per color', () => {
    const colors = ['#111111', '#222222', '#333333']
    const { container } = render(<FrameOverlay colors={colors} />)
    const paths = container.querySelectorAll('g[data-testid="wedge-ring"] path')
    expect(paths).toHaveLength(3)
  })

  it('renders each wedge with the matching fill color', () => {
    const colors = ['#111111', '#222222']
    const { container } = render(<FrameOverlay colors={colors} />)
    const paths = container.querySelectorAll('g[data-testid="wedge-ring"] path')
    expect(paths[0].getAttribute('fill')).toBe('#111111')
    expect(paths[1].getAttribute('fill')).toBe('#222222')
  })

  it('renders an oval cutout mask', () => {
    const { container } = render(<FrameOverlay colors={['#111111']} />)
    // Note: jsdom's querySelector (singular) unreliably returns null for
    // elements nested inside <mask>/<defs>, even though querySelectorAll
    // and getElementById find them — use querySelectorAll here instead.
    expect(container.querySelectorAll('#oval-cutout')).toHaveLength(1)
    expect(container.querySelectorAll('ellipse')).toHaveLength(1)
  })
})
