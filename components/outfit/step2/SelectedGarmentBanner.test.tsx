import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import SelectedGarmentBanner from './SelectedGarmentBanner'
import { OutfitFlowProvider, DEFAULT_GARMENT } from '../OutfitFlowProvider'

describe('SelectedGarmentBanner', () => {
  it('shows the garment selected in step 1 and a link back to change it', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <SelectedGarmentBanner />
      </OutfitFlowProvider>
    )
    expect(screen.getByText(DEFAULT_GARMENT.name)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Đổi áo' })).toHaveAttribute('href', '/outfit/step-1')
  })
})
