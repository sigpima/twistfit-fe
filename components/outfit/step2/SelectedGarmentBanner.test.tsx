import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import SelectedGarmentBanner from './SelectedGarmentBanner'
import { OutfitFlowProvider, DEFAULT_GARMENT } from '../OutfitFlowProvider'

describe('SelectedGarmentBanner', () => {
  it('shows the garment selected in step 1 and a link back to change it', () => {
    render(
      <OutfitFlowProvider>
        <SelectedGarmentBanner />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(DEFAULT_GARMENT.name)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đổi áo' })).toHaveAttribute('href', '/outfit/step-1')
  })
})
