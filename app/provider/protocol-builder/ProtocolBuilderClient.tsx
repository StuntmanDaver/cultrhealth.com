'use client'

import { useMemo, useState } from 'react'
import Button from '@/components/ui/Button'
import {
  generateProtocol,
  getProtocolTemplate,
  PROTOCOL_TEMPLATES,
  type ProtocolParameter,
  searchSymptoms,
  generateCombinedProtocol,
  getAllSupplements,
  getAllPeptides,
  type SymptomProtocol,
  type CombinedSymptomProtocol,
  type SynergisticPeptide,
  PEPTIDE_GOALS,
  getPeptidesForGoals,
  type PeptideGoal,
  type CatalogPeptide,
} from '@/lib/protocol-templates'
import { Search, Plus, X, Activity, Pill, AlertCircle, FileText, Zap, Star, Circle, Target, ChevronDown, ChevronUp, DollarSign, Shield, FlaskConical } from 'lucide-react'

type ProtocolBuilderClientProps = {
  providerEmail: string
}

type BuilderMode = 'template' | 'symptom'

export function ProtocolBuilderClient({ providerEmail }: ProtocolBuilderClientProps) {
  const [mode, setMode] = useState<BuilderMode>('template')
  
  // Template Mode State
  const defaultTemplateId = PROTOCOL_TEMPLATES[0]?.id ?? ''
  const [templateId, setTemplateId] = useState(defaultTemplateId)
  const [parameters, setParameters] = useState<Record<string, string | number | boolean>>({})
  const [selectedGoals, setSelectedGoals] = useState<PeptideGoal[]>([])
  const [showGoalPeptides, setShowGoalPeptides] = useState(true)
  const [expandedPeptide, setExpandedPeptide] = useState<string | null>(null)
  
  // Symptom Mode State
  const [symptomSearch, setSymptomSearch] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomProtocol[]>([])
  
  // Shared State
  const [patientId, setPatientId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Template Logic
  const template = useMemo(() => getProtocolTemplate(templateId), [templateId])
  
  const templatePreview = useMemo(() => {
    if (!template) return null
    return generateProtocol(template.id, parameters)
  }, [template, parameters])

  // Symptom Logic
  const symptomSearchResults = useMemo(() => {
    if (!symptomSearch) return []
    return searchSymptoms(symptomSearch).filter(
      (s) => !selectedSymptoms.some((selected) => selected.id === s.id)
    )
  }, [symptomSearch, selectedSymptoms])

  const combinedProtocol = useMemo(() => {
    if (selectedSymptoms.length === 0) return null
    return generateCombinedProtocol(selectedSymptoms.map(s => s.id))
  }, [selectedSymptoms])

  // Goal-based peptide recommendations
  const goalRecommendations = useMemo(() => {
    if (selectedGoals.length === 0) return null
    return getPeptidesForGoals(selectedGoals)
  }, [selectedGoals])

  const toggleGoal = (goalId: PeptideGoal) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    )
  }

  const updateParameter = (param: ProtocolParameter, value: string | number | boolean) => {
    setParameters((prev) => ({
      ...prev,
      [param.id]: value,
    }))
  }

  const initializeParameters = (nextTemplateId: string) => {
    const nextTemplate = getProtocolTemplate(nextTemplateId)
    if (!nextTemplate) return
    const defaults = nextTemplate.parameters.reduce<Record<string, string | number | boolean>>(
      (acc, param) => {
        acc[param.id] = param.defaultValue
        return acc
      },
      {}
    )
    setParameters(defaults)
  }

  const handleTemplateChange = (value: string) => {
    setTemplateId(value)
    initializeParameters(value)
  }

  const addSymptom = (symptom: SymptomProtocol) => {
    setSelectedSymptoms(prev => [...prev, symptom])
    setSymptomSearch('')
  }

  const removeSymptom = (symptomId: string) => {
    setSelectedSymptoms(prev => prev.filter(s => s.id !== symptomId))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage(null)
    setResultMessage(null)

    if (!patientId) {
      setErrorMessage('Healthie Patient ID is required.')
      return
    }

    if (mode === 'template' && !template) {
      setErrorMessage('Please select a protocol template.')
      return
    }

    if (mode === 'symptom' && selectedSymptoms.length === 0) {
      setErrorMessage('Please select at least one symptom.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = mode === 'template' 
        ? {
            templateId: template?.id,
            patientHealthieId: patientId,
            parameters,
          }
        : {
            symptomIds: selectedSymptoms.map(s => s.id),
            patientHealthieId: patientId,
          }

      const response = await fetch('/api/protocol/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()
      if (!response.ok) {
        setErrorMessage(responseData?.error || 'Failed to generate protocol.')
        return
      }

      setResultMessage('Protocol created successfully in Healthie.')
      // Optional: Clear selection after success
      if (mode === 'symptom') {
        setSelectedSymptoms([])
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unexpected error.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cultr-offwhite">
      <section className="bg-cultr-forest text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold">Protocol Engine</h1>
            <p className="text-white/80 text-sm">Provider: {providerEmail}</p>
          </div>
          <div className="flex bg-white/10 p-1 rounded-lg">
            <button
              onClick={() => setMode('template')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'template' ? 'bg-white text-cultr-forest shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setMode('symptom')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'symptom' ? 'bg-white text-cultr-forest shadow-sm' : 'text-white hover:bg-white/10'
              }`}
            >
              Symptom Stack
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_1.2fr] gap-8">
        
        {/* Left Column: Input Controls */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-cultr-sage/20">
            <label className="block text-sm font-medium text-cultr-text mb-2">Healthie Patient ID</label>
            <input
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-xl border border-cultr-sage/50 bg-cultr-offwhite px-4 py-3 text-sm focus:ring-2 focus:ring-cultr-forest/20 outline-none"
              placeholder="e.g. patient_123"
            />
          </div>

          {mode === 'template' ? (
            <>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-cultr-sage/20 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-cultr-text mb-2">Select Template</label>
                  <select
                    value={templateId}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="w-full rounded-xl border border-cultr-sage/50 bg-cultr-offwhite px-4 py-3 text-sm focus:ring-2 focus:ring-cultr-forest/20 outline-none"
                  >
                    {PROTOCOL_TEMPLATES.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>

                {template?.parameters.length ? (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-cultr-forest border-b border-cultr-sage/20 pb-2">Configuration</h3>
                    {template.parameters.map((param) => {
                      const value = parameters[param.id] ?? param.defaultValue
                      return (
                        <div key={param.id}>
                          <label className="block text-xs font-medium text-cultr-textMuted mb-1">{param.label}</label>
                          {param.type === 'select' ? (
                            <select
                              value={String(value)}
                              onChange={(e) => updateParameter(param, e.target.value)}
                              className="w-full rounded-lg border border-cultr-sage/30 bg-white px-3 py-2 text-sm"
                            >
                              {(param.options || []).map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : param.type === 'boolean' ? (
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(value)}
                                onChange={(e) => updateParameter(param, e.target.checked)}
                                className="rounded border-cultr-sage text-cultr-forest focus:ring-cultr-forest"
                              />
                              <span className="text-sm text-cultr-text">Enabled</span>
                            </label>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={Number(value)}
                                onChange={(e) => updateParameter(param, Number(e.target.value))}
                                className="w-full rounded-lg border border-cultr-sage/30 bg-white px-3 py-2 text-sm"
                              />
                              {param.unit && <span className="text-xs text-cultr-textMuted w-12">{param.unit}</span>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              {/* Goal-Based Peptide Recommendations */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-cultr-sage/20 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-cultr-forest flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Patient Goals
                  </h3>
                  <span className="text-xs text-cultr-textMuted">{selectedGoals.length} selected</span>
                </div>
                <p className="text-xs text-cultr-textMuted">Select patient goals to see synergistic peptide recommendations from the full catalog.</p>
                <div className="grid grid-cols-2 gap-2">
                  {PEPTIDE_GOALS.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`text-left p-3 rounded-xl border transition-all text-xs ${
                        selectedGoals.includes(goal.id)
                          ? 'bg-cultr-forest text-white border-cultr-forest'
                          : 'bg-cultr-offwhite border-cultr-sage/30 hover:border-cultr-forest/50'
                      }`}
                    >
                      <span className="text-base mr-1">{goal.icon}</span>
                      <span className="font-medium">{goal.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-cultr-sage/20 space-y-6">
              <div>
                <label className="block text-sm font-medium text-cultr-text mb-2">Add Symptoms</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-cultr-textMuted" />
                  <input
                    value={symptomSearch}
                    onChange={(e) => setSymptomSearch(e.target.value)}
                    className="w-full rounded-xl border border-cultr-sage/50 bg-cultr-offwhite pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-cultr-forest/20 outline-none"
                    placeholder="Search symptoms (e.g. anxiety, fatigue)"
                  />
                </div>
                {symptomSearchResults.length > 0 && (
                  <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-cultr-sage/20 bg-white shadow-lg">
                    {symptomSearchResults.map((symptom) => (
                      <button
                        key={symptom.id}
                        onClick={() => addSymptom(symptom)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-cultr-offwhite flex justify-between items-center group"
                      >
                        <span>{symptom.symptom}</span>
                        <Plus className="h-4 w-4 text-cultr-forest opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-cultr-forest border-b border-cultr-sage/20 pb-2 mb-3">Selected Stack ({selectedSymptoms.length})</h3>
                {selectedSymptoms.length === 0 ? (
                  <p className="text-sm text-cultr-textMuted italic">No symptoms selected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map((symptom) => (
                      <span key={symptom.id} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cultr-forest/10 text-cultr-forest text-sm">
                        {symptom.symptom}
                        <button onClick={() => removeSymptom(symptom.id)} className="hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          {resultMessage && (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-start gap-3">
              <Activity className="h-5 w-5 shrink-0" />
              <p className="text-sm">{resultMessage}</p>
            </div>
          )}

          <Button 
            onClick={handleSubmit} 
            isLoading={isSubmitting} 
            className="w-full py-4 text-base shadow-lg hover:shadow-xl transition-all"
          >
            Generate & Push to Healthie
          </Button>
        </div>

        {/* Right Column: Preview */}
        <div className="bg-white rounded-2xl shadow-sm border border-cultr-sage/20 overflow-hidden flex flex-col h-[calc(100vh-10rem)] sticky top-28">
          <div className="bg-cultr-offwhite px-6 py-4 border-b border-cultr-sage/10">
            <h2 className="font-display font-bold text-lg text-cultr-text flex items-center gap-2">
              <FileText className="h-5 w-5 text-cultr-forest" />
              Protocol Preview
            </h2>
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            {mode === 'template' && templatePreview ? (
              <>
                <div>
                  <h3 className="text-xl font-bold text-cultr-forest mb-2">{templatePreview.name}</h3>
                  <p className="text-cultr-textMuted text-sm">{templatePreview.summary}</p>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wide text-cultr-text/60">Phases</h4>
                  {templatePreview.phases.map((phase) => (
                    <div key={phase.name} className="pl-4 border-l-2 border-cultr-sage/30">
                      <p className="font-bold text-cultr-text">{phase.name} <span className="text-xs font-normal text-cultr-textMuted ml-2">Weeks {phase.weekStart}-{phase.weekEnd}</span></p>
                      <p className="text-sm text-cultr-text mt-1">{phase.instructions}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-sm uppercase tracking-wide text-cultr-text/60">Monitoring</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {templatePreview.monitoringSchedule.map((item) => (
                      <div key={item.label} className="bg-cultr-offwhite p-3 rounded-lg">
                        <p className="text-xs text-cultr-textMuted font-medium">{item.label}</p>
                        <p className="text-sm font-bold text-cultr-text">{item.cadence}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {template?.synergisticPeptides && template.synergisticPeptides.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wide text-cultr-text/60 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      Template Synergistic Peptides
                    </h4>
                    <div className="space-y-3">
                      {template.synergisticPeptides.map((peptide) => (
                        <div 
                          key={peptide.name} 
                          className={`bg-gradient-to-r p-4 rounded-xl border ${
                            peptide.priority === 'primary' 
                              ? 'from-purple-50 to-white border-purple-200' 
                              : peptide.priority === 'secondary'
                              ? 'from-blue-50 to-white border-blue-200'
                              : 'from-gray-50 to-white border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-cultr-text">{peptide.name}</p>
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                peptide.priority === 'primary' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : peptide.priority === 'secondary'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {peptide.priority === 'primary' && <Star className="h-2.5 w-2.5" />}
                                {peptide.priority === 'secondary' && <Circle className="h-2.5 w-2.5" />}
                                {peptide.priority}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-cultr-forest font-medium mb-2">{peptide.purpose}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-cultr-textMuted">
                            <span className="bg-white/80 px-2 py-1 rounded border border-cultr-sage/20">
                              <strong>Dose:</strong> {peptide.dosageRange}
                            </span>
                            <span className="bg-white/80 px-2 py-1 rounded border border-cultr-sage/20">
                              <strong>Timing:</strong> {peptide.timing}
                            </span>
                          </div>
                          {peptide.notes && (
                            <p className="text-xs text-cultr-textMuted mt-2 italic">"{peptide.notes}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goal-Based Peptide Recommendations from Full Catalog */}
                {goalRecommendations && goalRecommendations.recommendations.length > 0 && (
                  <div className="space-y-4 border-t border-cultr-sage/20 pt-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm uppercase tracking-wide text-cultr-text/60 flex items-center gap-2">
                        <Target className="h-4 w-4 text-emerald-600" />
                        Goal-Based Catalog Recommendations
                      </h4>
                      <button 
                        onClick={() => setShowGoalPeptides(!showGoalPeptides)}
                        className="text-xs text-cultr-forest hover:text-cultr-forestDark flex items-center gap-1"
                      >
                        {showGoalPeptides ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {showGoalPeptides ? 'Collapse' : 'Expand'}
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {goalRecommendations.goals.map(g => (
                        <span key={g.id} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          {g.icon} {g.name}
                        </span>
                      ))}
                    </div>

                    {showGoalPeptides && (
                      <div className="space-y-3">
                        {goalRecommendations.recommendations.slice(0, 12).map((peptide) => (
                          <div 
                            key={peptide.id} 
                            className="bg-gradient-to-r from-emerald-50 to-white border border-emerald-200 rounded-xl overflow-hidden"
                          >
                            <button
                              onClick={() => setExpandedPeptide(expandedPeptide === peptide.id ? null : peptide.id)}
                              className="w-full p-4 text-left"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-cultr-text">{peptide.name}</p>
                                    {peptide.matchCount > 1 && (
                                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                                        {peptide.matchCount} goals
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                      peptide.evidenceGrade.startsWith('A') || peptide.evidenceGrade.startsWith('B') 
                                        ? 'bg-green-100 text-green-700' 
                                        : peptide.evidenceGrade.startsWith('C')
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      <FlaskConical className="h-2.5 w-2.5 inline mr-1" />
                                      {peptide.evidenceGrade}
                                    </span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                      peptide.riskTier === 'low' 
                                        ? 'bg-green-100 text-green-700' 
                                        : peptide.riskTier === 'low-moderate'
                                        ? 'bg-blue-100 text-blue-700'
                                        : peptide.riskTier === 'moderate'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                    }`}>
                                      <Shield className="h-2.5 w-2.5 inline mr-1" />
                                      {peptide.riskTier}
                                    </span>
                                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                      <DollarSign className="h-2.5 w-2.5 inline" />{peptide.price}
                                    </span>
                                  </div>
                                </div>
                                {expandedPeptide === peptide.id ? (
                                  <ChevronUp className="h-5 w-5 text-cultr-textMuted" />
                                ) : (
                                  <ChevronDown className="h-5 w-5 text-cultr-textMuted" />
                                )}
                              </div>
                            </button>
                            
                            {expandedPeptide === peptide.id && (
                              <div className="px-4 pb-4 space-y-3 border-t border-emerald-100">
                                <p className="text-sm text-cultr-text mt-3">{peptide.mechanism}</p>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="bg-white/80 p-2 rounded border border-cultr-sage/20">
                                    <p className="text-[10px] text-cultr-textMuted uppercase font-bold">Dose</p>
                                    <p className="text-xs text-cultr-text">{peptide.dosageRange}</p>
                                  </div>
                                  <div className="bg-white/80 p-2 rounded border border-cultr-sage/20">
                                    <p className="text-[10px] text-cultr-textMuted uppercase font-bold">Timing</p>
                                    <p className="text-xs text-cultr-text">{peptide.timing}</p>
                                  </div>
                                  <div className="bg-white/80 p-2 rounded border border-cultr-sage/20">
                                    <p className="text-[10px] text-cultr-textMuted uppercase font-bold">Route</p>
                                    <p className="text-xs text-cultr-text">{peptide.route}</p>
                                  </div>
                                  <div className="bg-white/80 p-2 rounded border border-cultr-sage/20">
                                    <p className="text-[10px] text-cultr-textMuted uppercase font-bold">Duration</p>
                                    <p className="text-xs text-cultr-text">{peptide.duration}</p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[10px] text-cultr-textMuted uppercase font-bold mb-1">Best For</p>
                                  <div className="flex flex-wrap gap-1">
                                    {peptide.bestFor.map((b, i) => (
                                      <span key={i} className="text-[10px] bg-cultr-sage/20 text-cultr-text px-2 py-0.5 rounded">
                                        {b}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <p className="text-[10px] text-cultr-textMuted uppercase font-bold mb-1">Matched Goals</p>
                                  <div className="flex flex-wrap gap-1">
                                    {peptide.matchedGoals.map((gId) => {
                                      const g = PEPTIDE_GOALS.find(pg => pg.id === gId)
                                      return g ? (
                                        <span key={gId} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                                          {g.icon} {g.name}
                                        </span>
                                      ) : null
                                    })}
                                  </div>
                                </div>

                                {peptide.synergyWith.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-cultr-textMuted uppercase font-bold mb-1">Synergizes With</p>
                                    <p className="text-xs text-cultr-text">{peptide.synergyWith.join(', ')}</p>
                                  </div>
                                )}

                                {peptide.contraindications.length > 0 && (
                                  <div className="bg-amber-50 p-2 rounded border border-amber-100">
                                    <p className="text-[10px] text-amber-800 uppercase font-bold mb-1">⚠️ Contraindications</p>
                                    <ul className="text-xs text-amber-700 space-y-0.5">
                                      {peptide.contraindications.map((c, i) => (
                                        <li key={i}>• {c}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {peptide.notes && (
                                  <p className="text-xs text-cultr-textMuted italic">Note: {peptide.notes}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {goalRecommendations.recommendations.length > 12 && (
                          <p className="text-xs text-center text-cultr-textMuted">
                            +{goalRecommendations.recommendations.length - 12} more peptides match your selected goals
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-cultr-textMuted bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                      <strong>Note:</strong> Peptides are ranked by goal match count, evidence grade, and risk profile. Always verify contraindications and consider patient-specific factors.
                    </p>
                  </div>
                )}

                {!template?.synergisticPeptides?.length && !goalRecommendations && (
                  <p className="text-xs text-cultr-textMuted bg-amber-50 border border-amber-100 p-3 rounded-lg">
                    <strong>Tip:</strong> Select patient goals above to see synergistic peptide recommendations from the full catalog.
                  </p>
                )}
              </>
            ) : mode === 'symptom' && combinedProtocol ? (
              <>
                <div>
                  <h3 className="text-xl font-bold text-cultr-forest mb-2">Custom Symptom Stack</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {combinedProtocol.symptoms.map(s => (
                      <span key={s} className="text-xs bg-cultr-sage/20 text-cultr-text px-2 py-1 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-sm uppercase tracking-wide text-cultr-text/60 mb-3 flex items-center gap-2">
                      <Pill className="h-4 w-4" /> Recommended Interventions
                    </h4>
                    <div className="space-y-3">
                      {combinedProtocol.interventions.map((item) => (
                        <div key={item.name} className="bg-cultr-offwhite border border-cultr-sage/10 p-4 rounded-xl">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-cultr-text">{item.name}</p>
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                item.type === 'peptide' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {item.type}
                              </span>
                            </div>
                            {item.frequency > 1 && (
                              <span className="text-xs bg-cultr-forest text-white px-2 py-1 rounded-full font-medium" title="Targeting multiple symptoms">
                                {item.frequency}x Match
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2 mt-3">
                            {item.details.map((detail, idx) => (
                              <div key={idx} className="text-sm border-l-2 border-cultr-sage/20 pl-3">
                                <div className="flex gap-4 text-xs text-cultr-textMuted mb-0.5">
                                  <span>{detail.dosageRange}</span>
                                  <span>•</span>
                                  <span>{detail.timing}</span>
                                </div>
                                {detail.notes && <p className="text-cultr-text text-sm italic">"{detail.notes}"</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {combinedProtocol.monitoring.length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide text-cultr-text/60 mb-3">Monitoring Plan</h4>
                      <ul className="grid grid-cols-1 gap-2">
                        {combinedProtocol.monitoring.map((m) => (
                          <li key={m} className="text-sm text-cultr-text flex items-start gap-2">
                            <span className="text-cultr-forest mt-1.5 h-1.5 w-1.5 rounded-full bg-cultr-forest shrink-0" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {combinedProtocol.contraindications.length > 0 && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <h4 className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> Contraindications & Warnings
                      </h4>
                      <ul className="space-y-1">
                        {combinedProtocol.contraindications.map((c) => (
                          <li key={c} className="text-sm text-amber-700">• {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-cultr-textMuted">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>Select {mode === 'template' ? 'a template' : 'symptoms'} to generate preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
