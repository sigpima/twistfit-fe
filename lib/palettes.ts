export type Palette = {
  id: string
  name: string
  colors: string[]
}

export const PALETTES: Palette[] = [
  { id: 'spring-warm', name: 'Spring · Warm', colors: ['#F2A93B', '#F4C542', '#8FC93A', '#E8622C', '#C23B3B', '#B23A6B', '#6C4FA0', '#3F7FBF', '#2FA6A0', '#4AA648'] },
  { id: 'spring-light', name: 'Spring · Light', colors: ['#F6D65A', '#F2A6C4', '#8FD1E0', '#A6D96A', '#F2B84B', '#E88A9A', '#B7DC8F', '#6FB5D9', '#9E7FC9', '#F0E48A'] },
  { id: 'spring-bright', name: 'Spring · Bright', colors: ['#3EC77A', '#F5E23E', '#F2A93B', '#E8452C', '#D6336C', '#7B3FA0', '#2F6FE0', '#1FB6C9', '#4ADE80', '#F5D742'] },
  { id: 'summer-cool', name: 'Summer · Cool', colors: ['#3F7F9E', '#5B9BD5', '#6FB7C9', '#8B6CA8', '#C2568F', '#7A8FC2', '#5FA0A0', '#4A6FA5', '#9E6FA0', '#3F5F8F'] },
  { id: 'summer-light', name: 'Summer · Light', colors: ['#A9D4E0', '#C9A9D4', '#F2C6D6', '#B7D9A9', '#9EC9E0', '#D4B7E0', '#A9E0C6', '#E0C9A9', '#C6A9E0', '#9ED4C9'] },
  { id: 'summer-soft', name: 'Summer · Soft', colors: ['#8A7F6A', '#9E8FA0', '#7F8F7A', '#A08F7F', '#6A7F8F', '#8F7A8A', '#7F9E9E', '#9E7F7A', '#6A8A7F', '#8F8A6A'] },
  { id: 'autumn-warm', name: 'Autumn · Warm', colors: ['#2F8F6A', '#D9822B', '#B2481C', '#8F3F2F', '#2F6F5A', '#C9A22B', '#7A3F1C', '#4F7F3F', '#B2601C', '#2F5F4F'] },
  { id: 'autumn-deep', name: 'Autumn · Deep', colors: ['#1F5F5A', '#6F1F2F', '#8F4F1F', '#2F4F1F', '#4F2F1F', '#7F5F1F', '#1F3F3F', '#5F1F3F', '#3F5F2F', '#6F3F1F'] },
  { id: 'autumn-soft', name: 'Autumn · Soft', colors: ['#8F7A5F', '#9E8F6A', '#7A8F6A', '#8F6A5F', '#6A7A5F', '#9E7A6A', '#7F8F7F', '#8A7A6F', '#6F8A7A', '#9E8A7F'] },
  { id: 'winter-cool', name: 'Winter · Cool', colors: ['#1F3F6F', '#2F5F8F', '#0F6F6F', '#3F2F6F', '#6F1F4F', '#1F4F8F', '#4F1F6F', '#0F4F5F', '#2F1F5F', '#1F6F8F'] },
  { id: 'winter-deep', name: 'Winter · Deep', colors: ['#0F1F4F', '#3F0F2F', '#4F0F3F', '#0F3F3F', '#2F0F4F', '#4F0F1F', '#0F2F4F', '#3F0F4F', '#1F0F3F', '#0F4F2F'] },
  { id: 'winter-bright', name: 'Winter · Bright', colors: ['#2F6FE0', '#D6336C', '#F5E23E', '#7B3FA0', '#0FBF9F', '#E0247A', '#3EC77A', '#2F2FE0', '#F5D742', '#C71585'] },
]
