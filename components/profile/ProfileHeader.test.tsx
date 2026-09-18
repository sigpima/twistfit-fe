import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ProfileHeader from './ProfileHeader'
import type { AuthUser } from '@/components/auth/AuthProvider'

const USER: AuthUser = {
  name: 'Linh Đan',
  username: null,
  email: 'linh@example.com',
  phone: null,
  role: 'user',
  birthDate: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  createdAt: '2026-01-15T00:00:00Z',
}

describe('ProfileHeader', () => {
  it('renders the avatar initial, name, email and member-since date', () => {
    renderWithIntl(<ProfileHeader user={USER} />)
    expect(screen.getByText('L')).toBeInTheDocument()
    expect(screen.getByText('Linh Đan')).toBeInTheDocument()
    expect(screen.getByText('linh@example.com')).toBeInTheDocument()
    expect(screen.getByText(/Thành viên từ/)).toBeInTheDocument()
  })
})
