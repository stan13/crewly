interface ChillwaveIconProps {
  size?: number;
  className?: string;
}

export function ChillwaveIcon({ size = 80, className = "" }: ChillwaveIconProps) {
  // Scale factors based on size (default 80px container)
  const scale = size / 80;
  const svgWidth = 60 * scale;
  const svgHeight = 45 * scale;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-ocean-400 to-ocean-600 shadow-xl shadow-ocean-500/30 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={svgWidth}
        height={svgHeight}
        viewBox="0 0 60 45"
        className="overflow-hidden"
      >
        {/* Wave path built with Bézier sine approximation using magic constant m=0.512286623256592433
            h=45, wavelength=22.5px, dasharray creates visible segment with rounded end gaps */}
        <path
          className="animate-chillwave"
          d="M 0 28.125 c 5.763 0 5.487 -11.25 11.25 -11.25 s 5.487 11.25 11.25 11.25 s 5.487 -11.25 11.25 -11.25 s 5.487 11.25 11.25 11.25 s 5.487 -11.25 11.25 -11.25 s 5.487 11.25 11.25 11.25 s 5.487 -11.25 11.25 -11.25 s 5.487 11.25 11.25 11.25 s 5.487 -11.25 11.25 -11.25 s 5.487 11.25 11.25 11.25 s 5.487 -11.25 11.25 -11.25 s 5.487 11.25 11.25 11.25"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="0 12 75 12"
        />
      </svg>
    </div>
  );
}
