import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join CULTR Club — Free Membership',
  description:
    'Join CULTR Club for free. Browse physician-supervised therapies, peptides, and longevity protocols. Build your personalized wellness order.',
  openGraph: {
    title: 'Join CULTR Club — Free Membership',
    description:
      'Browse physician-supervised therapies and peptides. Build your personalized wellness order.',
  },
}

export default function JoinClubLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
