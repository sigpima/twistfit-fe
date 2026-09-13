export type Undertone = 'warm' | 'cool' | 'neutral'
export const UNDERTONES: Undertone[] = ['warm', 'cool', 'neutral']

export type CatalogModel = {
  id: number
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
  createdAt: string
  updatedAt: string
}

export type CatalogModelInput = {
  name: string
  image: string
  dossierImage: string
  poseCount: number
  tagline: string
  undertone: Undertone
  height: string
  bodyShape: string
  waist: string
  personalColor: string
}
