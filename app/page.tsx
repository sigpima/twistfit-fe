import Hero from '@/components/home/Hero'
import FeatureShowcase from '@/components/home/FeatureShowcase'
import ContactSection from '@/components/home/ContactSection'

export default function HomePage() {
  return (
    <main className="w-full bg-surface">
      <div className="relative flex w-full flex-col overflow-hidden">
        <Hero />
        <FeatureShowcase />
        <ContactSection />
      </div>
    </main>
  )
}
