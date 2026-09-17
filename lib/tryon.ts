export type TryOnJobStatus = 'pending' | 'processing' | 'done' | 'failed'

export type TryOnJob = {
  id: number
  userId: number
  wardrobeItemId: number | null
  catalogModelId: number
  occasion: string
  style: string
  status: TryOnJobStatus
  resultFrontBlobUrl: string | null
  resultSideBlobUrl: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}
