import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OutfitStepper from './OutfitStepper'

describe('OutfitStepper', () => {
  it('marks the current step and shows its label', () => {
    render(<OutfitStepper currentStep={1} />)
    expect(screen.getByText('Bước 1 · Đang chọn')).toBeInTheDocument()
    expect(screen.getByText('Chọn Quần Áo')).toBeInTheDocument()
  })

  it('renders upcoming steps as non-interactive text', () => {
    render(<OutfitStepper currentStep={1} />)
    expect(screen.queryByRole('link', { name: /Dáng & Khuôn Mặt/ })).not.toBeInTheDocument()
    expect(screen.getByText('Dáng & Khuôn Mặt')).toBeInTheDocument()
  })

  it('renders completed steps as links back to their route', () => {
    render(<OutfitStepper currentStep={3} />)
    expect(screen.getByRole('link', { name: /Chọn Quần Áo/ })).toHaveAttribute('href', '/outfit/step-1')
    expect(screen.getByRole('link', { name: /Dáng & Khuôn Mặt/ })).toHaveAttribute('href', '/outfit/step-2')
  })
})
