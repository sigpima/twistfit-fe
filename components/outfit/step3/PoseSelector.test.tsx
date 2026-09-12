import { describe, expect, it } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import PoseSelector from './PoseSelector'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

describe('PoseSelector', () => {
  it('shows the default pose as selected', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <PoseSelector />
      </OutfitFlowProvider>
    )
    expect(screen.getByText('Đã chọn: Đứng thẳng phía trước')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Đứng thẳng phía trước/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('updates the shared selected pose when a different pose is clicked', () => {
    renderWithIntl(
      <OutfitFlowProvider>
        <PoseSelector />
      </OutfitFlowProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: /Nghiêng cạnh bên/ }))
    expect(screen.getByText('Đã chọn: Nghiêng cạnh bên')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nghiêng cạnh bên/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Đứng thẳng phía trước/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })
})
