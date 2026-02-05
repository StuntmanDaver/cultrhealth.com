'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Activity, 
  Calendar, 
  TrendingUp, 
  ClipboardList,
  Plus,
  RefreshCw,
  ChevronRight
} from 'lucide-react'
import { BiomarkerTrends, type BiomarkerTrendData } from '@/components/dashboard/BiomarkerTrends'
import { BiologicalAgeCard } from '@/components/dashboard/BiologicalAgeCard'

// =============================================================================
// BIO-DASHBOARD
// The user's rejuvenation journey visualization
// Altos Labs alignment: Shows quantitative biomarker tracking over time
// =============================================================================

interface DashboardData {
  resilienceScore?: {
    overall_score: number
    grade: string
    category_scores: Record<string, number>
    primary_phenotype?: string
    biological_age?: number
    chronological_age?: number
    age_gap?: number
    calculated_at: string
  }
  biomarkers: BiomarkerTrendData[]
  activeProtocol?: {
    id: string
    template_id?: string
    started_at: string
    expected_outcomes: Array<{
      biomarkerId: string
      biomarkerName: string
      direction: string
      timeframeWeeks: number
    }>
    average_adherence_pct?: number
  }
  recentLogs: Array<{
    log_date: string
    energy_level?: number
    mood_rating?: number
    sleep_quality?: number
    protocol_adherence_pct?: number
  }>
  streakDays: number
}

// Mock data for demonstration (replace with API calls)
const MOCK_DATA: DashboardData = {
  resilienceScore: {
    overall_score: 72,
    grade: 'B',
    category_scores: {
      inflammation: 68,
      metabolic: 75,
      hormonal: 70,
      longevity: 74,
    },
    primary_phenotype: 'high-inflammation-low-repair',
    biological_age: 38.5,
    chronological_age: 42,
    age_gap: -3.5,
    calculated_at: new Date().toISOString(),
  },
  biomarkers: [
    {
      biomarkerId: 'hs-crp',
      name: 'hs-CRP',
      category: 'inflammation',
      unit: 'mg/L',
      currentValue: 1.8,
      currentScore: 72,
      currentStatus: 'acceptable',
      trend: 'improving',
      percentChange: -15,
      dataPoints: [
        { date: '2025-10-01', value: 2.4 },
        { date: '2025-11-01', value: 2.1 },
        { date: '2025-12-01', value: 1.8 },
      ],
    },
    {
      biomarkerId: 'hba1c',
      name: 'HbA1c',
      category: 'metabolic',
      unit: '%',
      currentValue: 5.2,
      currentScore: 88,
      currentStatus: 'optimal',
      trend: 'stable',
      percentChange: -2,
      dataPoints: [
        { date: '2025-10-01', value: 5.4 },
        { date: '2025-12-01', value: 5.2 },
      ],
    },
    {
      biomarkerId: 'fasting-insulin',
      name: 'Fasting Insulin',
      category: 'metabolic',
      unit: 'μIU/mL',
      currentValue: 7.2,
      currentScore: 65,
      currentStatus: 'acceptable',
      trend: 'improving',
      percentChange: -18,
      dataPoints: [
        { date: '2025-09-01', value: 9.5 },
        { date: '2025-11-01', value: 8.2 },
        { date: '2025-12-15', value: 7.2 },
      ],
    },
    {
      biomarkerId: 'vitamin-d',
      name: 'Vitamin D',
      category: 'longevity',
      unit: 'ng/mL',
      currentValue: 62,
      currentScore: 85,
      currentStatus: 'optimal',
      trend: 'improving',
      percentChange: 24,
      dataPoints: [
        { date: '2025-08-01', value: 38 },
        { date: '2025-10-01', value: 50 },
        { date: '2025-12-01', value: 62 },
      ],
    },
  ],
  activeProtocol: {
    id: 'proto-123',
    template_id: 'metabolic-optimization',
    started_at: '2025-11-15',
    expected_outcomes: [
      { biomarkerId: 'fasting-insulin', biomarkerName: 'Fasting Insulin', direction: 'decrease', timeframeWeeks: 8 },
      { biomarkerId: 'hs-crp', biomarkerName: 'hs-CRP', direction: 'decrease', timeframeWeeks: 8 },
    ],
    average_adherence_pct: 85,
  },
  recentLogs: [
    { log_date: '2026-01-29', energy_level: 7, mood_rating: 8, sleep_quality: 7, protocol_adherence_pct: 100 },
    { log_date: '2026-01-28', energy_level: 6, mood_rating: 7, sleep_quality: 8, protocol_adherence_pct: 90 },
    { log_date: '2026-01-27', energy_level: 8, mood_rating: 8, sleep_quality: 9, protocol_adherence_pct: 100 },
  ],
  streakDays: 12,
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with actual API calls
    // fetch('/api/dashboard').then(r => r.json()).then(setData)
    setTimeout(() => {
      setData(MOCK_DATA)
      setIsLoading(false)
    }, 500)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    )
  }

  const protocolWeeksElapsed = data.activeProtocol
    ? Math.floor((Date.now() - new Date(data.activeProtocol.started_at).getTime()) / (7 * 24 * 60 * 60 * 1000))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bio-Dashboard</h1>
            <p className="text-sm text-gray-500">Your rejuvenation journey</p>
          </div>
          <Link
            href="/track/daily"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Today
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Resilience Score */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">Resilience Score</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {data.resilienceScore?.overall_score || '—'}
              </span>
              <span className="text-lg font-semibold text-blue-500 mb-1">
                {data.resilienceScore?.grade || ''}
              </span>
            </div>
          </div>

          {/* Logging Streak */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">Logging Streak</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">{data.streakDays}</span>
              <span className="text-sm text-gray-500 mb-1">days</span>
            </div>
          </div>

          {/* Protocol Progress */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-500">Protocol Week</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {data.activeProtocol ? protocolWeeksElapsed + 1 : '—'}
              </span>
              {data.activeProtocol && (
                <span className="text-sm text-gray-500 mb-1">of 8</span>
              )}
            </div>
          </div>

          {/* Adherence */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-gray-500">Adherence</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {data.activeProtocol?.average_adherence_pct || '—'}
              </span>
              <span className="text-sm text-gray-500 mb-1">%</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Biological Age */}
          <div className="lg:col-span-1">
            {data.resilienceScore?.biological_age && data.resilienceScore?.chronological_age ? (
              <BiologicalAgeCard
                biologicalAge={data.resilienceScore.biological_age}
                chronologicalAge={data.resilienceScore.chronological_age}
                ageGap={data.resilienceScore.age_gap || 0}
                provider="Epigenetic Clock"
                lastUpdated="Jan 15, 2026"
              />
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Biological Age</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Upload your epigenetic test results to see your biological age.
                </p>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
                  Upload Results
                </button>
              </div>
            )}

            {/* Active Protocol Card */}
            {data.activeProtocol && (
              <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Active Protocol</h3>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Week {protocolWeeksElapsed + 1}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 capitalize">
                  {data.activeProtocol.template_id?.replace(/-/g, ' ') || 'Custom Protocol'}
                </p>
                
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Expected Outcomes</p>
                  {data.activeProtocol.expected_outcomes.slice(0, 3).map((outcome) => (
                    <div key={outcome.biomarkerId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{outcome.biomarkerName}</span>
                      <span className={`text-xs font-medium ${
                        outcome.direction === 'decrease' ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {outcome.direction === 'decrease' ? '↓' : '↑'} in {outcome.timeframeWeeks}w
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/track/daily"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Log Check-in
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Right Column - Biomarker Trends */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Biomarker Trends</h2>
                <button className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                  View All
                </button>
              </div>
              
              <BiomarkerTrends 
                data={data.biomarkers}
                showSparklines
                compactMode
              />
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Logs</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Energy</th>
                  <th className="pb-3 font-medium">Mood</th>
                  <th className="pb-3 font-medium">Sleep</th>
                  <th className="pb-3 font-medium">Adherence</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {data.recentLogs.map((log) => (
                  <tr key={log.log_date} className="border-t border-gray-100">
                    <td className="py-3 text-gray-900">
                      {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3">
                      <span className={`font-medium ${(log.energy_level || 0) >= 7 ? 'text-green-600' : 'text-gray-600'}`}>
                        {log.energy_level || '—'}/10
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`font-medium ${(log.mood_rating || 0) >= 7 ? 'text-green-600' : 'text-gray-600'}`}>
                        {log.mood_rating || '—'}/10
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`font-medium ${(log.sleep_quality || 0) >= 7 ? 'text-green-600' : 'text-gray-600'}`}>
                        {log.sleep_quality || '—'}/10
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        (log.protocol_adherence_pct || 0) >= 90 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {log.protocol_adherence_pct || '—'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
