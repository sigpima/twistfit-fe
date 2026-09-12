import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'
import OutfitFlowChrome from '@/components/outfit/OutfitFlowChrome'

export default function OutfitLayout({ children }: { children: React.ReactNode }) {
  return (
    <OutfitFlowProvider>
      <OutfitFlowChrome>{children}</OutfitFlowChrome>
    </OutfitFlowProvider>
  )
}
