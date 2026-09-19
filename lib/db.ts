export type Axis = 'hue' | 'value' | 'chroma'

export type AxisValue = 'warm' | 'cool' | 'neutral' | 'dark' | 'light' | 'medium' | 'bright' | 'muted'

export type ParentSeason = 'spring' | 'summer' | 'autumn' | 'winter'
export const PARENT_SEASONS: ParentSeason[] = ['spring', 'summer', 'autumn', 'winter']

export type SubSeason =
  | 'light-spring' | 'true-spring' | 'bright-spring'
  | 'light-summer' | 'true-summer' | 'soft-summer'
  | 'soft-autumn' | 'true-autumn' | 'deep-autumn'
  | 'deep-winter' | 'true-winter' | 'bright-winter'

export const SUB_SEASONS: SubSeason[] = [
  'light-spring', 'true-spring', 'bright-spring',
  'light-summer', 'true-summer', 'soft-summer',
  'soft-autumn', 'true-autumn', 'deep-autumn',
  'deep-winter', 'true-winter', 'bright-winter',
]

export type BlogCategory = 'personal-color' | 'styling' | 'sustainable' | 'beauty' | 'community'
export const BLOG_CATEGORIES: BlogCategory[] = [
  'personal-color',
  'styling',
  'sustainable',
  'beauty',
  'community',
]

export type BlogPost = {
  id: number
  slug: string
  title: string
  excerpt: string
  content: string
  coverImageUrl: string
  coverImageAlt: string | null
  category: BlogCategory
  authorName: string | null
  isFeatured: boolean
  publishedAt: string
  createdAt: string
  updatedAt: string
}

export type QuizOption = {
  id: number
  label: string
  axisValue: AxisValue
  imageUrl: string | null
  sortOrder: number
}

export type QuizQuestion = {
  id: number
  questionText: string
  axis: Axis
  imageUrl: string | null
  sortOrder: number
  options: QuizOption[]
}

export type QuizAttemptResult = {
  id: number
  subSeason: SubSeason
  parentSeason: ParentSeason
  hueResult: AxisValue
  valueResult: AxisValue
  chromaResult: AxisValue
  userId: number | null
  createdAt: string
}
