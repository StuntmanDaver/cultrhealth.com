'use client';

import { useState, useEffect } from 'react';
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
  Download,
  DollarSign,
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

// LMN record type for HSA/FSA documents
interface LmnRecord {
  lmnNumber: string;
  orderNumber: string;
  issueDate: string;
  eligibleTotal: number;
  currency: string;
  itemCount: number;
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
  const [lmnRecords, setLmnRecords] = useState<LmnRecord[]>([]);
  const [lmnLoading, setLmnLoading] = useState(true);
  const [showLmnModal, setShowLmnModal] = useState(false);

  const portalUrl = getHealthiePatientPortalUrl();

  // Fetch LMN records for HSA/FSA documents
  useEffect(() => {
    async function fetchLmnRecords() {
      try {
        const response = await fetch('/api/lmn/list');
        if (response.ok) {
          const data = await response.json();
          setLmnRecords(data.lmns || []);
        }
      } catch (error) {
        console.error('Failed to fetch LMN records:', error);
      } finally {
        setLmnLoading(false);
      }
    }
    fetchLmnRecords();
  }, []);

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

  // Handle quick action clicks with SSO authentication
  const handleQuickAction = async (action: QuickAction) => {
    try {
      // Request SSO token from API
      const response = await fetch('/api/healthie/sso-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action.action }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SSO token');
      }

      const { ssoUrl } = await response.json();
      
      // Open authenticated portal in new tab
      window.open(ssoUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('SSO authentication failed:', error);
      // Fallback to direct portal URL without SSO
      // Note: Healthie uses /chat for messaging, not /messages
      const urls: Record<string, string> = {
        book: `${portalUrl}/book`,
        message: `${portalUrl}/chat`,
        labs: `${portalUrl}/documents`,
        forms: `${portalUrl}/forms`,
        portal: portalUrl,
      };
      
      if (action.action && urls[action.action]) {
        window.open(urls[action.action], '_blank', 'noopener,noreferrer');
      }
    }
  };

  // Handle feature click with SSO authentication
  const handleFeatureClick = async (feature: HealthieFeature) => {
    // Map feature IDs to SSO actions
    // Note: These map to HealthieSSOUrls which use verified Healthie portal paths:
    // - book → /book
    // - appointments → /appointments
    // - message → /chat (NOT /messages)
    // - labs → /documents (labs stored as documents)
    // - forms → /forms
    // - documents → /documents
    // - billing → /billing
    // - profile → /settings
    // - programs → /programs
    const featureActions: Record<string, string> = {
      'book-appointment': 'book',
      'upcoming-appointments': 'appointments',
      'appointment-history': 'appointments',
      'telehealth': 'appointments',
      'secure-messaging': 'message',
      'message-history': 'message',
      'care-team': 'message',
      'lab-results': 'labs',
      'health-metrics': 'documents',
      'care-plans': 'documents',
      'medical-history': 'forms',
      'medications': 'forms',
      'allergies': 'forms',
      'intake-forms': 'forms',
      'consent-forms': 'forms',
      'assessments': 'forms',
      'documents': 'documents',
      'upload-documents': 'documents',
      'protocol-documents': 'documents',
      'programs': 'programs',
      'courses': 'programs',
      'progress-tracking': 'programs',
      'invoices': 'billing',
      'payment-methods': 'billing',
      'insurance': 'billing',
      'packages': 'billing',
      'profile': 'profile',
      'notifications': 'profile',
      'emergency-contacts': 'profile',
    };

    const action = featureActions[feature.id] || 'portal';

    try {
      // Request SSO token from API
      const response = await fetch('/api/healthie/sso-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate SSO token');
      }

      const { ssoUrl } = await response.json();
      
      // Open authenticated portal in new tab
      window.open(ssoUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('SSO authentication failed:', error);
      // Fallback to direct portal URL without SSO
      // Note: Healthie uses /chat for messaging, /documents for labs/files
      const featureUrls: Record<string, string> = {
        'book-appointment': `${portalUrl}/book`,
        'upcoming-appointments': `${portalUrl}/appointments`,
        'appointment-history': `${portalUrl}/appointments`,
        'telehealth': `${portalUrl}/appointments`,
        'secure-messaging': `${portalUrl}/chat`,
        'message-history': `${portalUrl}/chat`,
        'care-team': `${portalUrl}/chat`,
        'lab-results': `${portalUrl}/documents`,
        'health-metrics': `${portalUrl}/documents`,
        'care-plans': `${portalUrl}/documents`,
        'medical-history': `${portalUrl}/forms`,
        'medications': `${portalUrl}/forms`,
        'allergies': `${portalUrl}/forms`,
        'intake-forms': `${portalUrl}/forms`,
        'consent-forms': `${portalUrl}/forms`,
        'assessments': `${portalUrl}/forms`,
        'documents': `${portalUrl}/documents`,
        'upload-documents': `${portalUrl}/documents`,
        'protocol-documents': `${portalUrl}/documents`,
        'programs': `${portalUrl}/programs`,
        'courses': `${portalUrl}/programs`,
        'progress-tracking': `${portalUrl}/programs`,
        'invoices': `${portalUrl}/billing`,
        'payment-methods': `${portalUrl}/billing`,
        'insurance': `${portalUrl}/billing`,
        'packages': `${portalUrl}/billing`,
        'profile': `${portalUrl}/settings`,
        'notifications': `${portalUrl}/settings`,
        'emergency-contacts': `${portalUrl}/settings`,
      };

      const url = featureUrls[feature.id] || portalUrl;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
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

      {/* Direct Portal Link */}
      <div className="text-center">
        <button
          onClick={async () => {
            try {
              const response = await fetch('/api/healthie/sso-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'portal' }),
              });
              
              if (response.ok) {
                const { ssoUrl } = await response.json();
                window.open(ssoUrl, '_blank', 'noopener,noreferrer');
              } else {
                // Fallback to direct URL
                window.open(portalUrl, '_blank', 'noopener,noreferrer');
              }
            } catch (error) {
              console.error('SSO failed:', error);
              window.open(portalUrl, '_blank', 'noopener,noreferrer');
            }
          }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors"
        >
          Open Full Patient Portal
          <ExternalLink className="w-4 h-4" />
        </button>
        <p className="text-sm text-stone-500 mt-2">
          Opens in a new tab with full Healthie EHR access
        </p>
      </div>

      {/* LMN Viewer Modal */}
      {showLmnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLmnModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-display font-bold text-stone-900">
                  Letters of Medical Necessity
                </h3>
              </div>
              <button onClick={() => setShowLmnModal(false)} className="text-stone-400 hover:text-stone-600 text-xl leading-none">&times;</button>
            </div>

            {lmnLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-stone-500 mt-2">Loading documents...</p>
              </div>
            ) : lmnRecords.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {lmnRecords.map((record) => (
                  <div
                    key={record.lmnNumber}
                    className="bg-stone-50 rounded-xl p-4 border border-stone-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-stone-900 text-sm">
                        {record.lmnNumber}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Order {record.orderNumber} &middot;{' '}
                        {new Date(record.issueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <a
                      href={`/api/lmn/${record.lmnNumber}`}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      View
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-600 font-medium">No Documents Yet</p>
                <p className="text-sm text-stone-500 mt-1">
                  When you purchase eligible products, your LMN will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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
            {/* Letters of Medical Necessity Button */}
            <button
              onClick={() => setShowLmnModal(true)}
              className="group relative flex items-start gap-4 p-5 bg-white border border-stone-200 rounded-2xl hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 transition-all text-left"
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-stone-900 group-hover:text-stone-700 transition-colors">
                  Letters of Medical Necessity
                </p>
                <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                  View HSA/FSA documents for tax-free reimbursement
                </p>
              </div>
              {lmnRecords.length > 0 && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {lmnRecords.length}
                </span>
              )}
              <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>

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
                    <p className="font-medium text-stone-900 group-hover:text-stone-700 transition-colors">
                      {feature.name}
                    </p>
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
