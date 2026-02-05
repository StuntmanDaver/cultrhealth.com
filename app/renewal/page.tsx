import { Metadata } from 'next';
import { RenewalFormClient } from './RenewalFormClient';

export const metadata: Metadata = {
  title: 'Request Renewal | CULTR Health',
  description: 'Request a renewal for your medication.',
};

export default function RenewalPage() {
  return <RenewalFormClient />;
}
