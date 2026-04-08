'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MeshBackground = dynamic(
  () => import('./MeshBackground').then((mod) => mod.MeshBackground),
  { ssr: false }
);

export function MeshBackgroundDynamic() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only render WebGL shader on non-mobile viewports
    setShow(!window.matchMedia('(max-width: 767px)').matches);
  }, []);

  if (!show) return null;
  return <MeshBackground />;
}
