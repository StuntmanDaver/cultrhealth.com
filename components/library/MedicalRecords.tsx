'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Ruler,
  Pill,
  ClipboardList,
  FileWarning,
} from 'lucide-react';

interface MedicalRecordsData {
  personal: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  measurements: {
    height?: number;
    weight?: number;
    bmi?: number;
    bodyFat?: number;
  };
  medications: Array<{ name: string; type?: string; duration?: number }>;
  treatmentPreferences: Record<string, unknown>;
  lastUpdated: string;
}

function formatHeight(inches?: number): string {
  if (!inches) return '—';
  const feet = Math.floor(inches / 12);
  const remaining = inches % 12;
  return `${feet}'${remaining}"`;
}

export function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecordsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecords() {
      try {
        const response = await fetch('/api/member/medical-records');
        if (response.ok) {
          const data = await response.json();
          setRecords(data.records || null);
        }
      } catch (error) {
        console.error('Failed to fetch medical records:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div>
        <h3 className="text-lg font-display font-bold text-stone-900 mb-4">Medical Records</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-stone-100 rounded w-32 mb-3" />
              <div className="h-3 bg-stone-100 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!records) {
    return (
      <div>
        <h3 className="text-lg font-display font-bold text-stone-900 mb-4">Medical Records</h3>
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
          <ClipboardList className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-medium">No Medical Records</p>
          <p className="text-sm text-stone-500 mt-1">
            Complete your intake to see your medical summary.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-display font-bold text-stone-900 mb-4">Medical Records</h3>

      <div className="space-y-4">
        {/* Personal Information */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-stone-500" />
            <h4 className="text-sm font-medium text-stone-700">Personal Information</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-stone-400">Name</p>
              <p className="text-sm text-stone-900 font-medium">
                {[records.personal.firstName, records.personal.lastName].filter(Boolean).join(' ') || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Date of Birth</p>
              <p className="text-sm text-stone-900 font-medium">
                {records.personal.dateOfBirth
                  ? new Date(records.personal.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Gender</p>
              <p className="text-sm text-stone-900 font-medium capitalize">
                {records.personal.gender?.toLowerCase() || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Physical Measurements */}
        <div className="bg-white border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Ruler className="w-4 h-4 text-stone-500" />
            <h4 className="text-sm font-medium text-stone-700">Physical Measurements</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-stone-400">Height</p>
              <p className="text-sm text-stone-900 font-medium">{formatHeight(records.measurements.height)}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Weight</p>
              <p className="text-sm text-stone-900 font-medium">
                {records.measurements.weight ? `${records.measurements.weight} lbs` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">BMI</p>
              <p className="text-sm text-stone-900 font-medium">
                {records.measurements.bmi || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-400">Body Fat</p>
              <p className="text-sm text-stone-900 font-medium">
                {records.measurements.bodyFat ? `${records.measurements.bodyFat}%` : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Current Medications */}
        {records.medications.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-stone-500" />
              <h4 className="text-sm font-medium text-stone-700">Current Medications</h4>
            </div>
            <div className="space-y-2">
              {records.medications.map((med, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-stone-50 last:border-0">
                  <span className="text-sm text-stone-900 font-medium">{med.name}</span>
                  {med.type && (
                    <span className="text-xs text-stone-400 capitalize">{med.type}</span>
                  )}
                  {med.duration && (
                    <span className="text-xs text-stone-400">{med.duration} month{med.duration > 1 ? 's' : ''}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-4 bg-stone-50 border border-stone-200 rounded-xl">
          <FileWarning className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-stone-500 leading-relaxed">
            This is a summary of information you provided during intake. For complete medical records or to request changes, contact{' '}
            <a href="mailto:support@cultrhealth.com" className="text-stone-700 underline underline-offset-2">
              support@cultrhealth.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
