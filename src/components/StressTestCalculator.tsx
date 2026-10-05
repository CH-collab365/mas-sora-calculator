import React, { useState, useMemo } from 'react';
import { PropertyType } from '../types/sora';
import { calculateTdsrMsr, formatSgd, formatPercent, MAS_STRESS_RATE_PERCENT } from '../utils/soraMath';
import { ShieldCheck, ShieldAlert, AlertTriangle, Check, Info } from 'lucide-react';

interface StressTestCalculatorProps {
  currentMonthlyPayment: number;
  loanPrincipal: number;
  tenorYears: number;
  tenorMonths: number;
  propertyType: PropertyType;
}

export const StressTestCalculator: React.FC<StressTestCalculatorProps> = ({
  currentMonthlyPayment,
  loanPrincipal,
  tenorYears,
  tenorMonths,
  propertyType: initialPropertyType,
}) => {
  const [grossIncome, setGrossIncome] = useState(12000);
  const [otherDebts, setOtherDebts] = useState(1500); // e.g. car loan, student loan
  const [propertyType, setPropertyType] = useState<PropertyType>(initialPropertyType);
  const [borrowerAge, setBorrowerAge] = useState(35);

  const totalTenorMonths = tenorYears * 12 + tenorMonths;

  const result = useMemo(() => {
    return calculateTdsrMsr(
      {
        grossMonthlyIncome: grossIncome,
        otherMonthlyDebts: otherDebts,
        propertyType,
        age: borrowerAge,
      },
      currentMonthlyPayment,
      loanPrincipal,
      totalTenorMonths
    );
  }, [grossIncome, otherDebts, propertyType, borrowerAge, currentMonthlyPayment, loanPrincipal, totalTenorMonths]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>MAS Notice 645 & Notice 632 Regulatory Assessment</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          MAS 4.00% Medium-Term Stress Rate & Debt Ratios (TDSR / MSR)
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
          The Monetary Authority of Singapore requires banks to stress-test residential mortgage
          borrowers using a medium-term interest rate floor of at least{' '}
          <strong>{formatPercent(MAS_STRESS_RATE_PERCENT, 2)}</strong>. This ensures borrowers remain
          resilient if market overnight rates rise.
        </p>

        {/* Input Parameters Form */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Gross Monthly Income (SGD)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                S$
              </span>
              <input
                type="number"
                value={grossIncome}
                onChange={(e) => setGrossIncome(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              />
            </div>
            <span className="text-3xs text-slate-400 mt-0.5 block">Total household monthly income</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Other Monthly Debts (SGD)
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-mono">
                S$
              </span>
              <input
                type="number"
                value={otherDebts}
                onChange={(e) => setOtherDebts(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
              />
            </div>
            <span className="text-3xs text-slate-400 mt-0.5 block">Car loans, credit cards, education</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Property Classification</label>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value as PropertyType)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
            >
              <option value="hdb">HDB Flat / Executive Condo (EC)</option>
              <option value="private_residential">Private Residential Property</option>
              <option value="commercial">Commercial Property</option>
            </select>
            <span className="text-3xs text-slate-400 mt-0.5 block">MSR applies only to HDB/EC</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Borrower Age</label>
            <input
              type="number"
              min={21}
              max={70}
              value={borrowerAge}
              onChange={(e) => setBorrowerAge(parseInt(e.target.value) || 35)}
              className="w-full px-3 py-1.5 text-xs font-mono tabular-nums border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700 focus:border-teal-700"
            />
            <span className="text-3xs text-slate-400 mt-0.5 block">Max age limit for MAS rules (65/75)</span>
          </div>
        </div>
      </div>

      {/* Compliance Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* TDSR Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Total Debt Servicing Ratio (TDSR)</h3>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                result.isTdsrCompliant
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {result.isTdsrCompliant ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Compliant (≤ 55%)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>Exceeds MAS 55% Cap</span>
                </>
              )}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="text-xs text-slate-500">TDSR @ Current Rate</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {result.currentTdsrPercent}%
              </div>
              <div className="text-2xs text-slate-500 mt-0.5">
                Installment: {formatSgd(result.currentMonthlyPayment, true)}
              </div>
            </div>

            <div
              className={`p-3 rounded-lg border ${
                result.isTdsrCompliant
                  ? 'bg-teal-50/50 border-teal-200'
                  : 'bg-rose-50/50 border-rose-200'
              }`}
            >
              <div className="text-xs text-slate-700 font-medium">
                TDSR @ MAS 4.0% Stress
              </div>
              <div
                className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                  result.isTdsrCompliant ? 'text-teal-950' : 'text-rose-950'
                }`}
              >
                {result.stressTdsrPercent}%
              </div>
              <div className="text-2xs text-slate-600 mt-0.5">
                Stress Installment: {formatSgd(result.stressMonthlyPayment, true)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
              <span>MAS Regulatory Ceiling: 55%</span>
              <span className="font-mono tabular-nums">{result.stressTdsrPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${
                  result.stressTdsrPercent <= 55 ? 'bg-teal-700' : 'bg-rose-600'
                }`}
                style={{ width: `${Math.min(100, (result.stressTdsrPercent / 55) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* MSR Card (If HDB/EC) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Mortgage Servicing Ratio (MSR)</h3>
            {propertyType === 'hdb' ? (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  result.isMsrCompliant
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {result.isMsrCompliant ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Compliant (≤ 30%)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>Exceeds 30% Cap</span>
                  </>
                )}
              </span>
            ) : (
              <span className="text-2xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Not Applicable (Private Property)
              </span>
            )}
          </div>

          {propertyType === 'hdb' ? (
            <>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="text-xs text-slate-500">MSR @ Current Rate</div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                    {result.currentMsrPercent}%
                  </div>
                  <div className="text-2xs text-slate-500 mt-0.5">
                    Property Installment / Income
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border ${
                    result.isMsrCompliant
                      ? 'bg-teal-50/50 border-teal-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="text-xs text-slate-700 font-medium">
                    MSR @ MAS 4.0% Stress
                  </div>
                  <div
                    className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                      result.isMsrCompliant ? 'text-teal-950' : 'text-rose-950'
                    }`}
                  >
                    {result.stressMsrPercent}%
                  </div>
                  <div className="text-2xs text-slate-600 mt-0.5">
                    Regulatory threshold: 30%
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-2xs text-slate-500 mb-1">
                  <span>HDB/EC Regulatory Ceiling: 30%</span>
                  <span className="font-mono tabular-nums">{result.stressMsrPercent}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-300 ${
                      (result.stressMsrPercent || 0) <= 30 ? 'bg-teal-700' : 'bg-rose-600'
                    }`}
                    style={{
                      width: `${Math.min(100, ((result.stressMsrPercent || 0) / 30) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 p-4 rounded-lg bg-slate-50 text-xs text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <span>
                MSR is only required for purchases of HDB flats and Executive Condominiums (ECs)
                under MAS rules. Private residential properties are evaluated strictly under TDSR
                (capped at 55%).
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Max Borrowing Capacity Summary */}
      <div className="p-5 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
            MAS Stress Capacity Analysis
          </div>
          <div className="text-lg font-bold mt-0.5">
            Maximum Eligible Loan Under MAS 4.0% Stress Floor
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Based on your declared income of {formatSgd(grossIncome)} and other debt obligations,
            the maximum loan amount a Singapore financial institution can disburse is:
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold font-mono tabular-nums text-emerald-400">
            {formatSgd(result.maxBorrowingCapacityAtStress)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Current Requested: {formatSgd(loanPrincipal)} (
            {loanPrincipal <= result.maxBorrowingCapacityAtStress ? (
              <span className="text-emerald-400">Within Limit</span>
            ) : (
              <span className="text-rose-400">Exceeds Cap by {formatSgd(loanPrincipal - result.maxBorrowingCapacityAtStress)}</span>
            )}
            )
          </div>
        </div>
      </div>
    </div>
  );
};
