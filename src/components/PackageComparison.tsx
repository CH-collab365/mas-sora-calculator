import React, { useState, useMemo } from 'react';
import { calculateMonthlyPayment, formatSgd, formatPercent } from '../utils/soraMath';
import { Layers, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';

interface PackageComparisonProps {
  loanPrincipal: number;
  tenorYears: number;
  tenorMonths: number;
  current3mSora: number;
  current1mSora: number;
}

export const PackageComparison: React.FC<PackageComparisonProps> = ({
  loanPrincipal,
  tenorYears,
  tenorMonths,
  current3mSora,
  current1mSora,
}) => {
  const totalMonths = tenorYears * 12 + tenorMonths;

  // Real-world package structures commonly offered by DBS, OCBC, UOB in Singapore
  const [pkg1Spread, setPkg1Spread] = useState(0.65); // 3M SORA + 0.65%
  const [pkg2Spread, setPkg2Spread] = useState(0.55); // 1M SORA + 0.55%
  const [fixedRate, setFixedRate] = useState(2.95); // 2-Year Fixed at 2.95%
  const [postFixedSpread, setPostFixedSpread] = useState(0.80); // Thereafter 3M SORA + 0.80%

  const comparison = useMemo(() => {
    // Package 1: 3M SORA
    const rate1 = current3mSora + pkg1Spread;
    const payment1 = calculateMonthlyPayment(loanPrincipal, rate1, totalMonths);
    const interest3Yr1 = (payment1 * 36) - (loanPrincipal - calculateMonthlyPayment(loanPrincipal, rate1, totalMonths)); // approximate 3-yr interest

    // Package 2: 1M SORA
    const rate2 = current1mSora + pkg2Spread;
    const payment2 = calculateMonthlyPayment(loanPrincipal, rate2, totalMonths);

    // Package 3: Fixed 2-Year
    const paymentFixed = calculateMonthlyPayment(loanPrincipal, fixedRate, totalMonths);
    const paymentPostFixed = calculateMonthlyPayment(loanPrincipal, current3mSora + postFixedSpread, totalMonths - 24);

    return [
      {
        id: 'pkg-3m',
        name: '3-Month Compounded SORA',
        tagline: 'Most Popular Singapore Floating Package',
        type: 'Floating (Quarterly Reset)',
        benchmark: `3M SORA (${formatPercent(current3mSora, 4)})`,
        spread: `+ ${formatPercent(pkg1Spread, 2)}`,
        allInRate: rate1,
        monthlyPayment: payment1,
        annualPayment: payment1 * 12,
        first3YearsTotal: payment1 * 36,
        features: [
          'Locks rate for 3 months at a time based on MAS index',
          'Less volatile than daily or 1-month SORA',
          'Standard conversion rights after lock-in period',
        ],
        badge: 'Market Standard',
        highlightColor: 'teal',
      },
      {
        id: 'pkg-1m',
        name: '1-Month Compounded SORA',
        tagline: 'Fastest Response in Declining Rate Cycles',
        type: 'Floating (Monthly Reset)',
        benchmark: `1M SORA (${formatPercent(current1mSora, 4)})`,
        spread: `+ ${formatPercent(pkg2Spread, 2)}`,
        allInRate: rate2,
        monthlyPayment: payment2,
        annualPayment: payment2 * 12,
        first3YearsTotal: payment2 * 36,
        features: [
          'Adjusts monthly to current MAS published benchmark',
          'Capitalizes faster on downward MAS rate cuts',
          'Slightly higher monthly installment variation',
        ],
        badge: 'Lowest Current Spread',
        highlightColor: 'blue',
      },
      {
        id: 'pkg-fixed',
        name: '2-Year Fixed Rate Lock',
        tagline: 'Budget Certainty & Zero Rate Risk for 24 Months',
        type: 'Fixed (24 Mo Lock)',
        benchmark: 'Contractual Guaranteed Rate',
        spread: `Yr 1-2: Flat ${formatPercent(fixedRate, 2)}`,
        allInRate: fixedRate,
        monthlyPayment: paymentFixed,
        annualPayment: paymentFixed * 12,
        first3YearsTotal: paymentFixed * 24 + paymentPostFixed * 12,
        features: [
          'Guaranteed monthly installment for first 24 months',
          'Insulated from geopolitical rate shocks and inflation',
          `Reverts to 3M SORA + ${formatPercent(postFixedSpread, 2)} thereafter`,
        ],
        badge: 'Protected Cash Flow',
        highlightColor: 'amber',
      },
    ];
  }, [
    loanPrincipal,
    totalMonths,
    current3mSora,
    current1mSora,
    pkg1Spread,
    pkg2Spread,
    fixedRate,
    postFixedSpread,
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-1">
          <Layers className="w-3.5 h-3.5" />
          <span>Singapore Bank Package Benchmark</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          SORA Floating Packages vs Fixed Rate Packages
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          Compare total installments, interest outlays, and payment stability across 3-Month SORA,
          1-Month SORA, and Fixed Rate bank offerings for a{' '}
          <strong>{formatSgd(loanPrincipal)}</strong> loan over {tenorYears} years.
        </p>

        {/* Customization Sliders */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              3M SORA Bank Spread (%)
            </label>
            <input
              type="number"
              step="0.05"
              value={pkg1Spread}
              onChange={(e) => setPkg1Spread(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 font-mono text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
            />
            <span className="text-3xs text-slate-400 mt-0.5 block">Market avg: +0.60% to +0.75%</span>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              1M SORA Bank Spread (%)
            </label>
            <input
              type="number"
              step="0.05"
              value={pkg2Spread}
              onChange={(e) => setPkg2Spread(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 font-mono text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
            />
            <span className="text-3xs text-slate-400 mt-0.5 block">Market avg: +0.50% to +0.65%</span>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              2-Year Fixed Promo Rate (%)
            </label>
            <input
              type="number"
              step="0.05"
              value={fixedRate}
              onChange={(e) => setFixedRate(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 font-mono text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
            />
            <span className="text-3xs text-slate-400 mt-0.5 block">Standard promotional rate</span>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Post-Fixed Spread (Yr 3+)
            </label>
            <input
              type="number"
              step="0.05"
              value={postFixedSpread}
              onChange={(e) => setPostFixedSpread(parseFloat(e.target.value) || 0)}
              className="w-full px-2.5 py-1.5 font-mono text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
            />
            <span className="text-3xs text-slate-400 mt-0.5 block">Spread after fixed period ends</span>
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {comparison.map((pkg) => {
          const isTeal = pkg.highlightColor === 'teal';
          const isBlue = pkg.highlightColor === 'blue';

          return (
            <div
              key={pkg.id}
              className={`rounded-xl border bg-white p-5 shadow-xs flex flex-col justify-between transition-all ${
                isTeal
                  ? 'border-teal-300 ring-1 ring-teal-200/60'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {pkg.type}
                  </span>
                  <span
                    className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
                      isTeal
                        ? 'bg-teal-50 text-teal-800 border border-teal-200'
                        : isBlue
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {pkg.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mt-2">{pkg.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{pkg.tagline}</p>

                {/* Primary All-in Rate Display */}
                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-2xs text-slate-500 font-medium">All-in Effective Rate</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                    {formatPercent(pkg.allInRate, 3)}
                  </div>
                  <div className="text-2xs text-slate-500 mt-1 flex items-center gap-1">
                    <span>{pkg.benchmark}</span>
                    <span className="text-slate-400">{pkg.spread}</span>
                  </div>
                </div>

                {/* Monthly Installment */}
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="text-xs text-slate-600">Monthly Installment</div>
                  <div className="text-xl font-bold font-mono tabular-nums text-teal-900 mt-0.5">
                    {formatSgd(pkg.monthlyPayment, true)}
                  </div>
                  <div className="text-2xs text-slate-400 mt-0.5">
                    Annual: {formatSgd(pkg.annualPayment)}
                  </div>
                </div>

                {/* 3-Year Total Payments */}
                <div className="mt-3 p-2.5 rounded-md bg-slate-50 text-xs text-slate-600 flex items-center justify-between">
                  <span>Estimated 3-Yr Outlay:</span>
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {formatSgd(pkg.first3YearsTotal)}
                  </span>
                </div>

                {/* Feature Bullet Points */}
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => alert(`Package ${pkg.name} selected. Applying to main calculator.`)}
                  className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                    isTeal
                      ? 'bg-teal-800 text-white hover:bg-teal-900'
                      : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <span>Select Package</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
