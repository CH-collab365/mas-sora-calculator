/**
 * Type definitions for Singapore Overnight Rate Average (SORA) and loan calculation.
 */

export interface SoraRateRecord {
  date: string; // YYYY-MM-DD
  overnightRate: number; // Daily SORA rate in % p.a.
  compounded1M: number; // 1-Month Compounded SORA in % p.a.
  compounded3M: number; // 3-Month Compounded SORA in % p.a.
  compounded6M: number; // 6-Month Compounded SORA in % p.a.
  volumeMillionSgd: number; // Aggregate volume in SGD million
  publishedTime: string; // Typically 9:00am SGT next business day
}

export type SoraTenor = '1M' | '3M' | '6M' | 'overnight';
export type CompoundingMethod = 'in_advance' | 'in_arrears';
export type PropertyType = 'hdb' | 'private_residential' | 'commercial';

export interface TieredSpread {
  year1: number;
  year2: number;
  year3: number;
  thereafter: number;
}

export interface LoanInputState {
  loanAmount: number; // Principal in SGD
  tenorYears: number; // e.g. 25
  tenorMonths: number; // e.g. 0
  propertyType: PropertyType;
  soraTenor: SoraTenor;
  compoundingMethod: CompoundingMethod;
  isTieredSpread: boolean;
  flatSpread: number; // % p.a., e.g. 0.70
  tieredSpread: TieredSpread;
  customSoraRate: number | null; // Override if user wants custom rate test
}

export interface AmortizationRow {
  monthIndex: number;
  year: number;
  monthInYear: number;
  dateStr: string;
  beginningBalance: number;
  monthlyPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
  applicableRate: number; // Total interest rate (SORA + spread)
}

export interface LoanCalculationSummary {
  monthlyPayment: number;
  applicableRate: number;
  baseSoraRate: number;
  spread: number;
  totalPayments: number;
  totalInterest: number;
  totalPrincipal: number;
  effectiveRate: number;
  amortizationSchedule: AmortizationRow[];
}

export interface DailyObservationDay {
  date: string;
  dayOfWeek: string;
  calendarDays: number; // n_i
  overnightRatePercent: number; // r_i in %
  dailyCompoundingFactor: number; // (1 + (r_i * n_i) / 365)
  runningProduct: number;
}

export interface CompoundingAuditResult {
  periodStart: string;
  periodEnd: string;
  businessDaysCount: number; // d_0
  totalCalendarDays: number; // d
  dailyObservations: DailyObservationDay[];
  finalCompoundedRatePercent: number;
}

export interface TdsrMsrInput {
  grossMonthlyIncome: number;
  otherMonthlyDebts: number; // Car loans, credit cards, other commitments
  propertyType: PropertyType;
  age: number;
}

export interface TdsrMsrResult {
  currentMonthlyPayment: number;
  stressMonthlyPayment: number; // at MAS mandated 4.0%
  currentTdsrPercent: number;
  stressTdsrPercent: number;
  isTdsrCompliant: boolean; // <= 55%
  currentMsrPercent: number | null; // For HDB/EC only
  stressMsrPercent: number | null;
  isMsrCompliant: boolean | null; // <= 30% for HDB/EC
  maxBorrowingCapacityAtStress: number;
}

export interface ComparisonPackage {
  id: string;
  name: string;
  type: 'sora_1m' | 'sora_3m' | 'sora_6m' | 'fixed' | 'board';
  baseRatePercent: number;
  spreadPercent: number;
  year1Spread: number;
  year2Spread: number;
  year3Spread: number;
  thereafterSpread: number;
  lockInYears: number;
  description: string;
}
