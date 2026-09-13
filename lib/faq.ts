export type FaqCategory = 'personal-color' | 'fitting-room' | 'account' | 'stylist'
export const FAQ_CATEGORIES: FaqCategory[] = ['personal-color', 'fitting-room', 'account', 'stylist']

export type FaqHighlightIcon =
  | 'palette'
  | 'wb_sunny'
  | 'face_retouching_off'
  | 'center_focus_strong'
  | 'qr_code_scanner'
  | 'verified_user'
  | 'info'
  | 'lightbulb'

export const FAQ_HIGHLIGHT_ICONS: FaqHighlightIcon[] = [
  'palette',
  'wb_sunny',
  'face_retouching_off',
  'center_focus_strong',
  'qr_code_scanner',
  'verified_user',
  'info',
  'lightbulb',
]

export type FaqItem = {
  id: number
  categories: FaqCategory[]
  question: string
  answerMarkdown: string
  highlightIcon: FaqHighlightIcon | null
  highlightText: string | null
  createdAt: string
  updatedAt: string
}

export type FaqItemInput = {
  categories: FaqCategory[]
  question: string
  answerMarkdown: string
  highlightIcon: FaqHighlightIcon | null
  highlightText: string | null
}
