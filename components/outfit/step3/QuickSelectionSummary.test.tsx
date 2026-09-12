import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import QuickSelectionSummary from './QuickSelectionSummary'
import { OutfitFlowProvider, DEFAULT_GARMENT, DEFAULT_MODEL } from '../OutfitFlowProvider'

describe('QuickSelectionSummary', () => {
  it('shows the garment and model selected in previous steps', () => {
    render(
      <OutfitFlowProvider>
        <QuickSelectionSummary />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(DEFAULT_GARMENT.name)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(DEFAULT_MODEL.name))).toBeInTheDocument()
  })
})
