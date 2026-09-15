export type FaqCategory = 'account' | 'personal-color' | 'fitting-room' | 'policy'
export const FAQ_CATEGORIES: FaqCategory[] = ['account', 'personal-color', 'fitting-room', 'policy']

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
