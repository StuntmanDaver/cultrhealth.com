'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { Info } from 'lucide-react';

const QUESTIONNAIRE_ITEMS = [
  {
    id: 'previousWeightLossAttempts',
    question: 'Have you tried to lose weight before?',
    type: 'select',
    options: ['No', 'Yes, with diet only', 'Yes, with exercise only', 'Yes, with diet and exercise', 'Yes, with medication', 'Yes, with surgery'],
  },
  {
    id: 'medicalConditions',
    question: 'Do you have any of the following conditions? (Select all that apply)',
    type: 'multiselect',
    options: ['Type 2 Diabetes', 'High Blood Pressure', 'High Cholesterol', 'Heart Disease', 'Sleep Apnea', 'PCOS', 'None of the above'],
  },
  {
    id: 'allergies',
    question: 'Do you have any medication allergies?',
    type: 'textarea',
    placeholder: 'List any known medication allergies, or type "None" if you have no known allergies.',
  },
  {
    id: 'pregnancyStatus',
    question: 'Are you currently pregnant, breastfeeding, or planning to become pregnant?',
    type: 'select',
    options: ['No', 'Yes - Currently pregnant', 'Yes - Currently breastfeeding', 'Yes - Planning pregnancy within 6 months'],
  },
  {
    id: 'thyroidHistory',
    question: 'Do you have a personal or family history of thyroid cancer or MEN2 syndrome?',
    type: 'select',
    options: ['No', 'Yes - Personal history', 'Yes - Family history', 'Unsure'],
  },
  {
    id: 'pancreatitisHistory',
    question: 'Have you ever been diagnosed with pancreatitis?',
    type: 'select',
    options: ['No', 'Yes'],
  },
  {
    id: 'kidneyIssues',
    question: 'Do you have any kidney problems or kidney disease?',
    type: 'select',
    options: ['No', 'Yes - Mild', 'Yes - Moderate', 'Yes - Severe/Dialysis'],
  },
  {
    id: 'diabetesStatus',
    question: 'Do you currently take insulin or other diabetes medications?',
    type: 'select',
    options: ['No', 'Yes - Insulin', 'Yes - Oral medications', 'Yes - Both'],
  },
  {
    id: 'weightLossGoals',
    question: 'What is your primary goal for weight management?',
    type: 'select',
    options: ['Lose weight for health reasons', 'Improve energy levels', 'Better manage diabetes/blood sugar', 'Improve mobility', 'Feel more confident', 'Other'],
  },
];

export function WellnessQuestionnaire() {
  const { formData, updateFormData } = useIntakeForm();

  const updateWellnessData = (field: string, value: string | string[]) => {
    updateFormData({
      wellnessQuestionnaire: {
        ...formData.wellnessQuestionnaire,
        [field]: value,
      },
    });
  };

  const handleMultiselectChange = (field: string, option: string) => {
    const current = (formData.wellnessQuestionnaire?.[field] as string[]) || [];
    let updated: string[];

    if (option === 'None of the above') {
      // If selecting "None", clear all others
      updated = current.includes(option) ? [] : [option];
    } else {
      // Remove "None" if selecting other options
      const withoutNone = current.filter((o) => o !== 'None of the above');
      updated = withoutNone.includes(option)
        ? withoutNone.filter((o) => o !== option)
        : [...withoutNone, option];
    }

    updateWellnessData(field, updated);
  };

  return (
    <div className="space-y-8">
      <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">These questions are clinically required. They help screen for contraindications.</p>
      </div>

      {QUESTIONNAIRE_ITEMS.map((item) => (
        <div key={item.id}>
          <label className="block text-base font-medium text-forest mb-3">
            {item.question} <span className="text-red-500">*</span>
          </label>

          {item.type === 'select' && (
            <div className="space-y-2">
              {item.options?.map((option) => (
                <label
                  key={option}
                  className={`
                    flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                    ${formData.wellnessQuestionnaire?.[item.id] === option
                      ? 'border-forest bg-mint'
                      : 'border-forest-light hover:border-forest-muted'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={item.id}
                    value={option}
                    checked={formData.wellnessQuestionnaire?.[item.id] === option}
                    onChange={() => updateWellnessData(item.id, option)}
                    className="w-6 h-6 text-forest border-forest-light focus:ring-forest"
                  />
                  <span className="text-base text-forest">{option}</span>
                </label>
              ))}
            </div>
          )}

          {item.type === 'multiselect' && (
            <div className="space-y-2">
              {item.options?.map((option) => {
                const isSelected = ((formData.wellnessQuestionnaire?.[item.id] as string[]) || []).includes(option);
                return (
                  <label
                    key={option}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-forest bg-mint'
                        : 'border-forest-light hover:border-forest-muted'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleMultiselectChange(item.id, option)}
                      className="w-6 h-6 text-forest border-forest-light rounded focus:ring-forest"
                    />
                    <span className="text-base text-forest">{option}</span>
                  </label>
                );
              })}
            </div>
          )}

          {item.type === 'textarea' && (
            <textarea
              value={(formData.wellnessQuestionnaire?.[item.id] as string) || ''}
              onChange={(e) => updateWellnessData(item.id, e.target.value)}
              placeholder={item.placeholder}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-forest-light focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all resize-none text-base"
            />
          )}
        </div>
      ))}
    </div>
  );
}
