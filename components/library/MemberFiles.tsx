'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  Shield,
  CreditCard,
  Camera,
  Upload,
} from 'lucide-react';

interface MemberFile {
  id: number;
  purpose: string;
  contentType: string;
  previewUrl: string | null;
  uploadedAt: string;
}

const PURPOSE_LABELS: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  front_id: { label: 'Government ID', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  government_id: { label: 'Government ID', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  telehealth_consent: { label: 'Telehealth Consent', icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  medication_consent: { label: 'Medication Consent', icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  compounded_consent: { label: 'Compounded Med Consent', icon: Shield, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  prescription_photo: { label: 'Prescription Photo', icon: Camera, color: 'text-purple-600', bgColor: 'bg-purple-50' },
};

function getPurposeConfig(purpose: string) {
  return PURPOSE_LABELS[purpose] || { label: purpose.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: FileText, color: 'text-stone-600', bgColor: 'bg-stone-50' };
}

export function MemberFiles() {
  const [files, setFiles] = useState<MemberFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch('/api/member/files');
        if (response.ok) {
          const data = await response.json();
          setFiles(data.files || []);
        }
      } catch (error) {
        console.error('Failed to fetch files:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-display font-bold text-stone-900 mb-4">Documents</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-100 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-stone-100 rounded w-32 mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : files.length > 0 ? (
        <div className="space-y-3">
          {files.map((file) => {
            const config = getPurposeConfig(file.purpose);
            const Icon = config.icon;
            return (
              <div
                key={file.id}
                className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-4"
              >
                <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-900">{config.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {new Date(file.uploadedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                {file.previewUrl && (
                  <a
                    href={file.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors text-sm font-medium"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </a>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
          <Upload className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-600 font-medium text-sm">No Documents Yet</p>
          <p className="text-xs text-stone-500 mt-1">
            Documents are uploaded during your intake process.
          </p>
        </div>
      )}
    </div>
  );
}
