import {
  AmortizationRow,
  LoanCalculationSummary,
  LoanInputState,
  TdsrMsrInput,
  TdsrMsrResult,
} from '../types/sora';

/**
 * Standard reducing balance monthly payment formula:
 * M = P * [ r * (1 + r)^N ] / [ (1 + r)^N - 1 ]
 * where r = annualRate / 12, N = totalMonths
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  totalMonths: number
): number {
  if (principal <= 0 || totalMonths <= 0) return 0;
  if (annualRatePercent <= 0) return principal / totalMonths;

  const monthlyRate = annualRatePercent / 100 / 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);
  const payment = principal * ((monthlyRate * factor) / (factor - 1));
  return payment;
}

/**
 * Get applicable bank spread based on loan year
 */
export function getSpreadForYear(params: LoanInputState, yearNumber: number): number {
  if (!params.isTieredSpread) {
    return params.flatSpread;
  }
  if (yearNumber === 1) return params.tieredSpread.year1;
  if (yearNumber === 2) return params.tieredSpread.year2;
  if (yearNumber === 3) return params.tieredSpread.year3;
  return params.tieredSpread.thereafter;
}

/**
 * Generate full monthly amortization schedule
 */
export function generateAmortizationSchedule(
  params: LoanInputState,
  baseSoraRate: number
): LoanCalculationSummary {
  const totalMonths = params.tenorYears * 12 + params.tenorMonths;
  if (totalMonths <= 0 || params.loanAmount <= 0) {
    return {
      monthlyPayment: 0,
      applicableRate: 0,
      baseSoraRate,
      spread: params.flatSpread,
      totalPayments: 0,
      totalInterest: 0,
      totalPrincipal: 0,
      effectiveRate: 0,
      amortizationSchedule: [],
    };
  }

  const effectiveBaseSora =
    params.customSoraRate !== null && !isNaN(params.customSoraRate)
      ? params.customSoraRate
      : baseSoraRate;

  let currentBalance = params.loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  const schedule: AmortizationRow[] = [];

  const startDate = new Date();
  startDate.setDate(1); // Set to 1st of month

  let initialMonthlyPayment = 0;

  for (let monthIndex = 1; monthIndex <= totalMonths; monthIndex++) {
    const yearNumber = Math.ceil(monthIndex / 12);
    const monthInYear = ((monthIndex - 1) % 12) + 1;
    const spread = getSpreadForYear(params, yearNumber);
    const applicableRate = effectiveBaseSora + spread;

    // Remaining tenor in months from this point
    const remainingMonths = totalMonths - monthIndex + 1;
    const monthlyPayment = calculateMonthlyPayment(currentBalance, applicableRate, remainingMonths);

    if (monthIndex === 1) {
      initialMonthlyPayment = monthlyPayment;
    }

    // Monthly interest: Singapore convention utilizes (balance * rate / 12) or daily ACT/365
    const monthlyInterest = currentBalance * (applicableRate / 100 / 12);
    let principalPaid = monthlyPayment - monthlyInterest;

    // Handle last month rounding / payoff
    if (principalPaid > currentBalance || monthIndex === totalMonths) {
      principalPaid = currentBalance;
    }

    const endingBalance = Math.max(0, currentBalance - principalPaid);
    cumulativeInterest += monthlyInterest;
    cumulativePrincipal += principalPaid;

    const rowDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex, 1);
    const dateStr = rowDate.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });

    schedule.push({
      monthIndex,
      year: yearNumber,
      monthInYear,
      dateStr,
      beginningBalance: currentBalance,
      monthlyPayment,
      principalPaid,
      interestPaid: monthlyInterest,
      endingBalance,
      cumulativeInterest,
      cumulativePrincipal,
      applicableRate,
    });

    currentBalance = endingBalance;
    if (currentBalance <= 0) break;
  }

  const totalPayments = cumulativeInterest + cumulativePrincipal;
  const initialSpread = getSpreadForYear(params, 1);

  return {
    monthlyPayment: initialMonthlyPayment,
    applicableRate: effectiveBaseSora + initialSpread,
    baseSoraRate: effectiveBaseSora,
    spread: initialSpread,
    totalPayments,
    totalInterest: cumulativeInterest,
    totalPrincipal: cumulativePrincipal,
    effectiveRate: effectiveBaseSora + initialSpread,
    amortizationSchedule: schedule,
  };
}

/**
 * MAS Mandated Stress Test Rate
 * Notice 645/632 mandates 4.00% floor for residential property
 */
export const MAS_STRESS_RATE_PERCENT = 4.0;

/**
 * Calculate TDSR and MSR compliance
 */
export function calculateTdsrMsr(
  input: TdsrMsrInput,
  currentMonthlyPayment: number,
  loanPrincipal: number,
  tenorMonths: number
): TdsrMsrResult {
  const stressMonthlyPayment = calculateMonthlyPayment(
    loanPrincipal,
    MAS_STRESS_RATE_PERCENT,
    tenorMonths
  );

  const grossIncome = Math.max(1, input.grossMonthlyIncome);

  // TDSR: (All monthly debt obligations + property loan installment) / Gross Monthly Income
  const currentTotalDebt = currentMonthlyPayment + input.otherMonthlyDebts;
  const stressTotalDebt = stressMonthlyPayment + input.otherMonthlyDebts;

  const currentTdsrPercent = (currentTotalDebt / grossIncome) * 100;
  const stressTdsrPercent = (stressTotalDebt / grossIncome) * 100;
  const isTdsrCompliant = stressTdsrPercent <= 55.0; // MAS TDSR cap is 55%

  // MSR: Only applies to HDB flats and ECs purchased directly from developers (cap is 30%)
  const isHdbOrEc = input.propertyType === 'hdb';
  let currentMsrPercent: number | null = null;
  let stressMsrPercent: number | null = null;
  let isMsrCompliant: boolean | null = null;

  if (isHdbOrEc) {
    currentMsrPercent = (currentMonthlyPayment / grossIncome) * 100;
    stressMsrPercent = (stressMonthlyPayment / grossIncome) * 100;
    isMsrCompliant = stressMsrPercent <= 30.0;
  }

  // Calculate Maximum borrowing capacity under MAS stress rate
  // Max debt allowance under TDSR = (55% * income) - other debts
  const maxMonthlyInstallmentAllowedByTdsr = Math.max(
    0,
    grossIncome * 0.55 - input.otherMonthlyDebts
  );

  let allowedMonthlyPayment = maxMonthlyInstallmentAllowedByTdsr;
  if (isHdbOrEc) {
    const maxInstallmentByMsr = grossIncome * 0.3;
    allowedMonthlyPayment = Math.min(allowedMonthlyPayment, maxInstallmentByMsr);
  }

  // Invert annuity formula to find Max Principal P:
  // P = M * [ (1+r)^N - 1 ] / [ r * (1+r)^N ]
  const r = MAS_STRESS_RATE_PERCENT / 100 / 12;
  const factor = Math.pow(1 + r, tenorMonths);
  const maxBorrowingCapacityAtStress =
    allowedMonthlyPayment > 0 && r > 0
      ? allowedMonthlyPayment * ((factor - 1) / (r * factor))
      : 0;

  return {
    currentMonthlyPayment,
    stressMonthlyPayment,
    currentTdsrPercent: Number(currentTdsrPercent.toFixed(1)),
    stressTdsrPercent: Number(stressTdsrPercent.toFixed(1)),
    isTdsrCompliant,
    currentMsrPercent: currentMsrPercent !== null ? Number(currentMsrPercent.toFixed(1)) : null,
    stressMsrPercent: stressMsrPercent !== null ? Number(stressMsrPercent.toFixed(1)) : null,
    isMsrCompliant,
    maxBorrowingCapacityAtStress: Math.round(maxBorrowingCapacityAtStress),
  };
}

/**
 * Format currency in SGD
 */
export function formatSgd(amount: number, showDecimals = false): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Export amortization schedule to CSV string
 */
export function exportAmortizationCsv(schedule: AmortizationRow[]): string {
  const headers = [
    'Month',
    'Date',
    'Applicable Rate (%)',
    'Beginning Balance (SGD)',
    'Monthly Installment (SGD)',
    'Principal Paid (SGD)',
    'Interest Paid (SGD)',
    'Ending Balance (SGD)',
    'Cumulative Interest (SGD)',
  ];

  const rows = schedule.map((row) => [
    row.monthIndex,
    row.dateStr,
    row.applicableRate.toFixed(4),
    row.beginningBalance.toFixed(2),
    row.monthlyPayment.toFixed(2),
    row.principalPaid.toFixed(2),
    row.interestPaid.toFixed(2),
    row.endingBalance.toFixed(2),
    row.cumulativeInterest.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
