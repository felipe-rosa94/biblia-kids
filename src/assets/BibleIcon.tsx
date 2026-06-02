interface Props {
  className?: string
}

export function BibleIcon({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="80" height="80" rx="20" fill="#58cc02" />
      <rect x="18" y="16" width="36" height="46" rx="4" fill="white" />
      <rect x="14" y="18" width="36" height="46" rx="4" fill="#f0fce4" stroke="#58cc02" strokeWidth="2" />
      <rect x="22" y="30" width="20" height="3" rx="1.5" fill="#58cc02" />
      <rect x="22" y="37" width="20" height="3" rx="1.5" fill="#58cc02" />
      <rect x="22" y="44" width="14" height="3" rx="1.5" fill="#58cc02" />
      {/* Cross */}
      <rect x="29" y="20" width="6" height="14" rx="3" fill="#ffc800" />
      <rect x="25" y="25" width="14" height="4" rx="2" fill="#ffc800" />
    </svg>
  )
}
