import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CULTR Health'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const playfairFont = await fetch(
    new URL('https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtM.ttf')
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          background: '#f5f5f0',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'Playfair Display',
            fontSize: 140,
            fontWeight: 700,
            color: '#1a2e1a',
            letterSpacing: '0.05em',
          }}
        >
          CULTR
        </span>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Playfair Display',
          data: playfairFont,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  )
}
