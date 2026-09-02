import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0c7c6c',
          borderRadius: 8,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 16 16">
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
    ),
    size
  )
}
