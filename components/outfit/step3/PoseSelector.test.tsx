import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PoseSelector from './PoseSelector'
import { OutfitFlowProvider } from '../OutfitFlowProvider'

describe('PoseSelector', () => {
  it('shows the default pose as selected', () => {
    render(
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
    render(
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
