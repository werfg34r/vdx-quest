export default function HeroSilhouette({ stage = 0 }) {
  const colors = [
    { body: '#333', glow: 'none' },
    { body: '#555', glow: '0 0 15px rgba(199,183,119,0.2)' },
    { body: '#777', glow: '0 0 25px rgba(199,183,119,0.4)' },
    { body: '#c7b777', glow: '0 0 35px rgba(199,183,119,0.6)' },
    { body: '#e0d9a8', glow: '0 0 50px rgba(199,183,119,0.8)' },
  ]

  const c = colors[Math.min(stage, 4)]

  return (
    <svg width="100" height="160" viewBox="0 0 100 160" style={{ filter: `drop-shadow(${c.glow})` }}>
      {/* Head */}
      <circle cx="50" cy="28" r="16" fill={c.body} />
      {/* Body */}
      <path d="M 35 48 Q 50 44 65 48 L 62 100 Q 50 104 38 100 Z" fill={c.body} />
      {/* Left arm */}
      <path d="M 35 52 L 18 82 L 24 84 L 38 58" fill={c.body} />
      {/* Right arm */}
      <path d="M 65 52 L 82 82 L 76 84 L 62 58" fill={c.body} />
      {/* Left leg */}
      <path d="M 42 100 L 36 150 L 44 150 L 48 102" fill={c.body} />
      {/* Right leg */}
      <path d="M 58 100 L 64 150 L 56 150 L 52 102" fill={c.body} />
      {/* Crown for max stage */}
      {stage >= 4 && (
        <polygon
          points="38,14 42,4 46,12 50,2 54,12 58,4 62,14"
          fill="#c7b777"
          stroke="#e0d9a8"
          strokeWidth="0.5"
        />
      )}
      {/* Glow aura for stage 3+ */}
      {stage >= 3 && (
        <ellipse cx="50" cy="80" rx="40" ry="70" fill="none" stroke="rgba(199,183,119,0.15)" strokeWidth="2" />
      )}
    </svg>
  )
}
