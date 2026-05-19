export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL
  if (!url && process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_SITE_URL must be set in production')
  }
  return url ?? 'http://localhost:3000'
}
