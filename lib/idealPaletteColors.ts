import type { SubSeason } from './db'

// 12 colors sampled from each season's palette-wheel illustration
// (public/personal-color/results/*.png), one per wedge, clockwise from
// the top-left wedge.
export const IDEAL_PALETTE_COLORS: Record<SubSeason, string[]> = {
  'light-spring': ['#f5e077', '#5f4632', '#bbda97', '#67b659', '#7efdf6', '#309cc3', '#9883be', '#555ab8', '#ffbeca', '#fd4173', '#f2bc98', '#f97569'],
  'true-spring': ['#fad6a6', '#8e4735', '#afc642', '#53803b', '#9bfd72', '#16a04a', '#00c8c8', '#624ca1', '#a685ca', '#cf3627', '#f1824b', '#f1c347'],
  'bright-spring': ['#fce303', '#202020', '#52e13a', '#029101', '#00cfd5', '#0534fe', '#0066b0', '#8403b5', '#f852a8', '#e30047', '#fd7b61', '#fe4c04'],
  'light-summer': ['#fafcb0', '#008081', '#2d957e', '#79ddb9', '#1e457e', '#3e73fd', '#90acde', '#534884', '#b0486d', '#f488aa', '#a0aab4', '#cfd0d5'],
  'true-summer': ['#e7cbc3', '#124d4b', '#2b977f', '#7ad6ea', '#393f7a', '#7b5fa9', '#677cb6', '#971e39', '#b9488a', '#ee467b', '#555e6c', '#b09c8b'],
  'soft-summer': ['#e4da9b', '#225036', '#099661', '#88c099', '#0279a3', '#458090', '#8ebfcd', '#513244', '#a33550', '#fc9fbc', '#513d3e', '#8e8178'],
  'soft-autumn': ['#e0b771', '#7e7e5e', '#a7a881', '#1a423a', '#348a7d', '#184c6f', '#367aa6', '#2e3351', '#56608c', '#842a39', '#e67471', '#6e5743'],
  'true-autumn': ['#fbd900', '#3e7031', '#82b16b', '#178979', '#12af79', '#137286', '#42b3c8', '#453854', '#715b89', '#812f2d', '#ed564d', '#6c5f2b'],
  'deep-autumn': ['#f4bf72', '#5f6738', '#aebf69', '#03232a', '#2fa097', '#213454', '#62b7cd', '#67123e', '#c7658b', '#c41528', '#fe817d', '#a35328'],
  'deep-winter': ['#dd8dc4', '#322020', '#d7df21', '#175840', '#0a9444', '#10485c', '#008ce3', '#001880', '#9b6fbe', '#7825b0', '#ce2254', '#800020'],
  'true-winter': ['#404040', '#fde55f', '#1c7c63', '#68d19e', '#1239a5', '#3a84d7', '#4b398e', '#9158a7', '#a92a67', '#f55f9f', '#ce2154', '#dfe0e4'],
  'bright-winter': ['#f7f16a', '#010318', '#a1d902', '#048c37', '#3ecb85', '#0022d9', '#4ec6e8', '#760087', '#ca62e7', '#d20072', '#fb60aa', '#ff0b4e'],
}
