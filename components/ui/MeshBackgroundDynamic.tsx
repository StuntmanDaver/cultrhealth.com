import dynamic from 'next/dynamic';

export const MeshBackgroundDynamic = dynamic(
  () => import('./MeshBackground').then((mod) => mod.MeshBackground),
  { ssr: false }
);
