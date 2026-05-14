import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'Oxour Go — Luxury self-drive in Mumbai'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0c 0%, #101018 42%, #0a1628 100%)',
          padding: 72,
          color: '#f4f6f9',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: '0.28em',
            color: '#3b82f6',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          Oxour Go
        </div>
        <div style={{ marginTop: 28, fontSize: 62, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
          Drive luxury.
        </div>
        <div style={{ marginTop: 14, fontSize: 30, fontWeight: 600, color: '#aeb4bf' }}>Premium self-drive · Mumbai</div>
      </div>
    ),
    { ...size },
  )
}
