import { describe, expect, it, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import ForumPostViewDialog from './ForumPostViewDialog'
import type { ForumPost } from '@/lib/forum'

const POST: ForumPost = {
  id: 3,
  title: 'Bài chờ duyệt',
  body: 'Nội dung **in đậm** của bài viết.',
  imageUrl: 'https://example.com/outfit.jpg',
  category: 'styling-help',
  status: 'pending',
  authorId: 5,
  authorName: 'Tác giả',
  likeCount: 0,
  likedByMe: false,
  commentCount: 0,
  bookmarkedByMe: false,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

describe('ForumPostViewDialog', () => {
  it('renders nothing when there is no post', () => {
    const { container } = renderWithIntl(<ForumPostViewDialog post={null} onClose={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the post title, author, image and formatted body', () => {
    renderWithIntl(<ForumPostViewDialog post={POST} onClose={vi.fn()} />)

    expect(screen.getByText('Bài chờ duyệt')).toBeInTheDocument()
    expect(screen.getByText(/Tác giả/)).toBeInTheDocument()
    expect(screen.getByAltText('')).toHaveAttribute('src', 'https://example.com/outfit.jpg')
    expect(screen.getByText('in đậm').tagName).toBe('STRONG')
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderWithIntl(<ForumPostViewDialog post={POST} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }))

    expect(onClose).toHaveBeenCalled()
  })
})
