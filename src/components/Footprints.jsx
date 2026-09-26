/**
 * Ghosted footprints leading to the door — PRD §7.
 * 6 prints, fading from opacity 0.30 (bottom, closest to user)
 * toward 0.06 (top, nearest the door). SVG = simple shoe print.
 */
const PRINTS = [
  { top: 92, x: 44, rot: -18, o: 0.06 },
  { top: 79, x: 58, rot: 14, o: 0.10 },
  { top: 66, x: 42, rot: -14, o: 0.15 },
  { top: 53, x: 60, rot: 12, o: 0.20 },
  { top: 40, x: 46, rot: -10, o: 0.25 },
  { top: 27, x: 55, rot: 8, o: 0.30 },
]

function Print({ top, x, rot, o }) {
  return (
    <svg
      viewBox="0 0 24 40"
      aria-hidden="true"
      className="absolute w-4 md:w-5"
      style={{ top: `${top}%`, left: `${x}%`, transform: `rotate(${rot}deg)`, opacity: o }}
    >
      {/* sole */}
      <ellipse cx="12" cy="24" rx="8" ry="13" fill="#B8B0A8" />
      {/* heel */}
      <ellipse cx="12" cy="6" rx="4.5" ry="5" fill="#B8B0A8" />
    </svg>
  )
}

export default function Footprints() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[45%] hidden md:block">
      {PRINTS.map((p, i) => (
        <Print key={i} {...p} />
      ))}
    </div>
  )
}
