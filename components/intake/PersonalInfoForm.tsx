'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';

export function PersonalInfoForm() {
  const { formData, updateFormData } = useIntakeForm();

  return (
    <div className="space-y-6">
      {/* Name Fields */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => updateFormData({ firstName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
            placeholder="John"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => updateFormData({ lastName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
            placeholder="Smith"
          />
        </div>
      </div>

      {/* Contact Fields */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => updateFormData({ email: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
            placeholder="john@example.com"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Date of Birth & Gender */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-stone-700 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth || ''}
            onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-stone-700 mb-1">
            Gender <span className="text-red-500">*</span>
          </label>
          <select
            id="gender"
            value={formData.gender || ''}
            onChange={(e) => updateFormData({ gender: e.target.value as 'male' | 'female' | 'other' })}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all bg-white"
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other/Prefer not to say</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-stone-500">
        <span className="text-red-500">*</span> Required fields. Your information is protected and used only for your treatment.
      </p>
    </div>
  );
}
