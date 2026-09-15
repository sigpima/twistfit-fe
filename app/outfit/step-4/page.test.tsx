import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import Step4Page from './page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('Step4Page', () => {
  it('renders the result heading', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <Step4Page />
      </OutfitFlowProvider>
    )
    expect(screen.getByRole('heading', { name: 'Kết Quả Thử Đồ' })).toBeInTheDocument()
  })
})
