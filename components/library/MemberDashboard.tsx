'use client';

import { useState } from 'react';
import {
  Calendar,
  CalendarDays,
  MessageSquare,
  MessagesSquare,
  Video,
  Users,
  TestTube2,
  Activity,
  ClipboardList,
  HeartPulse,
  Pill,
  AlertCircle,
  ClipboardCheck,
  FileSignature,
  FileQuestion,
  FolderOpen,
  Upload,
  FileText,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Receipt,
  CreditCard,
  Shield,
  Package,
  User,
  Bell,
  Phone,
  ExternalLink,
  ChevronRight,
  History,
  Settings,
  Wallet,
  Files,
  FileHeart,
  Lock,
} from 'lucide-react';
import type { PlanTier, LibraryAccess } from '@/lib/config/plans';
import {
  HEALTHIE_FEATURES,
  HEALTHIE_CATEGORIES,
  DASHBOARD_QUICK_ACTIONS,
  getHealthiePatientPortalUrl,
  type HealthieCategory,
  type HealthieFeature,
  type QuickAction,
} from '@/lib/config/healthie';

// Icon mapping for dynamic rendering
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  CalendarDays,
  MessageSquare,
  MessagesSquare,
  Video,
  Users,
  TestTube2,
  Activity,
  ClipboardList,
  HeartPulse,
  Pill,
  AlertCircle,
  ClipboardCheck,
  FileSignature,
  FileQuestion,
  FolderOpen,
  Upload,
  FileText,
  GraduationCap,
  BookOpen,
  TrendingUp,
  Receipt,
  CreditCard,
  Shield,
  Package,
  User,
  Bell,
  Phone,
  ExternalLink,
  History,
  Settings,
  Wallet,
  Files,
  FileHeart,
};

interface MemberDashboardProps {
  tier: PlanTier | null;
  libraryAccess: LibraryAccess;
  patientId?: string;
  email: string;
}

export function MemberDashboard({
  tier,
  libraryAccess,
  patientId,
  email,
}: MemberDashboardProps) {
  const [activeCategory, setActiveCategory] = useState<HealthieCategory | 'all'>(
    'all'
  );

  const portalUrl = getHealthiePatientPortalUrl();

  // Filter features based on current tier
  const getAccessibleFeatures = (features: HealthieFeature[]): HealthieFeature[] => {
    return features.filter((feature) => {
      if (!tier) return false;
      return feature.memberTiers.includes(tier);
    });
  };

  const filteredFeatures =
    activeCategory === 'all'
      ? HEALTHIE_FEATURES
      : HEALTHIE_FEATURES.filter((f) => f.category === activeCategory);

  const accessibleFeatures = getAccessibleFeatures(filteredFeatures);
  const lockedFeatures = filteredFeatures.filter(
    (f) => !accessibleFeatures.includes(f)
  );

  // Handle quick action clicks
  const handleQuickAction = (action: QuickAction) => {
    const urls: Record<string, string> = {
      book: `${portalUrl}/book`,
      message: `${portalUrl}/messages`,
      labs: `${portalUrl}/labs`,
      forms: `${portalUrl}/forms`,
      portal: portalUrl,
    };

    if (action.action && urls[action.action]) {
      window.open(urls[action.action], '_blank', 'noopener,noreferrer');
    }
  };

  // Handle feature click
  const handleFeatureClick = (feature: HealthieFeature) => {
    // Map feature IDs to portal URLs
    const featureUrls: Record<string, string> = {
      'book-appointment': `${portalUrl}/book`,
      'upcoming-appointments': `${portalUrl}/appointments`,
      'appointment-history': `${portalUrl}/appointments?filter=past`,
      'telehealth': `${portalUrl}/appointments`,
      'secure-messaging': `${portalUrl}/messages`,
      'message-history': `${portalUrl}/messages`,
      'care-team': `${portalUrl}/care-team`,
      'lab-results': `${portalUrl}/labs`,
      'health-metrics': `${portalUrl}/metrics`,
      'care-plans': `${portalUrl}/care-plans`,
      'medical-history': `${portalUrl}/health-history`,
      'medications': `${portalUrl}/medications`,
      'allergies': `${portalUrl}/health-history`,
      'intake-forms': `${portalUrl}/forms`,
      'consent-forms': `${portalUrl}/forms`,
      'assessments': `${portalUrl}/forms`,
      'documents': `${portalUrl}/documents`,
      'upload-documents': `${portalUrl}/documents/upload`,
      'protocol-documents': `${portalUrl}/documents`,
      'programs': `${portalUrl}/programs`,
      'courses': `${portalUrl}/courses`,
      'progress-tracking': `${portalUrl}/progress`,
      'invoices': `${portalUrl}/billing`,
      'payment-methods': `${portalUrl}/billing/payment-methods`,
      'insurance': `${portalUrl}/insurance`,
      'packages': `${portalUrl}/packages`,
      'profile': `${portalUrl}/profile`,
      'notifications': `${portalUrl}/settings/notifications`,
      'emergency-contacts': `${portalUrl}/profile/emergency-contacts`,
    };

    const url = featureUrls[feature.id] || portalUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-8">
      {/* Quick Actions Header */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display font-bold">
              Member <span className="italic">Portal</span>
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Access your Healthie EHR platform features
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-sm text-white/80">Connected</span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {DASHBOARD_QUICK_ACTIONS.map((action) => {
            const Icon = ICONS[action.icon] || ExternalLink;
            const isAccessible = tier && action.memberTiers.includes(tier);

            return (
              <button
                key={action.id}
                onClick={() => isAccessible && handleQuickAction(action)}
                disabled={!isAccessible}
                className={`
                  group relative flex flex-col items-center gap-2 p-4 rounded-2xl transition-all
                  ${
                    action.variant === 'primary'
                      ? 'bg-white text-stone-900 hover:bg-stone-100'
                      : action.variant === 'secondary'
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }
                  ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <Icon
                  className={`w-6 h-6 ${
                    action.variant === 'primary'
                      ? 'text-stone-700'
                      : 'text-white/80'
                  }`}
                />
                <span className="text-xs font-medium text-center leading-tight">
                  {action.label}
                </span>
                {!isAccessible && (
                  <Lock className="absolute top-2 right-2 w-3 h-3 text-white/40" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SDK Integration Info */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-display font-bold text-stone-900">
              Healthie Integration
            </h3>
            <p className="text-sm text-stone-600 mt-1">
              Your CULTR membership is integrated with Healthie's HIPAA-compliant EHR platform.
              Access telehealth, messaging, forms, lab results, and more through the patient portal.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 font-medium">
                Chat SDK Available
              </span>
              <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 font-medium">
                Forms SDK Available
              </span>
              <span className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs text-blue-700 font-medium">
                Booking SDK Available
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Portal Link */}
      <div className="text-center">
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors"
        >
          Open Full Patient Portal
          <ExternalLink className="w-4 h-4" />
        </a>
        <p className="text-sm text-stone-500 mt-2">
          Opens in a new tab with full Healthie EHR access
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            activeCategory === 'all'
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All Features
        </button>
        {HEALTHIE_CATEGORIES.map((category) => {
          const Icon = ICONS[category.icon] || FileText;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === category.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Features Grid - Accessible */}
      {accessibleFeatures.length > 0 && (
        <div>
          <h3 className="text-lg font-display font-bold text-stone-900 mb-4">
            Available Features
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleFeatures.map((feature) => {
              const Icon = ICONS[feature.icon] || FileText;
              const category = HEALTHIE_CATEGORIES.find(
                (c) => c.id === feature.category
              );

              return (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className="group flex items-start gap-4 p-5 bg-white border border-stone-200 rounded-2xl hover:border-stone-300 hover:shadow-lg hover:shadow-stone-200/50 transition-all text-left"
                >
                  <div
                    className={`w-12 h-12 ${
                      category?.color || 'bg-stone-100'
                    } rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-stone-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-stone-900 group-hover:text-stone-700 transition-colors">
                        {feature.name}
                      </p>
                      {feature.sdkAvailable && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                          SDK
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                      {feature.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Features Grid - Locked */}
      {lockedFeatures.length > 0 && (
        <div>
          <h3 className="text-lg font-display font-bold text-stone-400 mb-4">
            Upgrade to Unlock
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedFeatures.map((feature) => {
              const Icon = ICONS[feature.icon] || FileText;
              const category = HEALTHIE_CATEGORIES.find(
                (c) => c.id === feature.category
              );
              const requiredTier = feature.memberTiers[0];

              return (
                <div
                  key={feature.id}
                  className="relative flex items-start gap-4 p-5 bg-stone-50 border border-stone-100 rounded-2xl opacity-60"
                >
                  <div
                    className={`w-12 h-12 ${
                      category?.color || 'bg-stone-100'
                    } rounded-xl flex items-center justify-center flex-shrink-0 grayscale`}
                  >
                    <Icon className="w-6 h-6 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-stone-500">{feature.name}</p>
                      <Lock className="w-4 h-4 text-stone-400" />
                    </div>
                    <p className="text-sm text-stone-400 mt-1 line-clamp-2">
                      {feature.description}
                    </p>
                    <p className="text-xs text-amber-600 mt-2 font-medium">
                      Requires {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} tier
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
