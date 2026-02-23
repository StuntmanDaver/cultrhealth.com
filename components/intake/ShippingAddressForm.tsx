'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { US_STATES } from '@/lib/config/asher-med';
import { Info } from 'lucide-react';

export function ShippingAddressForm() {
  const { formData, updateFormData } = useIntakeForm();

  const updateAddress = (field: string, value: string) => {
    updateFormData({
      shippingAddress: {
        ...formData.shippingAddress,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">Medications ship from our licensed pharmacy. We verify coverage in your state.</p>
      </div>

      <div>
        <label htmlFor="address1" className="block text-sm font-medium text-stone-700 mb-1">
          Street Address <span className="text-red-500">*</span>
        </label>
        <input
          id="address1"
          type="text"
          value={formData.shippingAddress?.address1 || ''}
          onChange={(e) => updateAddress('address1', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
          placeholder="123 Main Street"
        />
      </div>

      <div>
        <label htmlFor="address2" className="block text-sm font-medium text-stone-700 mb-1">
          Apartment, Suite, etc. (optional)
        </label>
        <input
          id="address2"
          type="text"
          value={formData.shippingAddress?.address2 || ''}
          onChange={(e) => updateAddress('address2', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
          placeholder="Apt 4B"
        />
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label htmlFor="city" className="block text-sm font-medium text-stone-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            id="city"
            type="text"
            value={formData.shippingAddress?.city || ''}
            onChange={(e) => updateAddress('city', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
            placeholder="New York"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-stone-700 mb-1">
            State <span className="text-red-500">*</span>
          </label>
          <select
            id="state"
            value={formData.shippingAddress?.state || ''}
            onChange={(e) => updateAddress('state', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all grad-white"
          >
            <option value="">Select...</option>
            {US_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-stone-700 mb-1">
            ZIP Code <span className="text-red-500">*</span>
          </label>
          <input
            id="zipCode"
            type="text"
            value={formData.shippingAddress?.zipCode || ''}
            onChange={(e) => updateAddress('zipCode', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all"
            placeholder="10001"
            maxLength={10}
          />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          <strong>Important:</strong> Medications will be shipped to this address. Please ensure someone is available to receive the package.
        </p>
      </div>
    </div>
  );
}
