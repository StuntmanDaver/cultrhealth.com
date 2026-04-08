import { redirect } from 'next/navigation';
import { getSession, isAdminEmail } from '@/lib/auth';
import { DosingRulesClient } from './DosingRulesClient';

export const metadata = {
  title: 'Admin | Dosing Rules Engine',
};

export default async function DosingRulesAdminPage() {
  const session = await getSession();
  
  if (!session || !session.email || !isAdminEmail(session.email)) {
    redirect('/admin');
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold text-cultr-forest mb-2">Dosing Rules Engine</h1>
      <p className="text-cultr-textMuted mb-8">Manage, draft, and publish deterministic dosing rules and logic branches.</p>
      
      <DosingRulesClient />
    </div>
  );
}
