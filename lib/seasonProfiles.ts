import type { SubSeason } from './db'

export type SeasonProfile = {
  displayName: string
  paletteHex: string[]
  description: string
  recommendations: {
    outfit: string
    lipstick: string
    accessory: string
  }
}

export const SEASON_PROFILES: Record<SubSeason, SeasonProfile> = {
  'light-spring': {
    displayName: 'Xuân Sáng (Light Spring)',
    paletteHex: ['#FFD9B3', '#FFF2CC', '#C9E4CA', '#F7C6C7', '#FCE38A', '#9FD8CB'],
    description:
      'Da tươi sáng, tóc và mắt màu nhạt ấm áp. Hợp các gam màu ấm nhẹ nhàng, tươi sáng, tránh màu quá đậm hoặc quá trầm khiến gương mặt bị lấn át.',
    recommendations: {
      outfit: 'Áo blazer be, đầm pastel ấm, phụ kiện vàng nhạt',
      lipstick: 'Hồng đào, cam san hô nhạt',
      accessory: 'Vàng nhạt (light gold), ngọc trai kem',
    },
  },
  'true-spring': {
    displayName: 'Xuân Thuần (True Spring)',
    paletteHex: ['#FF7F50', '#FFC72C', '#4CBB17', '#40E0D0', '#FF6347', '#FFB07C'],
    description: 'Tông da ấm rõ rệt, sắc độ trung bình, hợp màu tươi sáng rực rỡ vừa phải.',
    recommendations: {
      outfit: 'Áo sơ mi cam đất, chân váy vàng mù tạt',
      lipstick: 'Cam san hô, đỏ gạch ấm',
      accessory: 'Vàng 18K, đồng',
    },
  },
  'bright-spring': {
    displayName: 'Xuân Rực Rỡ (Bright Spring)',
    paletteHex: ['#FF4F79', '#00CED1', '#FFEA00', '#FF3131', '#FF8C00', '#39FF88'],
    description: 'Ấm áp nhưng sắc nét, độ tương phản khá cao, hợp màu ấm cực kỳ tươi sáng.',
    recommendations: {
      outfit: 'Set đồ màu block tương phản, phụ kiện ánh kim sáng',
      lipstick: 'Đỏ cam rực, hồng neon ấm',
      accessory: 'Vàng sáng bóng, đá màu rực',
    },
  },
  'light-summer': {
    displayName: 'Hè Sáng (Light Summer)',
    paletteHex: ['#AEC6E8', '#D8BFD8', '#F4C2C2', '#B5C9A8', '#D8A7B1', '#C9D6EA'],
    description: 'Da sáng, tông lạnh nhẹ nhàng, hợp các gam pastel lạnh dịu.',
    recommendations: {
      outfit: 'Áo len pastel xanh phấn, đầm hoa nhí lạnh',
      lipstick: 'Hồng phấn lạnh, mận nhạt',
      accessory: 'Bạc, bạch kim nhạt',
    },
  },
  'true-summer': {
    displayName: 'Hè Thuần (True Summer)',
    paletteHex: ['#6C93B8', '#A76A82', '#C05C7E', '#8FA3B3', '#A6A2D0', '#B0789A'],
    description: 'Tông lạnh rõ rệt, sắc độ trung bình, hợp màu lạnh dịu vừa phải.',
    recommendations: {
      outfit: 'Áo blazer xanh navy dịu, khăn lụa hoa văn lạnh',
      lipstick: 'Mận hồng, hồng dâu dịu',
      accessory: 'Bạc, đá xanh dịu',
    },
  },
  'soft-summer': {
    displayName: 'Hè Dịu (Soft Summer)',
    paletteHex: ['#C8A2A2', '#A9BA9D', '#B49A8B', '#A6A9C7', '#B08CA6', '#C9BFB0'],
    description: 'Lạnh nhẹ nhưng độ bão hoà thấp, tương phản mờ nhạt, hợp tông trầm nhẹ nhàng.',
    recommendations: {
      outfit: 'Set đồ tông trầm nhẹ, chất liệu mờ (matte)',
      lipstick: 'Hồng đất, be hồng',
      accessory: 'Bạc mờ, đá màu trầm',
    },
  },
  'soft-autumn': {
    displayName: 'Thu Dịu (Soft Autumn)',
    paletteHex: ['#A98B6D', '#8A9A5B', '#C98A5D', '#C9A66B', '#C08769', '#A68A64'],
    description: 'Ấm nhẹ, độ bão hoà thấp, hợp tông đất nhẹ nhàng.',
    recommendations: {
      outfit: 'Áo len be, quần kaki, phụ kiện gỗ',
      lipstick: 'Cam đất nhạt, hồng be',
      accessory: 'Vàng đồng mờ, gỗ, đá mắt hổ',
    },
  },
  'true-autumn': {
    displayName: 'Thu Thuần (True Autumn)',
    paletteHex: ['#B7410E', '#6B8E23', '#E1AD01', '#8B5A2B', '#D2691E', '#B8860B'],
    description: 'Ấm rõ rệt, độ bão hoà trung bình đến đậm, hợp tông đất ấm rực.',
    recommendations: {
      outfit: 'Áo khoác da nâu, đầm màu bí ngô',
      lipstick: 'Cam gạch, nâu đỏ',
      accessory: 'Đồng, vàng cổ điển',
    },
  },
  'deep-autumn': {
    displayName: 'Thu Sâu (Deep Autumn)',
    paletteHex: ['#4A2C1D', '#3D3D1F', '#A0421D', '#1B4D3E', '#5C4033', '#7A3B12'],
    description: 'Ấm và sẫm màu, tương phản khá rõ, hợp tông đất đậm sâu.',
    recommendations: {
      outfit: 'Áo khoác dạ nâu đậm, set đồ tông trầm sâu',
      lipstick: 'Nâu đỏ đậm, đỏ mận',
      accessory: 'Vàng đồng đậm, đá màu tối',
    },
  },
  'deep-winter': {
    displayName: 'Đông Sâu (Deep Winter)',
    paletteHex: ['#000000', '#36454F', '#6A0033', '#046307', '#B22222', '#002147'],
    description: 'Lạnh và sẫm màu, tương phản cao, hợp tông đậm sắc lạnh.',
    recommendations: {
      outfit: 'Set đồ đen tuyền, áo khoác navy đậm',
      lipstick: 'Đỏ đậm, mận sẫm',
      accessory: 'Bạc, kim cương, đá đen',
    },
  },
  'true-winter': {
    displayName: 'Đông Thuần (True Winter)',
    paletteHex: ['#003399', '#FF0033', '#E0FFFF', '#FF00FF', '#FFFFFF', '#000000'],
    description: 'Lạnh rõ rệt, sắc nét, tương phản cao, hợp màu lạnh trong trẻo.',
    recommendations: {
      outfit: 'Áo trắng phối đen, đầm xanh hoàng gia',
      lipstick: 'Đỏ tươi, hồng fuchsia',
      accessory: 'Bạc sáng bóng, kim cương',
    },
  },
  'bright-winter': {
    displayName: 'Đông Rực Rỡ (Bright Winter)',
    paletteHex: ['#FF1493', '#00BFFF', '#FF0000', '#FFFFFF', '#000000', '#F0F8FF'],
    description: 'Lạnh nhưng cực kỳ tươi sáng/rực, tương phản rất cao.',
    recommendations: {
      outfit: 'Set đồ tương phản đen trắng, điểm nhấn màu neon lạnh',
      lipstick: 'Đỏ rực, hồng neon lạnh',
      accessory: 'Bạc, đá màu sáng rực',
    },
  },
}
