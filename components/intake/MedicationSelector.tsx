'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { Check, Info, Pill } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  tag?: string;
}

const MEDICATIONS: Medication[] = [
  { id: 'semaglutide', name: 'Semaglutide', dosage: '5 MG | 3 ML', tag: 'GLP-1' },
  { id: 'tirzepatide', name: 'Tirzepatide', dosage: '20 MG | 3 ML', tag: 'GLP-1' },
  { id: 'r3ta', name: 'R3TA', dosage: '20 MG | 3 ML', tag: 'GLP-1/GIP/GCG' },
  { id: 'ghk-cu', name: 'GHK-CU', dosage: '100 MG | 3 ML' },
  { id: 'tesa-ipa', name: 'TESA/IPA', dosage: '12/6 MG | 3 ML' },
  { id: 'cjc1295-ipa', name: 'CJC1295/IPA', dosage: '10/10 MG | 3 ML' },
  { id: 'nad-plus', name: 'NAD+', dosage: '1000 MG | 10 ML' },
  { id: 'semax-selank', name: 'Semax/Selank', dosage: '5/5 MG | 3 ML' },
  { id: 'bpc157-tb500', name: 'BPC157/TB500', dosage: '10/10 MG | 3 ML' },
  { id: 'melanotan-2', name: 'Melanotan 2 (MT2)', dosage: '10 MG | 3 ML' },
];

export function MedicationSelector() {
  const { formData, updateFormData } = useIntakeForm();

  const selectedMedications = formData.selectedMedications || [];

  const toggleMedication = (id: string) => {
    const current = [...selectedMedications];
    const index = current.indexOf(id);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    updateFormData({ selectedMedications: current });
  };

  return (
    <div className="space-y-4">
      <div className="bg-mint/40 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">
          Select the medications you&apos;re interested in. Your provider will finalize your protocol after reviewing your intake.
        </p>
      </div>

      <div className="space-y-2">
        {MEDICATIONS.map((med) => {
          const selected = selectedMedications.includes(med.id);
          return (
            <button
              key={med.id}
              type="button"
              onClick={() => toggleMedication(med.id)}
              className={`
                w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all
                ${selected
                  ? 'border-forest bg-mint/40'
                  : 'border-forest-light/20 bg-white hover:border-forest-light/40 hover:bg-cream'
                }
              `}
            >
              <div className={`
                w-6 h-6 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all
                ${selected
                  ? 'bg-forest border-forest text-white'
                  : 'border-forest-light/40 bg-white'
                }
              `}>
                {selected && <Check className="w-4 h-4" />}
              </div>

              <Pill className={`w-5 h-5 flex-shrink-0 ${selected ? 'text-forest' : 'text-forest-light'}`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-forest">{med.name}</span>
                  {med.tag && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-forest-light/20 text-forest rounded-full">
                      {med.tag}
                    </span>
                  )}
                </div>
                <span className="text-sm text-forest-muted">{med.dosage}</span>
              </div>

              {selected && (
                <span className="text-xs font-medium text-forest bg-forest/10 px-2 py-1 rounded">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedMedications.length > 0 && (
        <p className="text-sm text-forest-muted text-center pt-2">
          {selectedMedications.length} medication{selectedMedications.length !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  );
}
