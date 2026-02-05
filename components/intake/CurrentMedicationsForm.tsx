'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export function CurrentMedicationsForm() {
  const { formData, updateFormData } = useIntakeForm();
  const [newMedication, setNewMedication] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
  });

  const medications = formData.currentMedications || [];

  const addMedication = () => {
    if (newMedication.name.trim()) {
      updateFormData({
        currentMedications: [...medications, newMedication],
      });
      setNewMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index: number) => {
    updateFormData({
      currentMedications: medications.filter((_, i) => i !== index),
    });
  };

  const setNoMedications = () => {
    updateFormData({
      currentMedications: [],
      noCurrentMedications: true,
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">
        Please list all medications you are currently taking, including prescription medications, over-the-counter drugs, and supplements.
      </p>

      {/* Quick Action: No Medications */}
      {!formData.noCurrentMedications && medications.length === 0 && (
        <button
          onClick={setNoMedications}
          className="w-full p-4 border-2 border-dashed border-stone-300 rounded-xl text-stone-600 hover:border-stone-400 hover:bg-stone-50 transition-all"
        >
          I am not currently taking any medications
        </button>
      )}

      {/* Confirmed No Medications */}
      {formData.noCurrentMedications && medications.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-800">
            You've confirmed that you are not currently taking any medications.
          </p>
          <button
            onClick={() => updateFormData({ noCurrentMedications: false })}
            className="text-sm text-emerald-600 underline mt-2"
          >
            Actually, I want to add medications
          </button>
        </div>
      )}

      {/* Medication List */}
      {medications.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-stone-700">Your Medications</h4>
          {medications.map((med, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 p-4 bg-stone-50 rounded-xl border border-stone-200"
            >
              <div className="flex-1">
                <p className="font-medium text-stone-900">{med.name}</p>
                <p className="text-sm text-stone-500">
                  {med.dosage && `${med.dosage}`}
                  {med.dosage && med.frequency && ' • '}
                  {med.frequency && `${med.frequency}`}
                </p>
              </div>
              <button
                onClick={() => removeMedication(index)}
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Medication Form */}
      {!formData.noCurrentMedications && (
        <div className="border border-stone-200 rounded-xl p-4 space-y-4">
          <h4 className="text-sm font-medium text-stone-700">Add a Medication</h4>

          <div>
            <label htmlFor="medName" className="block text-sm text-stone-600 mb-1">
              Medication Name <span className="text-red-500">*</span>
            </label>
            <input
              id="medName"
              type="text"
              value={newMedication.name}
              onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
              placeholder="e.g., Metformin"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="medDosage" className="block text-sm text-stone-600 mb-1">
                Dosage
              </label>
              <input
                id="medDosage"
                type="text"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                placeholder="e.g., 500mg"
              />
            </div>
            <div>
              <label htmlFor="medFrequency" className="block text-sm text-stone-600 mb-1">
                Frequency
              </label>
              <input
                id="medFrequency"
                type="text"
                value={newMedication.frequency}
                onChange={(e) => setNewMedication({ ...newMedication, frequency: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
                placeholder="e.g., Twice daily"
              />
            </div>
          </div>

          <button
            onClick={addMedication}
            disabled={!newMedication.name.trim()}
            className={`
              flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium transition-all
              ${newMedication.name.trim()
                ? 'bg-stone-900 text-white hover:bg-stone-800'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            <Plus className="w-5 h-5" />
            Add Medication
          </button>
        </div>
      )}
    </div>
  );
}
