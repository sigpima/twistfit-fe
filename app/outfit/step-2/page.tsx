import Step2PageContent from '@/components/outfit/step2/Step2PageContent'
import { apiFetch } from '@/lib/apiClient'
import type { CatalogModel } from '@/lib/modelCatalog'

export default async function Step2Page() {
  const response = await apiFetch('/model-catalog', { cache: 'no-store' })
  const models = response.ok ? ((await response.json()) as CatalogModel[]) : []
  return <Step2PageContent models={models} />
}
