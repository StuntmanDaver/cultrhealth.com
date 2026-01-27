import { PLANS } from '@/lib/config/plans';
import { Check, Minus } from 'lucide-react';

const FEATURES = [
  { label: 'Telehealth Consults', key: 'consults' },
  { label: 'Messaging Access', key: 'messaging' },
  { label: 'Response Time', key: 'response' },
  { label: 'Protocol Reviews', key: 'protocols' },
  { label: 'Library Access', key: 'library' },
  { label: 'Priority Scheduling', key: 'priority' },
];

// Mapping plan slugs to feature values manually for the table
// This separates the table data from the PLANS config slightly but allows for tabular display logic
const COMPARISON_DATA: Record<string, Record<string, string | boolean>> = {
  starter: {
    consults: 'Quarterly',
    messaging: 'Basic',
    response: 'Standard',
    protocols: 'Standard',
    library: true,
    priority: false,
  },
  creator: {
    consults: 'Monthly',
    messaging: 'Priority',
    response: '24h',
    protocols: 'Custom',
    library: true,
    priority: false,
  },
  cognition: {
    consults: 'Bi-weekly',
    messaging: 'Priority',
    response: '24h',
    protocols: 'Advanced',
    library: true,
    priority: true,
  },
  confidante: {
    consults: 'Weekly',
    messaging: '24/7',
    response: 'Same Day',
    protocols: 'Comprehensive',
    library: true,
    priority: true,
  },
  club: {
    consults: 'Unlimited',
    messaging: 'Direct Physician',
    response: 'Immediate',
    protocols: 'All Access',
    library: true,
    priority: 'Concierge',
  },
};

export function ComparisonTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="p-4 bg-transparent border-b border-white/10 min-w-[200px]"></th>
            {PLANS.map((plan) => (
              <th key={plan.slug} className="p-4 bg-transparent border-b border-white/10 text-white font-display text-center min-w-[140px]">
                {plan.name.replace('CULTR ', '')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((feature) => (
            <tr key={feature.key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="p-4 text-gray-300 font-medium">{feature.label}</td>
              {PLANS.map((plan) => {
                const value = COMPARISON_DATA[plan.slug][feature.key];
                return (
                  <td key={plan.slug} className="p-4 text-center text-sm text-gray-400">
                    {value === true ? (
                      <div className="flex justify-center"><Check className="w-5 h-5 text-cultr-copper" /></div>
                    ) : value === false ? (
                      <div className="flex justify-center"><Minus className="w-5 h-5 text-gray-600" /></div>
                    ) : (
                      <span className="text-white">{value}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
