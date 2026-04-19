'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { getActiveQuestions, calculateRecommendation, type QuizResult } from '@/lib/config/quiz';
import { getJoinCheckoutUrl } from '@/lib/config/links';
import { PLANS } from '@/lib/config/plans';
import { trackQuizStart, trackQuizStep, trackQuizComplete, trackEvent } from '@/lib/analytics';
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from 'lucide-react';

export function QuizClient() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const sessionId = useRef(crypto.randomUUID());
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [pendingJoinHref, setPendingJoinHref] = useState('');
  const [leadForm, setLeadForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [leadSubmitting, setLeadSubmitting] = useState(false);

  // Compute active questions based on current answers
  const activeQuestions = getActiveQuestions(answers);
  // Clamp index if active questions shrunk (e.g., conditional Q4 hidden after going back)
  const safeIndex = Math.min(currentIndex, Math.max(0, activeQuestions.length - 1));
  const question = activeQuestions[safeIndex];
  const progress = ((safeIndex + 1) / activeQuestions.length) * 100;
  const isLastQuestion = safeIndex === activeQuestions.length - 1;

  // Sync currentIndex state if it drifted out of bounds
  useEffect(() => {
    if (currentIndex !== safeIndex) {
      setCurrentIndex(safeIndex);
    }
  }, [currentIndex, safeIndex]);

  // Track initial quiz start
  const hasTrackedStart = useRef(false);
  useEffect(() => {
    if (!hasTrackedStart.current) {
      trackQuizStart();
      hasTrackedStart.current = true;
    }
  }, []);

  // Fire-and-forget save when results are computed
  useEffect(() => {
    if (!result) return;
    
    // Track quiz completion to GA4 and dataLayer
    trackQuizComplete(answers, {
      recommendedTier: result.recommendedTier,
      coreTherapy: result.coreTherapy,
    });

    fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId.current,
        answers,
        recommendedTier: result.recommendedTier,
        recommendedTherapy: result.coreTherapy?.slug ?? null,
      }),
    }).catch(() => { /* fire-and-forget */ });
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear answers for questions that are no longer visible (e.g., Q4 hidden after changing Q1/Q2)
  const clearStaleAnswers = useCallback((updatedAnswers: Record<string, string | string[]>) => {
    const active = getActiveQuestions(updatedAnswers);
    const activeIds = new Set(active.map(q => q.id));
    const cleaned = { ...updatedAnswers };
    let hadStale = false;
    for (const key of Object.keys(cleaned)) {
      if (!activeIds.has(key)) {
        delete cleaned[key];
        hadStale = true;
      }
    }
    return hadStale ? cleaned : updatedAnswers;
  }, []);

  const handleSelect = useCallback((optionId: string) => {
    if (!question) return;

    if (question.type === 'multi') {
      const current = (answers[question.id] as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      const newAnswers = clearStaleAnswers({ ...answers, [question.id]: updated });
      setAnswers(newAnswers);
    } else {
      const newAnswers = clearStaleAnswers({ ...answers, [question.id]: optionId });
      setAnswers(newAnswers);

      // Track the answer directly when a single-select option is clicked
      trackQuizStep(safeIndex + 1, question.id, optionId);

      // Recompute active questions with the cleaned answer set
      const nextActive = getActiveQuestions(newAnswers);
      const nextIsLast = safeIndex === nextActive.length - 1;

      if (nextIsLast) {
        const rec = calculateRecommendation(newAnswers);
        setResult(rec);
      } else {
        setTimeout(() => setCurrentIndex(safeIndex + 1), 300);
      }
    }
  }, [question, answers, safeIndex, clearStaleAnswers]);

  const handleMultiContinue = () => {
    const cleaned = clearStaleAnswers(answers);
    if (cleaned !== answers) setAnswers(cleaned);

    // Track the answer when a multi-select continue button is clicked
    if (question && cleaned[question.id]) {
      trackQuizStep(safeIndex + 1, question.id, cleaned[question.id]);
    }

    const nextActive = getActiveQuestions(cleaned);
    const nextIsLast = safeIndex === nextActive.length - 1;

    if (nextIsLast) {
      const rec = calculateRecommendation(cleaned);
      setResult(rec);
    } else {
      setCurrentIndex(safeIndex + 1);
    }
  };

  const handleBack = () => {
    if (safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitting(true);
    try {
      await fetch('/api/quiz/submit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId.current, ...leadForm }),
      });
    } catch { /* fire-and-forget */ }
    setLeadSubmitting(false);
    setShowLeadModal(false);
    handleJoinClick(pendingJoinHref);
  };

  const handleJoinClick = (href: string) => {
    // Track to GA4 / GTM DataLayer
    trackEvent('quiz_join_click', {
      event_category: 'quiz',
      recommended_tier: result?.recommendedTier,
      recommended_therapy: result?.coreTherapy?.slug || null,
      destination_url: href
    });
    
    // Also push a specific datalayer event for ease of use
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'quiz_cta_clicked',
        quiz_recommended_tier: result?.recommendedTier,
        quiz_destination_url: href
      });
    }

    // Track join click (fire-and-forget)
    fetch('/api/quiz/submit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: sessionId.current }),
    }).catch(() => { /* fire-and-forget */ });

    if (href.startsWith('http')) {
      window.location.assign(href);
      return;
    }

    router.push(href);
  };

  // ─── Results View ───
  if (result) {
    const plan = PLANS.find(p => p.slug === result.recommendedTier);
    const displayPrice = result.coreTherapy?.price ?? plan?.price ?? 0;
    const displayName = result.coreTherapy
      ? `${plan?.name} — ${result.coreTherapy.name}`
      : plan?.name ?? result.tierName;
    const pricePrefix = !result.coreTherapy && result.recommendedTier === 'core'
      ? 'Starting at'
      : undefined;
    // Core tier always needs a therapy param — join page redirects to /pricing without one
    // Default to semaglutide (cheapest at $149) when no specific therapy was recommended
    const joinHref = result.recommendedTier === 'core'
      ? getJoinCheckoutUrl('core', { therapySlug: result.coreTherapy?.slug ?? 'semaglutide' })
      : getJoinCheckoutUrl(result.recommendedTier);

    return (
      <>
      <div className="min-h-screen grad-light">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 grad-mint px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-cultr-forest" />
              <span className="text-sm font-display font-medium text-cultr-forest">Your personalized match</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-cultr-forest mb-4">
              We recommend {plan?.name ?? result.tierName}.
            </h1>
            <p className="text-cultr-textMuted max-w-md mx-auto">
              Based on your goal to <span className="lowercase">{result.primaryGoal}</span>, here&apos;s your matched plan and protocols.
            </p>
          </div>

          {/* Recommended Plan */}
          {plan && (
            <div className="bg-white rounded-2xl border-2 border-cultr-forest p-8 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs font-display font-bold text-cultr-sage tracking-widest mb-1">RECOMMENDED PLAN</p>
                  <h2 className="text-2xl font-display font-bold text-cultr-forest">{displayName}</h2>
                  <p className="text-cultr-textMuted text-sm">{plan.bestFor}</p>
                </div>
                <div className="text-right">
                  {pricePrefix && (
                    <span className="text-xs text-cultr-textMuted block mb-1">{pricePrefix}</span>
                  )}
                  <span className="text-3xl font-bold text-cultr-forest">${displayPrice}</span>
                  <span className="text-cultr-textMuted text-sm">/mo</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-cultr-text">
                    <Check className="w-4 h-4 text-cultr-forest shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="w-full"
                onClick={() => { setPendingJoinHref(joinHref); setShowLeadModal(true); }}
              >
                Get Started — {plan.name}
              </Button>
            </div>
          )}

          {/* Recommended Medications */}
          {result.recommendedMedications.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-display font-bold text-cultr-forest mb-4">Recommended protocols</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.recommendedMedications.map((med) => (
                  <div key={med.id} className="bg-white rounded-xl border border-cultr-sage p-5">
                    <h4 className="font-bold text-cultr-forest mb-1">{med.name}</h4>
                    <p className="text-xs text-cultr-textMuted">{med.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Secondary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button variant="secondary">See all plans</Button>
            </Link>
            <button
              onClick={() => { setResult(null); setCurrentIndex(0); setAnswers({}); sessionId.current = crypto.randomUUID(); }}
              className="text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors"
            >
              Retake quiz
            </button>
          </div>
        </div>
      </div>

      {/* Lead Capture Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
            <button
              onClick={() => { setShowLeadModal(false); handleJoinClick(pendingJoinHref); }}
              className="absolute top-4 right-4 text-cultr-textMuted hover:text-cultr-forest transition-colors"
              aria-label="Skip and continue"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 grad-mint px-3 py-1.5 rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5 text-cultr-forest" />
                <span className="text-xs font-display font-medium text-cultr-forest">Almost there</span>
              </div>
              <h2 className="text-2xl font-display font-bold text-cultr-forest mb-1">Claim your plan</h2>
              <p className="text-sm text-cultr-textMuted">Enter your info and we&apos;ll have a provider reach out to get you started.</p>
            </div>

            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-cultr-forest mb-1">First name</label>
                  <input
                    type="text"
                    required
                    value={leadForm.firstName}
                    onChange={e => setLeadForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-cultr-sage focus:border-cultr-forest focus:outline-none text-sm text-cultr-forest"
                    placeholder="Jane"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-cultr-forest mb-1">Last name</label>
                  <input
                    type="text"
                    required
                    value={leadForm.lastName}
                    onChange={e => setLeadForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-cultr-sage focus:border-cultr-forest focus:outline-none text-sm text-cultr-forest"
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-cultr-forest mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={leadForm.email}
                  onChange={e => setLeadForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-cultr-sage focus:border-cultr-forest focus:outline-none text-sm text-cultr-forest"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-cultr-forest mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={leadForm.phone}
                  onChange={e => setLeadForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-cultr-sage focus:border-cultr-forest focus:outline-none text-sm text-cultr-forest"
                  placeholder="(555) 000-0000"
                />
              </div>
              <Button size="lg" className="w-full" isLoading={leadSubmitting}>
                Continue to checkout
              </Button>
            </form>
          </div>
        </div>
      )}
      </>
    );
  }

  // ─── Quiz View ───
  if (!question) return null;

  return (
    <div className="min-h-screen grad-light flex flex-col">
      {/* Progress Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-cultr-sage">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={safeIndex === 0}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${
              safeIndex === 0 ? 'text-cultr-textMuted/40 cursor-not-allowed' : 'text-cultr-forest hover:text-cultr-forestDark'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-xs text-cultr-textMuted">
            {safeIndex + 1} of {activeQuestions.length}
          </span>
          <Link href="/" className="text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors">
            Exit
          </Link>
        </div>
        <div className="h-1 grad-mint">
          <div
            className="h-full grad-dark transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-cultr-forest mb-3">
            {question.question}
          </h2>
          {question.subtitle && (
            <p className="text-lg text-cultr-textMuted mb-12">{question.subtitle}</p>
          )}
          {!question.subtitle && <div className="mb-12" />}

          {/* Options */}
          {question.type === 'visual' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`
                      flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-cultr-forest bg-cultr-mint scale-[1.02] shadow-lg'
                        : 'border-cultr-sage bg-white hover:border-cultr-forest/40 hover:shadow-md'
                      }
                    `}
                  >
                    <span className="text-4xl">{option.emoji}</span>
                    <span className="text-base font-medium text-cultr-forest">{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : question.type === 'multi' ? (
            <div className="space-y-4 max-w-2xl mx-auto">
              {question.options.map((option) => {
                const selected = ((answers[question.id] as string[]) || []).includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`
                      w-full flex items-center gap-5 p-5 rounded-xl border-2 text-left transition-all duration-200
                      ${selected
                        ? 'border-cultr-forest bg-cultr-mint'
                        : 'border-cultr-sage bg-white hover:border-cultr-forest/40'
                      }
                    `}
                  >
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-lg font-medium text-cultr-forest">{option.label}</span>
                    {selected && <Check className="w-5 h-5 text-cultr-forest ml-auto" />}
                  </button>
                );
              })}
              <button
                onClick={handleMultiContinue}
                disabled={!answers[question.id] || (answers[question.id] as string[]).length === 0}
                className={`
                  mt-8 w-full flex items-center justify-center gap-2 py-5 rounded-xl text-lg font-semibold transition-all
                  ${answers[question.id] && (answers[question.id] as string[]).length > 0
                    ? 'bg-cultr-forest text-white hover:bg-cultr-forestDark shadow-lg'
                    : 'bg-cultr-sage/30 text-cultr-textMuted cursor-not-allowed'
                  }
                `}
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`
                      w-full p-5 rounded-xl border-2 text-left font-medium text-lg transition-all duration-200
                      ${isSelected
                        ? 'border-cultr-forest bg-cultr-mint'
                        : 'border-cultr-sage bg-white hover:border-cultr-forest/40'
                      }
                    `}
                  >
                    <span className="text-cultr-forest">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
