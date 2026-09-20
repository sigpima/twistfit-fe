import { describe, expect, it } from 'vitest'
import robots from './robots'

describe('robots', () => {
  it('allows crawling by default', () => {
    const result = robots()
    expect(result.rules).toMatchObject({ userAgent: '*', allow: '/' })
  })

  it('points crawlers to the sitemap', () => {
    const result = robots()
    expect(result.sitemap).toBe('https://twistfit.org/sitemap.xml')
  })

  it('disallows admin, auth, and personalized/interactive-only routes', () => {
    const result = robots()
    const disallow = (result.rules as { disallow?: string[] }).disallow ?? []
    expect(disallow).toEqual(
      expect.arrayContaining([
        '/admin/',
        '/login',
        '/register',
        '/profile',
        '/collection',
        '/camera-frame',
        '/forum/new',
        '/forum/my-posts',
        '/forum/saved',
        '/forum/*/edit',
        '/outfit/step-2',
        '/outfit/step-3',
        '/personal-color/result',
      ])
    )
  })

  it('keeps the entry pages of both feature flows crawlable', () => {
    const result = robots()
    const disallow = (result.rules as { disallow?: string[] }).disallow ?? []
    expect(disallow).not.toContain('/outfit/step-1')
    expect(disallow).not.toContain('/personal-color/quiz')
    expect(disallow).not.toContain('/blog')
    expect(disallow).not.toContain('/forum')
  })
})
