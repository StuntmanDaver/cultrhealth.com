'use client';

import {
  Stethoscope,
  Mail,
  ExternalLink,
} from 'lucide-react';

export function MyProviders() {
  return (
    <div>
      <h3 className="text-lg font-display font-bold text-stone-900 mb-4">
        Your Care Team
      </h3>

      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Stethoscope className="w-7 h-7 text-teal-700" />
          </div>
          <div className="flex-1">
            <h4 className="text-stone-900 font-medium text-lg">
              <span className="font-display font-bold">CULTR</span> Health Medical Team
            </h4>
            <p className="text-stone-500 text-sm mt-1">
              Board-certified physicians specializing in weight management & longevity
            </p>
            <p className="text-stone-400 text-xs mt-2">
              Your provider is assigned after your intake is reviewed by our medical team.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-stone-100">
          <a
            href="mailto:support@cultrhealth.com"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            <Mail className="w-4 h-4" />
            Contact Care Team
          </a>
          <a
            href="https://asherweightloss.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-sm font-medium hover:bg-stone-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Patient Portal
          </a>
        </div>
      </div>
    </div>
  );
}
