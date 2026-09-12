import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RenderSettings from './RenderSettings'

describe('RenderSettings', () => {
  it('toggles the HD 4K and Smart Fit Physics switches independently', () => {
    render(<RenderSettings />)
    const hdToggle = screen.getByLabelText('Chế độ chất lượng cao HD 4K') as HTMLInputElement
    const physicsToggle = screen.getByLabelText('Mô phỏng chuyển động vải Smart Fit Physics') as HTMLInputElement

    expect(hdToggle.checked).toBe(true)
    expect(physicsToggle.checked).toBe(true)

    fireEvent.click(hdToggle)
    expect(hdToggle.checked).toBe(false)
    expect(physicsToggle.checked).toBe(true)
  })
})
