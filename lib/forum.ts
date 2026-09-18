export type ForumCategory =
  | 'general'
  | 'outfit-showcase'
  | 'styling-help'
  | 'personal-color'
  | 'sustainable-swap'

export const FORUM_CATEGORIES: ForumCategory[] = [
  'general',
  'outfit-showcase',
  'styling-help',
  'personal-color',
  'sustainable-swap',
]

export type ForumPostStatus = 'pending' | 'published' | 'rejected' | 'hidden'

export type ForumPost = {
  id: number
  title: string
  body: string
  imageUrl: string | null
  category: ForumCategory
  status: ForumPostStatus
  authorId: number
  authorName: string
  likeCount: number
  likedByMe: boolean
  commentCount: number
  bookmarkedByMe: boolean
  canDelete: boolean
  deletedAt: string | null
  deletedByAdmin: boolean | null
  createdAt: string
  updatedAt: string
}

export type ForumPostInput = {
  title: string
  body: string
  category: ForumCategory
  imageUrl: string | null
}

export type ForumReportStatus = 'open' | 'resolved'

export type ForumReport = {
  id: number
  postId: number
  postTitle: string
  postStatus: ForumPostStatus
  reporterId: number
  reason: string
  status: ForumReportStatus
  createdAt: string
}

export type ForumComment = {
  id: number
  postId: number
  authorId: number
  authorName: string
  body: string
  createdAt: string
  updatedAt: string
  canDelete: boolean
}
