import React, { useState, useMemo } from 'react';
import {
  calculateCompoundedSoraAudit,
  getStandard30DayObservations,
} from '../services/masSoraApi';
import { formatPercent } from '../utils/soraMath';
import { Info, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

export const CompoundingInspector: React.FC = () => {
  const initialData = useMemo(() => getStandard30DayObservations(), []);
  const [observations, setObservations] = useState(initialData);

  // Compute audit results in real time
  const auditResult = useMemo(() => {
    return calculateCompoundedSoraAudit(observations);
  }, [observations]);

  // Compute simple arithmetic average for comparison
  const arithmeticAverage = useMemo(() => {
    if (observations.length === 0) return 0;
    const sum = observations.reduce((acc, curr) => acc + curr.ratePercent, 0);
    return sum / observations.length;
  }, [observations]);

  // Difference between compounding and arithmetic average
  const compoundingDeltaBps = (auditResult.finalCompoundedRatePercent - arithmeticAverage) * 100;

  const handleRateChange = (index: number, newRate: number) => {
    setObservations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ratePercent: newRate };
      return copy;
    });
  };

  const handleResetToPublished = () => {
    setObservations(getStandard30DayObservations());
  };

  return (
    <div className="space-y-6">
      {/* Educational Header & Formula Spec */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Monetary Authority of Singapore (MAS) Compounding Standard</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Daily Overnight Compounding Engine
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            In Singapore money markets, Compounded SORA is calculated daily using actual published
            overnight rates with the <strong>ACT/365 Fixed</strong> day count convention. For
            non-business days (weekends and Singapore public holidays), the preceding business day's
            rate applies.
          </p>
        </div>

        {/* Mathematical Formula Card */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto border border-slate-800">
          <div className="text-slate-400 text-xs mb-1 font-sans font-medium uppercase tracking-wider">
            Official MAS Compounding Formula
          </div>
          <div className="py-2 text-emerald-400 font-semibold tracking-wide">
            Compounded SORA = [ ∏<sub>i=1</sub><sup>d₀</sup> ( 1 + (r<sub>i</sub> × n<sub>i</sub>) / 365 ) - 1 ] × ( 365 / d )
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs text-slate-300 font-sans">
            <div>
              <strong className="text-white">d₀</strong>: Number of business days ({auditResult.businessDaysCount})
            </div>
            <div>
              <strong className="text-white">rᵢ</strong>: Overnight SORA on day i
            </div>
            <div>
              <strong className="text-white">nᵢ</strong>: Calendar days rate applies (1 or 3)
            </div>
            <div>
              <strong className="text-white">d</strong>: Total calendar days ({auditResult.totalCalendarDays})
            </div>
          </div>
        </div>

        {/* Results Comparison Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80">
            <div className="text-xs font-medium text-teal-800">Compounded SORA (MAS Formula)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-teal-950 mt-1">
              {formatPercent(auditResult.finalCompoundedRatePercent, 4)}
            </div>
            <div className="text-xs text-teal-700 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Exact bank compounding rate</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-600">Simple Arithmetic Average</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-800 mt-1">
              {formatPercent(arithmeticAverage, 4)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Sum(rᵢ) / d₀ (Uncompounded)</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-medium text-slate-600">Compounding Effect (Delta)</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {compoundingDeltaBps >= 0 ? '+' : ''}
              {compoundingDeltaBps.toFixed(2)} bps
            </div>
            <div className="text-xs text-slate-500 mt-1">Basis points difference vs simple avg</div>
          </div>
        </div>
      </div>

      {/* Interactive Observation Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Observation Period Breakdown ({auditResult.businessDaysCount} Business Days,{' '}
              {auditResult.totalCalendarDays} Calendar Days)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Notice that Friday rates apply for 3 calendar days (nᵢ = 3) to account for Saturday &
              Sunday. You can edit any rate below to simulate market moves.
            </p>
          </div>

          <button
            onClick={handleResetToPublished}
            className="self-start sm:self-auto px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to MAS Data</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3 text-center">Days (nᵢ)</th>
                <th className="py-2.5 px-3 text-right">Overnight Rate rᵢ (%)</th>
                <th className="py-2.5 px-3 text-right">Daily Factor [1 + (rᵢ·nᵢ)/365]</th>
                <th className="py-2.5 px-3 text-right">Running Product ∏</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditResult.dailyObservations.map((obs, idx) => {
                const isWeekendCarrier = obs.calendarDays > 1;
                return (
                  <tr
                    key={obs.date}
                    className={`transition-colors ${
                      isWeekendCarrier ? 'bg-amber-50/30' : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{obs.date}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span
                        className={
                          obs.dayOfWeek === 'Fri'
                            ? 'font-semibold text-amber-900'
                            : 'text-slate-600'
                        }
                      >
                        {obs.dayOfWeek}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-2xs font-semibold ${
                          obs.calendarDays === 3
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {obs.calendarDays} {obs.calendarDays === 3 ? '(Fri+Sat+Sun)' : 'day'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <input
                        type="number"
                        step="0.0001"
                        value={obs.overnightRatePercent}
                        onChange={(e) => handleRateChange(idx, parseFloat(e.target.value) || 0)}
                        className="w-20 px-1.5 py-0.5 text-right font-mono text-xs border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
                      />
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                      {obs.dailyCompoundingFactor.toFixed(8)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-slate-800">
                      {obs.runningProduct.toFixed(8)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-500">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Weekend rates apply the preceding Friday rate for 3 days. Under MAS conventions,
            compound interest accumulates on the running balance across all 365 days of the year.
          </span>
        </div>
      </div>
    </div>
  );
};
