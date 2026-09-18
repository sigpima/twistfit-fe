import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { ColorMetricsDetail, ColorMetricsSummary } from './ColorMetricsSection'

const RESULT = {
  hueResult: 'cool' as const,
  valueResult: 'medium' as const,
  chromaResult: 'neutral' as const,
  hueScore: 80,
  valueScore: 0,
  chromaScore: 50,
}

describe('ColorMetricsSummary', () => {
  it('renders the summary heading and the three axis results', () => {
    renderWithIntl(<ColorMetricsSummary result={RESULT} />)
    expect(screen.getByText('Tổng quan sắc diện')).toBeInTheDocument()
    expect(screen.getByText('Lạnh')).toBeInTheDocument()
    expect(screen.getByText('Trung bình')).toBeInTheDocument()
    expect(screen.getByText('Trung tính')).toBeInTheDocument()
  })
})

describe('ColorMetricsDetail', () => {
  it('renders the heading and the three axis scores', () => {
    renderWithIntl(<ColorMetricsDetail result={RESULT} />)
    expect(screen.getByText('Chi tiết chỉ số màu sắc')).toBeInTheDocument()
    expect(screen.getByText('80/100')).toBeInTheDocument()
    expect(screen.getByText('0/100')).toBeInTheDocument()
    expect(screen.getByText('50/100')).toBeInTheDocument()
  })

  it('omits the score row when a score is missing (older attempts)', () => {
    renderWithIntl(
      <ColorMetricsDetail
        result={{ hueResult: 'cool', valueResult: 'medium', chromaResult: 'neutral' }}
      />
    )
    expect(screen.queryByText(/\/100/)).not.toBeInTheDocument()
    expect(screen.getByText('Lạnh')).toBeInTheDocument()
  })
})
