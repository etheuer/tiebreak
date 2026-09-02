import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const alt = 'Tiebreak — head to head product comparisons'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f5f5f1',
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#0c7c6c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 16 16">
              <path d="M3 12.6 8.6 3.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" fill="none" />
              <path
                d="M7.4 12.6 13 3.4"
                stroke="#fff"
                strokeWidth="1.7"
                strokeLinecap="round"
                fill="none"
                opacity="0.55"
              />
            </svg>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#17191a', letterSpacing: '-0.04em' }}>
            Tiebreak
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              color: '#17191a',
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              maxWidth: 920,
            }}
          >
            Two products. One answer.
          </div>
          <div style={{ fontSize: 28, color: '#565a57', maxWidth: 820, lineHeight: 1.35 }}>
            Spec-by-spec comparisons with a verdict, from manufacturer-published figures.
          </div>
        </div>
      </div>
    ),
    size
  )
}
