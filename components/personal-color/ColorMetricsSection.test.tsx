import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ColorMetricsSection from './ColorMetricsSection'

const RESULT = { hueResult: 'cool' as const, valueResult: 'medium' as const, chromaResult: 'neutral' as const }

describe('ColorMetricsSection', () => {
  it('renders the heading and the three axis results', () => {
    renderWithIntl(<ColorMetricsSection result={RESULT} />)
    expect(screen.getByText('Chi tiết chỉ số màu sắc')).toBeInTheDocument()
    expect(screen.getByText('Lạnh')).toBeInTheDocument()
    expect(screen.getByText('Trung bình')).toBeInTheDocument()
    expect(screen.getByText('Trung tính')).toBeInTheDocument()
  })
})
