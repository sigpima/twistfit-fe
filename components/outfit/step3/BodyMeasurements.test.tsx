import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BodyMeasurements from './BodyMeasurements'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

describe('BodyMeasurements', () => {
  it('shows the default measurements and the selected model body shape', () => {
    render(
      <OutfitFlowProvider>
        <BodyMeasurements />
      </OutfitFlowProvider>
    )
    expect(screen.getAllByText('1m65').length).toBeGreaterThan(0)
    expect(screen.getAllByText('50 kg').length).toBeGreaterThan(0)
    expect(screen.getByText('Đồng hồ cát')).toBeInTheDocument()
  })

  it('updates the height label when the slider moves', () => {
    render(
      <OutfitFlowProvider>
        <BodyMeasurements />
      </OutfitFlowProvider>
    )
    fireEvent.change(screen.getByLabelText('Chiều cao'), { target: { value: '170' } })
    expect(screen.getByText('1m70')).toBeInTheDocument()
  })

  it('increments and clamps the waist stepper', () => {
    render(
      <OutfitFlowProvider>
        <BodyMeasurements />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByLabelText('Tăng Vòng 2 (Eo)'))
    expect(screen.getByText('63')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Giảm Vòng 2 (Eo)'))
    expect(screen.getByText('62')).toBeInTheDocument()
  })
})
