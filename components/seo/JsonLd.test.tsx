import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import JsonLd from './JsonLd'

describe('JsonLd', () => {
  it('renders the data as a JSON-LD script tag', () => {
    const { container } = render(<JsonLd data={{ '@type': 'Thing', name: 'Test' }} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    expect(JSON.parse(script!.innerHTML)).toEqual({ '@type': 'Thing', name: 'Test' })
  })

  it('escapes `<` so embedded content cannot break out of the script tag', () => {
    const { container } = render(<JsonLd data={{ '@type': 'Thing', name: '</script><script>alert(1)</script>' }} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script!.innerHTML).not.toContain('</script><script>')
    expect(JSON.parse(script!.innerHTML).name).toBe('</script><script>alert(1)</script>')
  })
})
