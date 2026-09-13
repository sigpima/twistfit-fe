import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import OutfitFlowChrome from '@/components/outfit/OutfitFlowChrome'
import { apiFetch } from '@/lib/apiClient'
import type { CatalogModel } from '@/lib/modelCatalog'

export default async function OutfitLayout({ children }: { children: React.ReactNode }) {
  const response = await apiFetch('/model-catalog', { cache: 'no-store' })
  const models = response.ok ? ((await response.json()) as CatalogModel[]) : []
  const firstModel = models[0]
  const initialModel = firstModel ? { ...firstModel, id: String(firstModel.id) } : undefined

  return (
    <OutfitFlowProvider initialModel={initialModel}>
      <OutfitFlowChrome>{children}</OutfitFlowChrome>
    </OutfitFlowProvider>
  )
}
