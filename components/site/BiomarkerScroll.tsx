'use client';

/**
 * Auto-scrolling biomarker card animation — inspired by SiPhox EasyDraw Core.
 * Infinite horizontal marquee of biomarker result cards with colored status dots.
 */

const BIOMARKER_DATA = [
  { name: 'LDL Cholesterol', desc: '"Bad" cholesterol', value: '102 mg/dL', status: 'normal' },
  { name: 'APOB', desc: '"Bad" cholesterol indicator', value: '126 mg/dL', status: 'critical' },
  { name: 'HDL Cholesterol', desc: '"Good" cholesterol', value: '60 mg/dL', status: 'normal' },
  { name: 'Triglycerides', desc: 'Cardiometabolic health indicator', value: '65 mg/dL', status: 'optimal' },
  { name: 'Testosterone (Total)', desc: 'Sex hormone', value: '550 ng/dL', status: 'normal' },
  { name: '% Hemoglobin A1C', desc: 'Long-term blood sugar check', value: '5.1%', status: 'normal' },
  { name: 'Glucose', desc: 'Blood sugar indicator', value: '76 mg/dL', status: 'normal' },
  { name: 'High-Sensitivity CRP', desc: 'Inflammation indicator', value: '1.5 mg/L', status: 'normal' },
  { name: 'Lipoprotein (a)', desc: 'Cardiovascular risk indicator', value: '<5.44 mg/dL', status: 'normal' },
  { name: '25-(OH) Vitamin D', desc: 'Bone and immune health vitamin', value: '45.75 ng/mL', status: 'optimal' },
  { name: 'Free T3', desc: 'Active thyroid hormone', value: '3.3 pg/mL', status: 'optimal' },
  { name: 'Free T4', desc: 'Active thyroid hormone', value: '1.2 ng/dL', status: 'optimal' },
  { name: 'TSH', desc: 'Metabolism regulator', value: '1.92 uIU/mL', status: 'optimal' },
  { name: 'ApoB:ApoA1 Ratio', desc: 'Cardiovascular risk indicator', value: '0.88', status: 'normal' },
  { name: 'Triglycerides:HDL', desc: 'Insulin resistance indicator', value: '1.08', status: 'optimal' },
  { name: 'Morning Cortisol', desc: 'Stress response indicator', value: '5.5 ug/dL', status: 'critical' },
  { name: 'Estradiol (Sensitive)', desc: 'Sex hormone', value: '144.6 pg/mL', status: 'normal' },
  { name: 'FSH', desc: 'Sex hormone regulator', value: '17 mIU/mL', status: 'normal' },
  { name: 'DHEA-S', desc: 'Adrenal hormone precursor', value: '285 ug/dL', status: 'normal' },
  { name: 'Testosterone, Free (calc)', desc: 'Bioavailable sex hormone', value: '12.5 pg/mL', status: 'optimal' },
  { name: 'Ferritin', desc: 'Iron storage indicator', value: '55.3 ng/mL', status: 'optimal' },
  { name: 'Albumin', desc: 'Liver function indicator', value: '4.76 g/dL', status: 'optimal' },
  { name: 'SHBG', desc: 'Hormone transport protein', value: '55 nmol/L', status: 'normal' },
  { name: 'Total Cholesterol', desc: '"Good" + "bad" cholesterol', value: '175 mg/dL', status: 'optimal' },
  { name: 'APOA1', desc: '"Good" cholesterol indicator', value: '142 mg/dL', status: 'optimal' },
  { name: 'Creatinine', desc: 'Kidney function indicator', value: '0.68 mg/dL', status: 'critical' },
  { name: 'ALT', desc: 'Indicator of liver health', value: '37 U/L', status: 'attention' },
  { name: 'AST', desc: 'Liver injury indicator', value: '44 U/L', status: 'critical' },
  { name: 'eGFR', desc: 'Kidney function indicator', value: '105 mL/min/1.73 m²', status: 'optimal' },
  { name: 'Homocysteine (HCY)', desc: 'Cardiovascular risk indicator', value: '11.06 umol/L', status: 'critical' },
] as const;

type Status = 'optimal' | 'normal' | 'attention' | 'critical';

const STATUS_COLORS: Record<Status, string> = {
  optimal: '#52c41a',   // green
  normal: '#1677ff',    // blue
  attention: '#fa8c16', // orange
  critical: '#f5222d',  // red
};

function BiomarkerCard({ name, desc, value, status }: { name: string; desc: string; value: string; status: Status }) {
  return (
    <div className="flex items-center justify-between min-w-[320px] md:min-w-[360px] px-5 py-4 bg-white rounded-xl border border-brand-secondary/10 shrink-0">
      <div className="min-w-0 mr-4">
        <p className="text-sm font-semibold text-brand-primary truncate">{name}</p>
        <p className="text-xs text-brand-secondary/50 truncate">{desc}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-medium text-brand-primary tabular-nums">{value}</span>
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: STATUS_COLORS[status] }}
        />
      </div>
    </div>
  );
}

export default function BiomarkerScroll() {
  // Duplicate data for seamless infinite scroll
  const cards = [...BIOMARKER_DATA, ...BIOMARKER_DATA];

  return (
    <section className="py-12 md:py-16 overflow-hidden bg-brand-cream">
      <div className="max-w-4xl mx-auto text-center px-6 mb-8">
        <p className="text-[10px] md:text-xs uppercase tracking-widest text-brand-secondary/50 font-semibold mb-2">
          SiPhox EasyDraw Core
        </p>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-primary mb-3">
          Preventing chronic disease starts with{' '}
          <span className="text-brand-primary">tracking &amp; understanding your biomarkers.</span>
        </h2>
        <p className="text-sm text-brand-secondary/60 max-w-xl mx-auto">
          33 biomarkers tested at home — heart, metabolic, hormonal, nutritional, inflammation, and thyroid health. Upgradable to 59+.
        </p>
      </div>

      {/* Auto-scrolling marquee — two rows scrolling in opposite directions */}
      <div className="space-y-3">
        {/* Row 1 — scrolls left */}
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-brand-cream to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-brand-cream to-transparent z-10 pointer-events-none" />
          <div className="flex gap-3 animate-marquee-left">
            {cards.slice(0, 30).map((b, i) => (
              <BiomarkerCard key={`r1-${i}`} name={b.name} desc={b.desc} value={b.value} status={b.status as Status} />
            ))}
          </div>
        </div>

        {/* Row 2 — scrolls right */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-brand-cream to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-brand-cream to-transparent z-10 pointer-events-none" />
          <div className="flex gap-3 animate-marquee-right">
            {cards.slice(15, 45).map((b, i) => (
              <BiomarkerCard key={`r2-${i}`} name={b.name} desc={b.desc} value={b.value} status={b.status as Status} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
