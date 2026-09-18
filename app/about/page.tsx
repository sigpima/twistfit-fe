import AboutHero from '@/components/about/AboutHero'
import StorySections from '@/components/about/StorySections'
import LogoMeaningSection from '@/components/about/LogoMeaningSection'

export default function AboutPage() {
  return (
    <main className="w-full bg-surface">
      <AboutHero />
      <StorySections />
      <LogoMeaningSection />
    </main>
  )
}
