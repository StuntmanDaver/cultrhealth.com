'use client';

import { MeshGradient } from '@paper-design/shaders-react';

export function MeshBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
    >
      <MeshGradient
        className="absolute inset-0 w-full h-full"
        colors={['#FDFBF7', '#B7E4C7', '#2A4542', '#D8F3DC', '#3A5956']}
        speed={0.2}
        backgroundColor="#FDFBF7"
      />
    </div>
  );
}
