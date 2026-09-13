import Step4PageContent from '@/components/outfit/step4/Step4PageContent'
import { getCapsuleSets } from '@/lib/capsuleWardrobe'
import { getDb } from '@/lib/getDb'

export default function Step4Page() {
  const capsuleSets = getCapsuleSets(getDb())
  return <Step4PageContent capsuleSets={capsuleSets} />
}
