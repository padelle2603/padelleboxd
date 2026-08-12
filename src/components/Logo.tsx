type LogoProps = {
  size?: number;
  className?: string;
};

export default function Logo({ size = 28, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label="PadelleBoxd logo"
    >
      <defs>
        <linearGradient id="pbLogoTile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#pbLogoTile)" />
      <path
        d="M11 12 H54 V30 H23 V52 H11 V12 Z M28 15 V27 L52 21 Z"
        fill="#ffffff"
        fillRule="evenodd"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}