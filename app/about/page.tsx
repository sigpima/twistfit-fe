import AboutHero from '@/components/about/AboutHero'
import StorySection from '@/components/about/StorySection'
import BrandMeaningSection from '@/components/about/BrandMeaningSection'
import MissionVisionGrid from '@/components/about/MissionVisionGrid'
import TeamGrid from '@/components/about/TeamGrid'
import AboutCtaBanner from '@/components/about/AboutCtaBanner'
import { apiFetch } from '@/lib/apiClient'
import type { TeamMember } from '@/lib/team'

export default async function AboutPage() {
  const response = await apiFetch('/team', { cache: 'no-store' })
  const members = response.ok ? ((await response.json()) as TeamMember[]) : []

  return (
    <main className="w-full bg-surface">
      <AboutHero />
      <StorySection />
      <BrandMeaningSection />
      <MissionVisionGrid />
      <TeamGrid members={members} />
      <AboutCtaBanner />
    </main>
  )
}
