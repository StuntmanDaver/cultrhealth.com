import { Metadata } from 'next';
import { QuizClient } from './QuizClient';

export const metadata: Metadata = {
  title: 'Find Your Protocol — CULTR Health',
  description: 'Take our 2-minute quiz to get matched with the right membership and protocol.',
};

export default function QuizPage() {
  return <QuizClient />;
}
