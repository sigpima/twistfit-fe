import HowItWorksHero from '@/components/how-it-works/HowItWorksHero'
import ProcessSteps from '@/components/how-it-works/ProcessSteps'
import FeatureBento from '@/components/how-it-works/FeatureBento'
import ComparisonTable from '@/components/how-it-works/ComparisonTable'
import PreparationTips from '@/components/how-it-works/PreparationTips'
import CtaBanner from '@/components/how-it-works/CtaBanner'

export default function HowItWorksPage() {
  return (
    <main className="w-full bg-surface">
      <HowItWorksHero />
      <ProcessSteps />
      <FeatureBento />
      <ComparisonTable />
      <PreparationTips />
      <CtaBanner />
    </main>
  )
}
