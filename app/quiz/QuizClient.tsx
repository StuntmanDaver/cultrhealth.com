'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { QUIZ_QUESTIONS, calculateRecommendation, type QuizResult } from '@/lib/config/quiz';
import { PLANS } from '@/lib/config/plans';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

export function QuizClient() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const question = QUIZ_QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentQuestion === QUIZ_QUESTIONS.length - 1;

  const handleSelect = useCallback((optionId: string) => {
    if (!question) return;

    if (question.type === 'multi') {
      const current = (answers[question.id] as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];
      setAnswers(prev => ({ ...prev, [question.id]: updated }));
    } else {
      const newAnswers = { ...answers, [question.id]: optionId };
      setAnswers(newAnswers);

      // Auto-advance on single select
      if (isLastQuestion) {
        const rec = calculateRecommendation(newAnswers);
        setResult(rec);
      } else {
        setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
      }
    }
  }, [question, answers, isLastQuestion]);

  const handleMultiContinue = () => {
    if (isLastQuestion) {
      const rec = calculateRecommendation(answers);
      setResult(rec);
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // ─── Results View ───
  if (result) {
    const plan = PLANS.find(p => p.slug === result.recommendedTier);

    return (
      <div className="min-h-screen bg-cultr-offwhite">
        <div className="max-w-3xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-cultr-mint px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-cultr-forest" />
              <span className="text-sm font-display font-medium text-cultr-forest">Your personalized match</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-cultr-forest mb-4">
              We recommend {result.tierName}.
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
                  <h2 className="text-2xl font-display font-bold text-cultr-forest">{plan.name}</h2>
                  <p className="text-cultr-textMuted text-sm">{plan.bestFor}</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-cultr-forest">${plan.price}</span>
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
              <Link href={`/join/${plan.slug}`}>
                <Button size="lg" className="w-full">Join {plan.name}</Button>
              </Link>
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
              onClick={() => { setResult(null); setCurrentQuestion(0); setAnswers({}); }}
              className="text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors"
            >
              Retake quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Quiz View ───
  return (
    <div className="min-h-screen bg-cultr-offwhite flex flex-col">
      {/* Progress Bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-cultr-sage">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className={`flex items-center gap-1 text-sm font-medium transition-colors ${
              currentQuestion === 0 ? 'text-cultr-textMuted/40 cursor-not-allowed' : 'text-cultr-forest hover:text-cultr-forestDark'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-xs text-cultr-textMuted">
            {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
          </span>
          <Link href="/" className="text-sm text-cultr-textMuted hover:text-cultr-forest transition-colors">
            Exit
          </Link>
        </div>
        <div className="h-1 bg-cultr-mint">
          <div
            className="h-full bg-cultr-forest transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl text-center">
          <h2 className="text-2xl md:text-4xl font-display font-bold text-cultr-forest mb-2">
            {question.question}
          </h2>
          {question.subtitle && (
            <p className="text-cultr-textMuted mb-10">{question.subtitle}</p>
          )}
          {!question.subtitle && <div className="mb-10" />}

          {/* Options */}
          {question.type === 'visual' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`
                      flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200
                      ${isSelected
                        ? 'border-cultr-forest bg-cultr-mint scale-[1.02] shadow-lg'
                        : 'border-cultr-sage bg-white hover:border-cultr-forest/40 hover:shadow-md'
                      }
                    `}
                  >
                    <span className="text-3xl">{option.emoji}</span>
                    <span className="text-sm font-medium text-cultr-forest">{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : question.type === 'multi' ? (
            <div className="space-y-3">
              {question.options.map((option) => {
                const selected = ((answers[question.id] as string[]) || []).includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`
                      w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200
                      ${selected
                        ? 'border-cultr-forest bg-cultr-mint'
                        : 'border-cultr-sage bg-white hover:border-cultr-forest/40'
                      }
                    `}
                  >
                    <span className="text-xl">{option.emoji}</span>
                    <span className="font-medium text-cultr-forest">{option.label}</span>
                    {selected && <Check className="w-5 h-5 text-cultr-forest ml-auto" />}
                  </button>
                );
              })}
              <button
                onClick={handleMultiContinue}
                disabled={!answers[question.id] || (answers[question.id] as string[]).length === 0}
                className={`
                  mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all
                  ${answers[question.id] && (answers[question.id] as string[]).length > 0
                    ? 'bg-cultr-forest text-white hover:bg-cultr-forestDark shadow-lg'
                    : 'bg-cultr-sage/30 text-cultr-textMuted cursor-not-allowed'
                  }
                `}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {question.options.map((option) => {
                const isSelected = answers[question.id] === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`
                      w-full p-4 rounded-xl border-2 text-left font-medium transition-all duration-200
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
