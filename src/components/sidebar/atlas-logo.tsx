'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface AtlasLogoProps {
  size?: number;
}
export function AtlasLogo({ size = 24 }: AtlasLogoProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Image
        src="/atlas-symbol.svg"
        alt="AtlasAI0"
        width={size}
        height={size}
        className={`${mounted && theme === 'dark' ? 'invert' : ''} flex-shrink-0`}
      />
  );
}
