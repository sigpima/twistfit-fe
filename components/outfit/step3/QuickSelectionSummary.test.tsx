import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import QuickSelectionSummary from './QuickSelectionSummary'
import { OutfitFlowProvider, DEFAULT_GARMENT, FALLBACK_MODEL } from '../OutfitFlowProvider'

describe('QuickSelectionSummary', () => {
  it('shows the garment and model selected in previous steps', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <QuickSelectionSummary />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(DEFAULT_GARMENT.name)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(FALLBACK_MODEL.name))).toBeInTheDocument()
  })
})
