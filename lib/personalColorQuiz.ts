// Demo quiz config — placeholder question bank until the real personal-color
// question set and scoring rules are configured externally.

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type QuizOption = {
  label: string
  season: Season
}

export type QuizQuestion = {
  id: string
  question: string
  options: QuizOption[]
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'vein-color',
    question: 'Tĩnh mạch ở cổ tay bạn có màu gì khi nhìn dưới ánh sáng tự nhiên?',
    options: [
      { label: 'Xanh lá hoặc xanh ô liu', season: 'autumn' },
      { label: 'Xanh dương hoặc tím', season: 'winter' },
      { label: 'Xanh dương nhạt, khó phân biệt', season: 'summer' },
      { label: 'Xanh lá nhạt, ánh vàng', season: 'spring' },
    ],
  },
  {
    id: 'sun-reaction',
    question: 'Làn da bạn phản ứng thế nào khi ra nắng?',
    options: [
      { label: 'Dễ cháy nắng, ít khi sạm', season: 'summer' },
      { label: 'Sạm màu nhanh, hiếm khi cháy', season: 'autumn' },
      { label: 'Rám nắng đều, khỏe khoắn', season: 'spring' },
      { label: 'Da trắng sáng, tương phản rõ khi cháy nắng', season: 'winter' },
    ],
  },
  {
    id: 'natural-hair',
    question: 'Màu tóc tự nhiên (chưa nhuộm) của bạn gần nhất với?',
    options: [
      { label: 'Nâu vàng, nâu hạt dẻ ánh đỏ', season: 'autumn' },
      { label: 'Đen tuyền hoặc nâu rất đậm', season: 'winter' },
      { label: 'Nâu tro, nâu hạt dẻ ánh xám', season: 'summer' },
      { label: 'Vàng óng, nâu sáng ánh vàng', season: 'spring' },
    ],
  },
  {
    id: 'natural-eye',
    question: 'Màu mắt tự nhiên của bạn là?',
    options: [
      { label: 'Nâu đen sắc nét', season: 'winter' },
      { label: 'Nâu hạt dẻ ấm', season: 'autumn' },
      { label: 'Nâu nhạt hoặc xám xanh dịu', season: 'summer' },
      { label: 'Nâu sáng hoặc xanh lục ánh vàng', season: 'spring' },
    ],
  },
  {
    id: 'jewelry-preference',
    question: 'Khi thử trang sức, loại nào tôn da bạn hơn?',
    options: [
      { label: 'Vàng ánh đồng, vàng ấm', season: 'autumn' },
      { label: 'Vàng nhạt, vàng hồng dịu', season: 'spring' },
      { label: 'Bạc, bạch kim sáng rõ', season: 'winter' },
      { label: 'Bạc mờ, tông pastel nhẹ', season: 'summer' },
    ],
  },
]
