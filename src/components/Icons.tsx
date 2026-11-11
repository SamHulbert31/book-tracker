import type { ReactNode } from 'react';

interface IconProps {
  size?: number;
}

function Svg({ size, strokeWidth, children }: { size: number; strokeWidth: number; children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const PlusIcon = ({ size = 20 }: IconProps) => (
  <Svg size={size} strokeWidth={2}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const SearchIcon = ({ size = 18 }: IconProps) => (
  <Svg size={size} strokeWidth={2}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </Svg>
);

export const ChevronLeftIcon = ({ size = 18 }: IconProps) => (
  <Svg size={size} strokeWidth={2}>
    <path d="m15 5-7 7 7 7" />
  </Svg>
);

export const ShuffleIcon = ({ size = 20 }: IconProps) => (
  <Svg size={size} strokeWidth={1.8}>
    <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
  </Svg>
);

export const HomeIcon =({ size = 22 }: IconProps) => (
  <Svg size={size} strokeWidth={1.8}>
    <path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
  </Svg>
);

export const LibraryIcon = ({ size = 22 }: IconProps) => (
  <Svg size={size} strokeWidth={1.8}>
    <path d="M5 4v16M9 4v16M13 5l4 15M19 4v16" />
  </Svg>
);

export const StatsIcon = ({ size = 22 }: IconProps) => (
  <Svg size={size} strokeWidth={1.8}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);
