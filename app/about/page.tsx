import AboutHero from '@/components/about/AboutHero'
import MissionVisionGrid from '@/components/about/MissionVisionGrid'
import StorySection from '@/components/about/StorySection'
import TeamGrid from '@/components/about/TeamGrid'
import AboutCtaBanner from '@/components/about/AboutCtaBanner'
import { getTeamMembers } from '@/lib/team'
import { getDb } from '@/lib/getDb'

export default function AboutPage() {
  const members = getTeamMembers(getDb())

  return (
    <main className="w-full bg-surface">
      <AboutHero />
      <MissionVisionGrid />
      <StorySection />
      <TeamGrid members={members} />
      <AboutCtaBanner />
    </main>
  )
}
