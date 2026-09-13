import Step2PageContent from '@/components/outfit/step2/Step2PageContent'
import { getModels } from '@/lib/modelCatalog'
import { getDb } from '@/lib/getDb'

export default function Step2Page() {
  const models = getModels(getDb())
  return <Step2PageContent models={models} />
}
