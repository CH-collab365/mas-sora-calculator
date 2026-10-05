import React, { useState, useMemo } from 'react';
import {
  LoanInputState,
  PropertyType,
  SoraTenor,
  CompoundingMethod,
  SoraRateRecord,
} from '../types/sora';
import {
  generateAmortizationSchedule,
  formatSgd,
  formatPercent,
  exportAmortizationCsv,
  MAS_STRESS_RATE_PERCENT,
  calculateMonthlyPayment,
} from '../utils/soraMath';
import { AmortizationTable } from './AmortizationTable';
import {
  Percent,
  DollarSign,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Layers,
} from 'lucide-react';

interface LoanCalculatorProps {
  latestSoraRecord: SoraRateRecord;
  onNavigateToStress: () => void;
  onNavigateToInspector: () => void;
}

export const LoanCalculator: React.FC<LoanCalculatorProps> = ({
  latestSoraRecord,
  onNavigateToStress,
  onNavigateToInspector,
}) => {
  // Default Singapore mortgage baseline: S$800,000, 25 years, 3M SORA
  const [params, setParams] = useState<LoanInputState>({
    loanAmount: 800000,
    tenorYears: 25,
    tenorMonths: 0,
    propertyType: 'private_residential',
    soraTenor: '3M',
    compoundingMethod: 'in_advance',
    isTieredSpread: false,
    flatSpread: 0.65, // Standard bank spread in Singapore (e.g. SORA + 0.65%)
    tieredSpread: {
      year1: 0.60,
      year2: 0.60,
      year3: 0.75,
      thereafter: 0.85,
    },
    customSoraRate: null,
  });

  const [activeRateScenario, setActiveRateScenario] = useState<'base' | 'minus50' | 'plus50' | 'plus100' | 'stress'>('base');
  const [showAdvancedSpread, setShowAdvancedSpread] = useState(false);

  // Determine active base SORA rate based on chosen tenor
  const baseSoraBenchmark = useMemo(() => {
    switch (params.soraTenor) {
      case '1M':
        return latestSoraRecord.compounded1M;
      case '3M':
        return latestSoraRecord.compounded3M;
      case '6M':
        return latestSoraRecord.compounded6M;
      case 'overnight':
        return latestSoraRecord.overnightRate;
      default:
        return latestSoraRecord.compounded3M;
    }
  }, [params.soraTenor, latestSoraRecord]);

  // Handle Scenario Toggles
  const effectiveBaseSora = useMemo(() => {
    if (params.customSoraRate !== null) {
      return params.customSoraRate;
    }
    switch (activeRateScenario) {
      case 'minus50':
        return Math.max(0.1, baseSoraBenchmark - 0.5);
      case 'plus50':
        return baseSoraBenchmark + 0.5;
      case 'plus100':
        return baseSoraBenchmark + 1.0;
      case 'stress':
        // MAS stress floor is 4.0% all-in rate, so base = 4.0 - spread
        return Math.max(0.1, MAS_STRESS_RATE_PERCENT - params.flatSpread);
      default:
        return baseSoraBenchmark;
    }
  }, [params.customSoraRate, activeRateScenario, baseSoraBenchmark, params.flatSpread]);

  // Compute Full Loan Calculation Summary
  const summary = useMemo(() => {
    return generateAmortizationSchedule(params, effectiveBaseSora);
  }, [params, effectiveBaseSora]);

  // Quick Loan Presets
  const loanPresets = [
    { label: 'S$500K', value: 500000 },
    { label: 'S$800K', value: 800000 },
    { label: 'S$1.2M', value: 1200000 },
    { label: 'S$1.8M', value: 1800000 },
    { label: 'S$2.5M', value: 2500000 },
  ];

  // Maximum allowed tenor based on Singapore MAS rules
  const maxTenorYears = params.propertyType === 'hdb' ? 30 : 35;

  const handlePropertyTypeChange = (type: PropertyType) => {
    const newMaxTenor = type === 'hdb' ? 30 : 35;
    setParams((prev) => ({
      ...prev,
      propertyType: type,
      tenorYears: Math.min(prev.tenorYears, newMaxTenor),
    }));
  };

  const handleExportCsv = () => {
    const csvContent = exportAmortizationCsv(summary.amortizationSchedule);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SORA_Loan_Schedule_${params.loanAmount}_SGD.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sensitivity Analysis Table
  const sensitivityRows = useMemo(() => {
    const totalMonths = params.tenorYears * 12 + params.tenorMonths;
    const testShifts = [
      { label: '-1.00% (Rapid Easing)', shift: -1.0, isStress: false },
      { label: '-0.50% (Moderate Cut)', shift: -0.5, isStress: false },
      { label: 'Current Base SORA', shift: 0.0, isStress: false },
      { label: '+0.50% (Mild Hike)', shift: 0.5, isStress: false },
      { label: '+1.00% (High Inflation)', shift: 1.0, isStress: false },
      { label: 'MAS 4.00% Stress Floor', shift: 0.0, isStress: true },
    ];

    return testShifts.map((s) => {
      const allInRate = s.isStress
        ? 4.0
        : Math.max(0.1, baseSoraBenchmark + params.flatSpread + s.shift);
      const payment = calculateMonthlyPayment(params.loanAmount, allInRate, totalMonths);
      const diff = payment - summary.monthlyPayment;
      return {
        label: s.label,
        allInRate,
        payment,
        diff,
      };
    });
  }, [params.loanAmount, params.tenorYears, params.tenorMonths, baseSoraBenchmark, params.flatSpread, summary.monthlyPayment]);

  // First month breakdown
  const firstMonthPrincipal = summary.amortizationSchedule[0]?.principalPaid || 0;
  const firstMonthInterest = summary.amortizationSchedule[0]?.interestPaid || 0;
  const principalRatio = summary.totalPayments > 0 ? (summary.totalPrincipal / summary.totalPayments) * 100 : 0;
  const interestRatio = summary.totalPayments > 0 ? (summary.totalInterest / summary.totalPayments) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Layout: Inputs on Left, Executive Outputs on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Loan Input Parameters (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-teal-800" />
                  <span>Loan Configuration & Rate Terms</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure mortgage principal, MAS SORA benchmark tenor, and bank margins.
                </p>
              </div>

              <button
                onClick={() => {
                  setParams({
                    loanAmount: 800000,
                    tenorYears: 25,
                    tenorMonths: 0,
                    propertyType: 'private_residential',
                    soraTenor: '3M',
                    compoundingMethod: 'in_advance',
                    isTieredSpread: false,
                    flatSpread: 0.65,
                    tieredSpread: { year1: 0.60, year2: 0.60, year3: 0.75, thereafter: 0.85 },
                    customSoraRate: null,
                  });
                  setActiveRateScenario('base');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                title="Reset to default settings"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Input Form Controls */}
            <div className="mt-5 space-y-4">
              {/* Property Classification */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>Property Type</span>
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { id: 'hdb', label: 'HDB / EC', limit: 'Max 30 Yrs · MSR' },
                    { id: 'private_residential', label: 'Private Condo', limit: 'Max 35 Yrs · TDSR' },
                    { id: 'commercial', label: 'Commercial', limit: 'Max 30 Yrs' },
                  ].map((prop) => (
                    <button
                      key={prop.id}
                      type="button"
                      onClick={() => handlePropertyTypeChange(prop.id as PropertyType)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        params.propertyType === prop.id
                          ? 'border-teal-700 bg-teal-50/40 text-teal-950 font-semibold ring-1 ring-teal-700/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="font-medium">{prop.label}</div>
                      <div className="text-3xs text-slate-400 mt-0.5">{prop.limit}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loan Amount Input + Quick Preset Pills */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800">
                    Loan Principal (SGD)
                  </label>
                  <span className="text-xs font-mono font-bold text-teal-900">
                    {formatSgd(params.loanAmount)}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-semibold">
                    S$
                  </span>
                  <input
                    type="number"
                    min={50000}
                    max={10000000}
                    step={10000}
                    value={params.loanAmount}
                    onChange={(e) =>
                      setParams({ ...params, loanAmount: Math.max(0, parseFloat(e.target.value) || 0) })
                    }
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tabular-nums font-semibold border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700 focus:border-teal-700 transition-all"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none">
                  {loanPresets.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setParams({ ...params, loanAmount: preset.value })}
                      className={`px-2.5 py-1 text-2xs font-mono font-medium rounded-md border transition-colors whitespace-nowrap ${
                        params.loanAmount === preset.value
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  aria-label="Loan Principal range slider"
                  min={100000}
                  max={3000000}
                  step={25000}
                  value={params.loanAmount}
                  onChange={(e) => setParams({ ...params, loanAmount: parseFloat(e.target.value) })}
                  className="w-full accent-teal-800 mt-2 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Tenor Inputs */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800">
                    Loan Tenor (MAS Max: {maxTenorYears} Years)
                  </label>
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    {params.tenorYears} Years {params.tenorMonths > 0 ? `· ${params.tenorMonths} Mos` : ''} ({params.tenorYears * 12 + params.tenorMonths} months total)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-3xs text-slate-500 mb-0.5 block">Years (1 - {maxTenorYears})</label>
                    <input
                      type="number"
                      min={1}
                      max={maxTenorYears}
                      value={params.tenorYears}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          tenorYears: Math.min(maxTenorYears, Math.max(1, parseInt(e.target.value) || 1)),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                    />
                  </div>
                  <div>
                    <label className="text-3xs text-slate-500 mb-0.5 block">Additional Months (0 - 11)</label>
                    <input
                      type="number"
                      min={0}
                      max={11}
                      value={params.tenorMonths}
                      onChange={(e) =>
                        setParams({
                          ...params,
                          tenorMonths: Math.min(11, Math.max(0, parseInt(e.target.value) || 0)),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                    />
                  </div>
                </div>

                <input
                  type="range"
                  aria-label="Loan Tenor range slider in years"
                  min={5}
                  max={maxTenorYears}
                  value={params.tenorYears}
                  onChange={(e) => setParams({ ...params, tenorYears: parseInt(e.target.value) })}
                  className="w-full accent-teal-800 mt-2 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* SORA Benchmark Tenor Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-slate-500" />
                    <span>MAS SORA Benchmark Tenor</span>
                  </label>
                  <button
                    type="button"
                    onClick={onNavigateToInspector}
                    className="text-2xs text-teal-800 hover:text-teal-950 font-medium underline"
                  >
                    View MAS Formula
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { id: '1M', label: '1M SORA', rate: latestSoraRecord.compounded1M, desc: 'Monthly reset' },
                    { id: '3M', label: '3M SORA', rate: latestSoraRecord.compounded3M, desc: 'SG Standard', popular: true },
                    { id: '6M', label: '6M SORA', rate: latestSoraRecord.compounded6M, desc: 'Bi-annual' },
                    { id: 'overnight', label: 'Daily SORA', rate: latestSoraRecord.overnightRate, desc: 'Daily rate' },
                  ].map((tenor) => (
                    <button
                      key={tenor.id}
                      type="button"
                      onClick={() => setParams({ ...params, soraTenor: tenor.id as SoraTenor })}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        params.soraTenor === tenor.id
                          ? 'border-teal-700 bg-teal-50/50 text-teal-950 ring-1 ring-teal-700/20'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs">{tenor.label}</span>
                        {tenor.popular && (
                          <span className="text-3xs bg-teal-800 text-white px-1 rounded font-mono">
                            STD
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-900 mt-1">
                        {formatPercent(tenor.rate, 3)}
                      </div>
                      <div className="text-3xs text-slate-400 mt-0.5">{tenor.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compounding Convention: Advance vs Arrears */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Compounding Mode
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setParams({ ...params, compoundingMethod: 'in_advance' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      params.compoundingMethod === 'in_advance'
                        ? 'border-teal-700 bg-teal-50/40 text-teal-950 font-semibold ring-1 ring-teal-700/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-medium">Compounded in Advance</div>
                    <div className="text-3xs text-slate-500 mt-0.5">
                      Uses MAS published benchmark on reset date (Retail norm)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParams({ ...params, compoundingMethod: 'in_arrears' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      params.compoundingMethod === 'in_arrears'
                        ? 'border-teal-700 bg-teal-50/40 text-teal-950 font-semibold ring-1 ring-teal-700/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div className="font-medium">Compounded in Arrears</div>
                    <div className="text-3xs text-slate-500 mt-0.5">
                      Calculated from daily overnight observations + 5-day lag
                    </div>
                  </button>
                </div>
              </div>

              {/* Bank Margin / Spread Configuration */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-slate-900 block">
                      Bank Margin / Spread (% p.a.)
                    </label>
                    <span className="text-3xs text-slate-500">
                      Added on top of MAS SORA base benchmark
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedSpread(!showAdvancedSpread)}
                    className="text-2xs font-medium text-teal-800 hover:text-teal-950 flex items-center gap-1"
                  >
                    <span>{showAdvancedSpread ? 'Simple Spread' : 'Tiered Promo Spreads'}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        showAdvancedSpread ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {!showAdvancedSpread ? (
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.05"
                        min={0}
                        max={5}
                        value={params.flatSpread}
                        onChange={(e) =>
                          setParams({ ...params, flatSpread: parseFloat(e.target.value) || 0, isTieredSpread: false })
                        }
                        className="w-full px-3 py-1.5 text-xs font-mono tabular-nums font-semibold border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                        % p.a.
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[0.55, 0.65, 0.75, 0.85].map((spread) => (
                        <button
                          key={spread}
                          type="button"
                          onClick={() => setParams({ ...params, flatSpread: spread, isTieredSpread: false })}
                          className={`px-2 py-1 text-2xs font-mono rounded border ${
                            params.flatSpread === spread && !params.isTieredSpread
                              ? 'bg-teal-800 text-white border-teal-800'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          +{spread}%
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-3xs text-slate-500 block mb-0.5">Year 1 Spread</label>
                        <input
                          type="number"
                          step="0.05"
                          value={params.tieredSpread.year1}
                          onChange={(e) =>
                            setParams({
                              ...params,
                              isTieredSpread: true,
                              tieredSpread: { ...params.tieredSpread, year1: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-3xs text-slate-500 block mb-0.5">Year 2 Spread</label>
                        <input
                          type="number"
                          step="0.05"
                          value={params.tieredSpread.year2}
                          onChange={(e) =>
                            setParams({
                              ...params,
                              isTieredSpread: true,
                              tieredSpread: { ...params.tieredSpread, year2: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-3xs text-slate-500 block mb-0.5">Year 3 Spread</label>
                        <input
                          type="number"
                          step="0.05"
                          value={params.tieredSpread.year3}
                          onChange={(e) =>
                            setParams({
                              ...params,
                              isTieredSpread: true,
                              tieredSpread: { ...params.tieredSpread, year3: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-3xs text-slate-500 block mb-0.5">Thereafter</label>
                        <input
                          type="number"
                          step="0.05"
                          value={params.tieredSpread.thereafter}
                          onChange={(e) =>
                            setParams({
                              ...params,
                              isTieredSpread: true,
                              tieredSpread: { ...params.tieredSpread, thereafter: parseFloat(e.target.value) || 0 },
                            })
                          }
                          className="w-full px-2 py-1 text-xs font-mono border border-slate-200 rounded bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Stress & Scenario Shock Simulation Toggles */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Interest Rate Scenario Simulator</span>
                  <span className="text-3xs text-slate-500">Quick stress assessment</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                  {[
                    { id: 'base', label: 'Baseline', sub: `${formatPercent(baseSoraBenchmark, 2)} SORA` },
                    { id: 'minus50', label: '-0.50%', sub: 'Rate Cut' },
                    { id: 'plus50', label: '+0.50%', sub: 'Mild Hike' },
                    { id: 'plus100', label: '+1.00%', sub: 'Tightening' },
                    { id: 'stress', label: 'MAS 4.0%', sub: 'Notice 645', alert: true },
                  ].map((scen) => (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => {
                        setActiveRateScenario(scen.id as typeof activeRateScenario);
                        setParams({ ...params, customSoraRate: null });
                      }}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        activeRateScenario === scen.id && params.customSoraRate === null
                          ? scen.alert
                            ? 'bg-rose-900 text-white border-rose-900 font-semibold shadow-xs'
                            : 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-semibold text-xs">{scen.label}</div>
                      <div className="text-3xs opacity-80 mt-0.5">{scen.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Executive Key Results & Metrics (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Key Metric Card */}
          <div className="bg-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <DollarSign className="w-48 h-48" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="font-semibold uppercase tracking-wider text-teal-400">
                  Estimated Monthly Servicing
                </span>
                <span className="font-mono tabular-nums">
                  {summary.amortizationSchedule.length} Payments Total
                </span>
              </div>

              {/* Monthly Repayment Hero Number */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums text-white">
                  {formatSgd(summary.monthlyPayment, true)}
                </span>
                <span className="text-slate-400 text-xs font-normal">/ month</span>
              </div>

              {/* First Month Payment Breakdown Bar */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
                    <span>Principal: {formatSgd(firstMonthPrincipal, true)}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>Interest: {formatSgd(firstMonthInterest, true)}</span>
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-teal-400 transition-all duration-300"
                    style={{
                      width: `${(firstMonthPrincipal / summary.monthlyPayment) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{
                      width: `${(firstMonthInterest / summary.monthlyPayment) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* All-in Rate Formula Breakdown */}
              <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <div className="text-slate-400 text-3xs font-medium uppercase tracking-wider">
                    Applicable All-in Rate
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {formatPercent(summary.applicableRate, 3)} p.a.
                  </div>
                </div>
                <div className="text-right text-3xs font-mono text-slate-300">
                  <div>Base SORA: {formatPercent(summary.baseSoraRate, 4)}</div>
                  <div className="text-teal-300">+ Bank Spread: {formatPercent(summary.spread, 2)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Metric Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Total Interest Payable</div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-800 mt-1">
                {formatSgd(summary.totalInterest)}
              </div>
              <div className="text-2xs text-slate-400 mt-0.5">
                {interestRatio.toFixed(1)}% of total payments
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Total Capital Repaid</div>
              <div className="text-xl font-bold font-mono tabular-nums text-teal-800 mt-1">
                {formatSgd(summary.totalPrincipal)}
              </div>
              <div className="text-2xs text-slate-400 mt-0.5">
                {principalRatio.toFixed(1)}% of total payments
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Gross Outlay (P + I)</div>
              <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {formatSgd(summary.totalPayments)}
              </div>
              <div className="text-2xs text-slate-400 mt-0.5">Over full {params.tenorYears} yrs</div>
            </div>
          </div>

          {/* Rate Sensitivity Matrix */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Monthly Repayment Sensitivity Matrix
              </h3>
              <button
                type="button"
                onClick={onNavigateToStress}
                className="text-2xs text-teal-800 hover:text-teal-950 font-semibold flex items-center gap-1"
              >
                <span>Full TDSR Audit</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-2.5">Rate Scenario</th>
                    <th className="py-2 px-2.5 text-right">All-in Rate</th>
                    <th className="py-2 px-2.5 text-right">Monthly Installment</th>
                    <th className="py-2 px-2.5 text-right">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sensitivityRows.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.diff === 0
                          ? 'bg-teal-50/40 font-semibold text-teal-950'
                          : row.label.includes('Stress')
                          ? 'bg-rose-50/40 text-rose-900'
                          : 'hover:bg-slate-50/60'
                      }
                    >
                      <td className="py-2 px-2.5">{row.label}</td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                        {formatPercent(row.allInRate, 2)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums font-semibold">
                        {formatSgd(row.payment, true)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono tabular-nums">
                        {row.diff === 0 ? (
                          <span className="text-slate-400">Baseline</span>
                        ) : row.diff > 0 ? (
                          <span className="text-rose-700">+{formatSgd(row.diff, true)}</span>
                        ) : (
                          <span className="text-emerald-700">-{formatSgd(Math.abs(row.diff), true)}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Full Monthly Amortization Table */}
      <AmortizationTable
        schedule={summary.amortizationSchedule}
        totalInterest={summary.totalInterest}
        totalPrincipal={summary.totalPrincipal}
        onExportCsv={handleExportCsv}
      />
    </div>
  );
};
