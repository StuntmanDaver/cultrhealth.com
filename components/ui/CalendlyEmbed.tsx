'use client'

import Script from 'next/script'

interface CalendlyEmbedProps {
  url: string
}

export default function CalendlyEmbed({ url }: CalendlyEmbedProps) {
  const embedUrl = `${url}?hide_gdpr_banner=1&primary_color=2A4542`

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
      />
      <div
        className="calendly-inline-widget"
        data-url={embedUrl}
        style={{ minWidth: '320px', height: '700px', width: '100%' }}
      />
      <Script
        src="https://assets.calendly.com/assets/external/widget.js"
        strategy="afterInteractive"
      />
    </>
  )
}
