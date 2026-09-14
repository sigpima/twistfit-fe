const MOBILE_USER_AGENT_PATTERN = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i

export function isMobileDevice(userAgent: string): boolean {
  return MOBILE_USER_AGENT_PATTERN.test(userAgent)
}
