import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FrameSwitcher from './FrameSwitcher'

describe('FrameSwitcher', () => {
  it('displays the current frame name', () => {
    render(<FrameSwitcher currentName="Spring · Bright" onPrev={() => {}} onNext={() => {}} />)
    expect(screen.getByText('Spring · Bright')).toBeInTheDocument()
  })

  it('calls onPrev when the previous button is clicked', () => {
    const onPrev = vi.fn()
    render(<FrameSwitcher currentName="Spring · Bright" onPrev={onPrev} onNext={() => {}} />)
    fireEvent.click(screen.getByLabelText('Frame trước'))
    expect(onPrev).toHaveBeenCalledTimes(1)
  })

  it('calls onNext when the next button is clicked', () => {
    const onNext = vi.fn()
    render(<FrameSwitcher currentName="Spring · Bright" onPrev={() => {}} onNext={onNext} />)
    fireEvent.click(screen.getByLabelText('Frame sau'))
    expect(onNext).toHaveBeenCalledTimes(1)
  })
})
