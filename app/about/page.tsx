import AboutHero from '@/components/about/AboutHero'
import StorySections from '@/components/about/StorySections'
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
      <StorySections />
      <TeamGrid members={members} />
      <AboutCtaBanner />
    </main>
  )
}
