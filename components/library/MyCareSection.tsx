'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { PlanTier, LibraryAccess } from '@/lib/config/plans';
import { MyProviders } from '@/components/library/MyProviders';
import { ScheduleConsult } from '@/components/library/ScheduleConsult';
import { ConsultHistory } from '@/components/library/ConsultHistory';
import { MedicalRecords } from '@/components/library/MedicalRecords';

interface MyCareSectionProps {
  tier: PlanTier | null;
  libraryAccess: LibraryAccess;
  email: string;
}

export function MyCareSection({ tier }: MyCareSectionProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white">
        <h2 className="text-2xl font-display font-bold">My Care</h2>
        <p className="text-white/60 text-sm mt-1">
          Manage your providers, consultations, and medical records
        </p>
      </div>

      {/* Providers */}
      <MyProviders />

      {/* Schedule Consult */}
      <ScheduleConsult tier={tier} />

      {/* Consult History */}
      <ConsultHistory />

      {/* Medical Records */}
      <MedicalRecords />

      {/* Lab Instructions Link */}
      <Link
        href="/library/lab-instructions"
        className="group flex items-center gap-4 px-6 py-5 bg-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all"
      >
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
          <BookOpen className="w-6 h-6 text-amber-700" />
        </div>
        <div className="flex-1">
          <p className="text-stone-900 font-medium">Lab Instructions</p>
          <p className="text-stone-500 text-sm">Pre-lab prep, what to bring, results timeline & more</p>
        </div>
        <ArrowRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
      </Link>
    </div>
  );
}
