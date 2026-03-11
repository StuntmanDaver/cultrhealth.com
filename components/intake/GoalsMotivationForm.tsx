'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { Target } from 'lucide-react';

const GOAL_OPTIONS = [
  'Lose weight and keep it off',
  'Boost energy and reduce fatigue',
  'Optimize hormones and metabolism',
  'Manage blood sugar or diabetes',
  'Improve body composition and strength',
  'Slow aging and feel younger',
  'Reduce inflammation and joint pain',
  'Improve mental clarity and focus',
  'Other',
];

const SYMPTOM_OPTIONS = [
  'Stubborn weight that won\'t budge',
  'Low energy or constant fatigue',
  'Brain fog or poor focus',
  'Poor sleep or insomnia',
  'Joint pain or inflammation',
  'Sugar cravings or appetite issues',
  'Hormonal imbalance symptoms',
  'Slow recovery from exercise',
  'Mood swings or irritability',
  'Digestive issues or bloating',
  'Low motivation or drive',
  'Skin or hair changes',
];

const BARRIER_OPTIONS = [
  'Busy schedule / no time',
  'Cost or financial concerns',
  'Past programs didn\'t work',
  'Hard to stay consistent',
  'Lack of accountability',
  'Unsure what actually works',
  'Fear of side effects',
  'Overwhelmed by options',
  'No support system',
  'None — I\'m all in',
];

const DISCOVERY_OPTIONS = [
  'Friend or family referral',
  'Social media (Instagram, TikTok, etc.)',
  'Google search',
  'Creator or influencer',
  'My doctor or provider',
  'Podcast or YouTube',
  'Online article or blog',
  'Other',
];

export function GoalsMotivationForm() {
  const { formData, updateFormData } = useIntakeForm();

  const goals = formData.goalsMotivation || {};

  const updateGoals = (field: string, value: string | string[] | number) => {
    updateFormData({
      goalsMotivation: {
        ...goals,
        [field]: value,
      },
    });
  };

  const handleSymptomToggle = (symptom: string) => {
    const current = (goals.topSymptoms as string[]) || [];
    if (current.includes(symptom)) {
      updateGoals('topSymptoms', current.filter((s) => s !== symptom));
    } else if (current.length < 3) {
      updateGoals('topSymptoms', [...current, symptom]);
    }
  };

  const handleBarrierToggle = (barrier: string) => {
    const current = (goals.barriers as string[]) || [];
    if (barrier === 'None — I\'m all in') {
      updateGoals('barriers', current.includes(barrier) ? [] : [barrier]);
      return;
    }
    const withoutNone = current.filter((b) => b !== 'None — I\'m all in');
    if (withoutNone.includes(barrier)) {
      updateGoals('barriers', withoutNone.filter((b) => b !== barrier));
    } else {
      updateGoals('barriers', [...withoutNone, barrier]);
    }
  };

  const selectedSymptoms = (goals.topSymptoms as string[]) || [];
  const selectedBarriers = (goals.barriers as string[]) || [];

  return (
    <div className="space-y-8">
      <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Target className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">Help us understand your goals so we can match you with the right treatment plan.</p>
      </div>

      {/* Q1: Primary Goal */}
      <div>
        <label className="block text-base font-medium text-forest mb-3">
          What is the main result you want from working with us? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {GOAL_OPTIONS.map((option) => (
            <label
              key={option}
              className={`
                flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${goals.primaryGoal === option
                  ? 'border-forest bg-mint'
                  : 'border-forest-light hover:border-forest-muted'
                }
              `}
            >
              <input
                type="radio"
                name="primaryGoal"
                value={option}
                checked={goals.primaryGoal === option}
                onChange={() => updateGoals('primaryGoal', option)}
                className="w-6 h-6 text-forest border-forest-light focus:ring-forest"
              />
              <span className="text-base text-forest">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Q2: Why Now */}
      <div>
        <label className="block text-base font-medium text-forest mb-3">
          Why are you seeking help right now? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={(goals.whyNow as string) || ''}
          onChange={(e) => updateGoals('whyNow', e.target.value)}
          placeholder="What's happening in your life that made this the right time?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-forest-light focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all resize-none text-base"
        />
      </div>

      {/* Q3: Top 3 Symptoms */}
      <div>
        <label className="block text-base font-medium text-forest mb-1">
          What are your top 3 symptoms or frustrations? <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-forest-muted mb-3">Select up to 3</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SYMPTOM_OPTIONS.map((symptom) => {
            const isSelected = selectedSymptoms.includes(symptom);
            const isDisabled = !isSelected && selectedSymptoms.length >= 3;
            return (
              <label
                key={symptom}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border-2 transition-all
                  ${isSelected
                    ? 'border-forest bg-mint cursor-pointer'
                    : isDisabled
                      ? 'border-forest-light/40 opacity-50 cursor-not-allowed'
                      : 'border-forest-light hover:border-forest-muted cursor-pointer'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={isDisabled}
                  onChange={() => handleSymptomToggle(symptom)}
                  className="w-5 h-5 text-forest border-forest-light rounded focus:ring-forest"
                />
                <span className="text-sm text-forest">{symptom}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Q4: Priority Problem */}
      <div>
        <label className="block text-base font-medium text-forest mb-3">
          Which one problem would you pay to solve first? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={(goals.priorityProblem as string) || ''}
          onChange={(e) => updateGoals('priorityProblem', e.target.value)}
          placeholder="If we could fix one thing for you, what would it be?"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border-2 border-forest-light focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all resize-none text-base"
        />
      </div>

      {/* Q5: Urgency Scale */}
      <div>
        <label className="block text-base font-medium text-forest mb-3">
          How urgent is this for you? <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-1 sm:gap-2 justify-between">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => updateGoals('urgency', num)}
              className={`
                w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-semibold text-sm sm:text-base transition-all
                ${goals.urgency === num
                  ? 'bg-forest text-white shadow-lg shadow-forest/30'
                  : 'bg-white border-2 border-forest-light text-forest hover:border-forest-muted'
                }
              `}
            >
              {num}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-forest-muted">
          <span>Not urgent</span>
          <span>Extremely urgent</span>
        </div>
      </div>

      {/* Q6: Previous Attempts */}
      <div>
        <label className="block text-base font-medium text-forest mb-3">
          What have you already tried, and what happened? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={(goals.previousAttempts as string) || ''}
          onChange={(e) => updateGoals('previousAttempts', e.target.value)}
          placeholder="Diets, programs, medications, supplements — what worked, what didn't?"
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-2 border-forest-light focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all resize-none text-base"
        />
      </div>

      {/* Q7: Discovery & Trust */}
      <div>
        <label className="block text-base font-medium text-forest mb-3">
          How did you first hear about us? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {DISCOVERY_OPTIONS.map((option) => (
            <label
              key={option}
              className={`
                flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                ${goals.discoverySource === option
                  ? 'border-forest bg-mint'
                  : 'border-forest-light hover:border-forest-muted'
                }
              `}
            >
              <input
                type="radio"
                name="discoverySource"
                value={option}
                checked={goals.discoverySource === option}
                onChange={() => updateGoals('discoverySource', option)}
                className="w-6 h-6 text-forest border-forest-light focus:ring-forest"
              />
              <span className="text-base text-forest">{option}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-forest mb-2">
            What made you trust us enough to get started?
          </label>
          <textarea
            value={(goals.trustReason as string) || ''}
            onChange={(e) => updateGoals('trustReason', e.target.value)}
            placeholder="e.g., a friend's results, the science content, provider credentials..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl border-2 border-forest-light focus:border-forest focus:ring-2 focus:ring-mint outline-none transition-all resize-none text-base"
          />
        </div>
      </div>

      {/* Q8: Barriers */}
      <div>
        <label className="block text-base font-medium text-forest mb-1">
          What usually gets in the way of following through on a health program? <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-forest-muted mb-3">Select all that apply</p>
        <div className="space-y-2">
          {BARRIER_OPTIONS.map((barrier) => {
            const isSelected = selectedBarriers.includes(barrier);
            return (
              <label
                key={barrier}
                className={`
                  flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${isSelected
                    ? 'border-forest bg-mint'
                    : 'border-forest-light hover:border-forest-muted'
                  }
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleBarrierToggle(barrier)}
                  className="w-5 h-5 text-forest border-forest-light rounded focus:ring-forest"
                />
                <span className="text-base text-forest">{barrier}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
