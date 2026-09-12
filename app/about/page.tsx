import AboutHero from '@/components/about/AboutHero'
import MissionVisionGrid from '@/components/about/MissionVisionGrid'
import StorySection from '@/components/about/StorySection'
import TeamGrid from '@/components/about/TeamGrid'
import AboutCtaBanner from '@/components/about/AboutCtaBanner'

export default function AboutPage() {
  return (
    <main className="w-full bg-surface">
      <AboutHero />
      <MissionVisionGrid />
      <StorySection />
      <TeamGrid />
      <AboutCtaBanner />
    </main>
  )
}
