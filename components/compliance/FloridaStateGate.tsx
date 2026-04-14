'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington, D.C.' },
];

interface Props {
  onPass: () => void;
}

export function FloridaStateGate({ onPass }: Props) {
  const [selectedState, setSelectedState] = useState('');
  const [attempted, setAttempted] = useState(false);

  const isBlocked = attempted && selectedState !== 'FL';

  function handleContinue() {
    setAttempted(true);
    if (selectedState === 'FL') {
      onPass();
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto">
          <MapPin className="w-7 h-7 text-brand-primary" />
        </div>

        <div>
          <h2 className="text-2xl font-display font-bold text-brand-primary mb-2">
            Where are you located?
          </h2>
          <p className="text-cultr-textMuted text-sm">
            CULTR Health is currently available in Florida only.
          </p>
        </div>

        {isBlocked ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-left">
            <p className="text-amber-800 font-semibold mb-2">Not available in your state</p>
            <p className="text-amber-700 text-sm leading-relaxed">
              CULTR Health is currently available only in Florida. Services are available only to
              patients who are physically located in Florida at the time of consultation and treatment.
              We hope to expand to additional states in the future.
            </p>
          </div>
        ) : (
          <>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full border border-brand-primary/20 rounded-lg px-4 py-3 text-brand-primary bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            >
              <option value="">Select your state</option>
              {US_STATES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <Button
              onClick={handleContinue}
              disabled={!selectedState}
              className="w-full"
            >
              Continue
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
