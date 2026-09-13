import Step4PageContent from '@/components/outfit/step4/Step4PageContent'
import { apiFetch } from '@/lib/apiClient'
import type { CapsuleSet } from '@/lib/capsuleWardrobe'

export default async function Step4Page() {
  const response = await apiFetch('/capsule-wardrobe', { cache: 'no-store' })
  const capsuleSets = response.ok ? ((await response.json()) as CapsuleSet[]) : []
  return <Step4PageContent capsuleSets={capsuleSets} />
}
