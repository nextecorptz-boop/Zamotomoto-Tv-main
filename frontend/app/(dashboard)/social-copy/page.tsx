export const dynamic = 'force-dynamic'

export default function SocialCopyPage() {
  return (
    <div
      style={{
        minHeight: '100%',
        padding: '1.5rem',
        background: '#0A0A0A',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2rem',
          letterSpacing: '0.08em',
          color: '#FFFFFF',
        }}
      >
        ENGAGEMENT
      </div>

      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.75rem',
          color: '#A0A0A0',
        }}
      >
        Legacy Social Copy module has been disabled for this deployment build.
      </div>

      <div
        style={{
          background: '#111111',
          border: '1px solid #2A2A2A',
          padding: '1.25rem 1.5rem',
        }}
      >
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1rem',
            letterSpacing: '0.1em',
            color: '#FFFFFF',
            marginBottom: '0.75rem',
          }}
        >
          MODULE STATUS
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.7rem',
            color: '#CCCCCC',
            lineHeight: 1.6,
          }}
        >
          This page is temporarily replaced with a safe placeholder so the production build can complete successfully.
        </div>
      </div>
    </div>
  )
}