import { OutfitFlowProvider } from '@/components/outfit/OutfitFlowProvider'

export default function OutfitLayout({ children }: { children: React.ReactNode }) {
  return <OutfitFlowProvider>{children}</OutfitFlowProvider>
}
