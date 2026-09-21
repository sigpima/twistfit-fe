import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import OutfitStepper from './OutfitStepper'

describe('OutfitStepper', () => {
  it('marks the current step and shows its label', () => {
    renderWithIntl(<OutfitStepper currentStep={1} />)
    expect(screen.getByText('Bước 1 · Đang chọn')).toBeInTheDocument()
    expect(screen.getByText('Chọn Quần Áo')).toBeInTheDocument()
  })

  it('renders upcoming steps as non-interactive text', () => {
    renderWithIntl(<OutfitStepper currentStep={1} />)
    expect(screen.queryByRole('link', { name: /Dáng & Khuôn Mặt/ })).not.toBeInTheDocument()
    expect(screen.getByText('Dáng & Khuôn Mặt')).toBeInTheDocument()
  })

  it('renders completed steps as links back to their route', () => {
    renderWithIntl(<OutfitStepper currentStep={3} />)
    expect(screen.getByRole('link', { name: /Chọn Quần Áo/ })).toHaveAttribute('href', '/outfit/step-1')
    expect(screen.getByRole('link', { name: /Dáng & Khuôn Mặt/ })).toHaveAttribute('href', '/outfit/step-2')
  })

  it('renders steps already visited ahead of the current step as clickable links', () => {
    renderWithIntl(<OutfitStepper currentStep={2} visitedSteps={[1, 2, 3]} />)
    expect(screen.getByRole('link', { name: /Xem Kết Quả/ })).toHaveAttribute('href', '/outfit/step-3')
  })

  it('does not link to a step that has not actually been visited', () => {
    renderWithIntl(<OutfitStepper currentStep={1} visitedSteps={[1]} />)
    expect(screen.queryByRole('link', { name: /Dáng & Khuôn Mặt/ })).not.toBeInTheDocument()
  })

  it('does not mark an intermediate step as visited when it was skipped over', () => {
    renderWithIntl(<OutfitStepper currentStep={3} visitedSteps={[1, 3]} />)
    expect(screen.queryByRole('link', { name: /Dáng & Khuôn Mặt/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Chọn Quần Áo/ })).toBeInTheDocument()
  })
})
