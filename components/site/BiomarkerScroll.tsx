'use client';

import Image from 'next/image';

/**
 * Vertical auto-scrolling biomarker card list + EasyDraw blood test section.
 * Replicates SiPhox programs page animation style.
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
    <div className="flex items-center justify-between px-5 py-4 border-b border-brand-secondary/8 last:border-b-0">
      <div className="min-w-0 mr-4">
        <p className="text-sm font-semibold text-brand-primary">{name}</p>
        <p className="text-xs text-brand-secondary/50">{desc}</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
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
  // Duplicate for seamless infinite vertical scroll
  const cards = [...BIOMARKER_DATA, ...BIOMARKER_DATA];

  return (
    <section className="py-12 md:py-16 bg-brand-cream">
      <div className="max-w-4xl mx-auto text-center px-6 mb-8">
        <p className="text-[10px] md:text-xs uppercase tracking-widest text-brand-secondary/50 font-semibold mb-2">
          SiPhox EasyDraw Core
        </p>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-primary mb-3">
          Preventing chronic disease starts with{' '}
          <strong>tracking &amp; understanding your biomarkers.</strong>
        </h2>
        <p className="text-sm text-brand-secondary/60 max-w-xl mx-auto">
          33 biomarkers tested at home — heart, metabolic, hormonal, nutritional, inflammation, and thyroid health. Upgradable to 59+.
        </p>
      </div>

      {/* Vertical auto-scroll container */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="relative rounded-2xl bg-white border border-brand-secondary/10 shadow-sm overflow-hidden" style={{ height: '420px' }}>
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />

          {/* Scrolling track */}
          <div className="animate-marquee-up">
            {cards.map((b, i) => (
              <BiomarkerCard key={i} name={b.name} desc={b.desc} value={b.value} status={b.status as Status} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── Connector line ─── */}
      <div className="flex justify-center py-6">
        <div className="w-px h-16 bg-brand-secondary/15" />
      </div>

      {/* ─── EasyDraw Blood Test Section ─── */}
      <div className="max-w-4xl mx-auto text-center px-6 mb-8">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-primary mb-2">
          Test comprehensive panels{' '}
          <strong>painlessly from home.</strong>
        </h2>
      </div>

      <div className="max-w-3xl mx-auto px-6">
        <div className="relative rounded-2xl overflow-hidden aspect-[4/3] md:aspect-[16/9]">
          {/* Lifestyle background image */}
          <Image
            src="/images/easydraw-lifestyle.jpg"
            alt="Woman using SiPhox EasyDraw at-home blood test"
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, 768px"
          />

          {/* EasyDraw device overlay — centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[120px] h-[200px] md:w-[160px] md:h-[280px]">
              {/* Full device (with blood sample) */}
              <Image
                src="/images/easydraw-full.png"
                alt="SiPhox EasyDraw device"
                fill
                className="object-contain drop-shadow-2xl"
                sizes="160px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
