import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import OutfitFlowChrome from '@/components/outfit/OutfitFlowChrome'
import { getModels } from '@/lib/modelCatalog'
import { getDb } from '@/lib/getDb'

export default function OutfitLayout({ children }: { children: React.ReactNode }) {
  const models = getModels(getDb())
  const firstModel = models[0]
  const initialModel = firstModel ? { ...firstModel, id: String(firstModel.id) } : undefined

  return (
    <OutfitFlowProvider initialModel={initialModel}>
      <OutfitFlowChrome>{children}</OutfitFlowChrome>
    </OutfitFlowProvider>
  )
}
