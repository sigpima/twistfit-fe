import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import messages from '@/messages/vi.json'
import { OutfitFlowProvider } from './OutfitFlowProvider'
import OutfitFlowChrome from './OutfitFlowChrome'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { LoginRequiredModalProvider } from '@/components/auth/LoginRequiredModalProvider'

let mockPathname = '/outfit/step-1'
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ replace: replaceMock }),
}))

function withIntl(ui: ReactElement) {
  return (
    <NextIntlClientProvider locale="vi" messages={messages}>
      <AuthProvider>
        <LoginRequiredModalProvider>{ui}</LoginRequiredModalProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  )
}

describe('OutfitFlowChrome', () => {
  it('derives the current step from the pathname and renders children', () => {
    mockPathname = '/outfit/step-2'
    render(
      withIntl(
        <OutfitFlowProvider>
          <OutfitFlowChrome>
            <p>Step 2 content</p>
          </OutfitFlowChrome>
        </OutfitFlowProvider>
      )
    )
    expect(screen.getByText('Bước 2 · Đang chọn')).toBeInTheDocument()
    expect(screen.getByText('Step 2 content')).toBeInTheDocument()
  })

  it('keeps steps already visited ahead of the current one clickable after navigating back', () => {
    mockPathname = '/outfit/step-1'
    const { rerender } = render(
      withIntl(
        <OutfitFlowProvider>
          <OutfitFlowChrome>
            <p>content</p>
          </OutfitFlowChrome>
        </OutfitFlowProvider>
      )
    )

    mockPathname = '/outfit/step-3'
    rerender(
      withIntl(
        <OutfitFlowProvider>
          <OutfitFlowChrome>
            <p>content</p>
          </OutfitFlowChrome>
        </OutfitFlowProvider>
      )
    )

    mockPathname = '/outfit/step-1'
    rerender(
      withIntl(
        <OutfitFlowProvider>
          <OutfitFlowChrome>
            <p>content</p>
          </OutfitFlowChrome>
        </OutfitFlowProvider>
      )
    )

    expect(screen.getByRole('link', { name: /Xem Kết Quả 3D/ })).toHaveAttribute('href', '/outfit/step-3')
  })
})
