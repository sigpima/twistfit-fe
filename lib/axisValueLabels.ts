import type { AxisValue } from './db'

export const AXIS_VALUE_LABELS: Record<AxisValue, string> = {
  warm: 'Ấm',
  cool: 'Lạnh',
  neutral: 'Trung tính',
  dark: 'Sẫm',
  light: 'Sáng',
  medium: 'Trung bình',
  bright: 'Tươi sáng',
  muted: 'Trầm',
}

export const AXIS_VALUE_DOT_COLORS: Record<AxisValue, string> = {
  warm: '#F2994A',
  cool: '#4A89DC',
  neutral: '#9AA5B1',
  dark: '#6B5B4D',
  medium: '#B08968',
  light: '#E8D5C4',
  bright: '#D84B85',
  muted: '#9AA5B1',
}
