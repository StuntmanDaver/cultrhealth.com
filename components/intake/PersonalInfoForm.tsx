'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { Info } from 'lucide-react';

export function PersonalInfoForm() {
  const { formData, updateFormData } = useIntakeForm();

  return (
    <div className="space-y-6">
      <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">We use this to set up your patient record. Required by our medical team.</p>
      </div>

      {/* Name Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-forest mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
            placeholder="John"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-forest mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
            placeholder="Smith"
          />
        </div>
      </div>

      {/* Contact Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-forest mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-forest mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Date of Birth & Gender */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-forest mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-forest mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            value={formData.gender || ''}
            onChange={(e) => updateFormData({ gender: e.target.value as 'male' | 'female' | 'other' })}
            className="w-full px-4 py-3 rounded-xl border border-forest-light/20 focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all bg-white"
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other/Prefer not to say</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-forest-muted">
        <span className="text-red-500">*</span> Required fields. Your information is protected and used only for your treatment.
      </p>
    </div>
  );
}
