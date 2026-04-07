import { Metadata } from 'next';
import { IntakeFormClient } from '@/components/intake/IntakeFormClient';
import { Suspense } from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Complete Your Intake Form | CULTR Health',
  description: 'Complete your health questionnaire to get started with your personalized treatment plan.',
};

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const session = await getSession();
  const params = await searchParams;
  const sessionId = params.session_id?.trim();
  
  if (!session) {
    const intakeRedirectPath = sessionId
      ? `/intake?session_id=${encodeURIComponent(sessionId)}`
      : '/intake';
    redirect(`/login?redirect=${encodeURIComponent(intakeRedirectPath)}`);
  }

  return (
    <div className="min-h-[calc(100vh-80px)] grad-light flex flex-col pt-12 md:pt-20">
      <div className="flex-1 w-full flex items-center justify-center">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
          </div>
        }>
          <IntakeFormClient />
        </Suspense>
      </div>
    </div>
  );
}
