"use client"

export type Strategy = {
  id: string
  title: string
  description: string
  principalShare: number
  investShare: number
}

export type StartCashUsage = "none" | "principal" | "invest"

export type DividendPayout = {
  month: number
  weight: number
}

export type SimulationParams = {
  loanAmount: number
  interestRate: number
  basePayment: number
  extraBudget: number
  startCash: number
  startCashUsage: StartCashUsage
  stockGrowth: number
  dividendYield: number
  useDividendsForMortgage: boolean
  autoLiquidate: boolean
  startYear?: number
  startMonth?: number
  dividendPayouts?: DividendPayout[]
  strategies: Strategy[]
}

export type HistoryPoint = {
  month: number
  year: number
  calendarMonth: number
  daysInMonth: number
  balance: number
  portfolio: number
  bankPayment: number
  interestPaid: number
  principalPaid: number
  extraPrincipal: number
  dividendApplied: number
  investContribution: number
  investedPrincipal: number
  portfolioLiquidation: number
  dividendEarned: number
  dividendRateApplied: number
  totalPaidToBank: number
  totalInterestPaid: number
  totalPrincipalPaid: number
}

export type SimulationResult = {
  plan: Strategy
  months: number
  years: number | null
  paidOff: boolean
  portfolio: number
  dividendIncome: number
  history: HistoryPoint[]
}

const MAX_MONTHS = 50 * 12
const DAYS_IN_YEAR = 365
const DEFAULT_START_YEAR = 2026
const DEFAULT_START_MONTH = 1
const DEFAULT_DIVIDEND_PAYOUTS: DividendPayout[] = [
  { month: 3, weight: 0.6 },
  { month: 9, weight: 0.4 },
]

const clampMonth = (month: number) => {
  if (month < 1) return 1
  if (month > 12) return 12
  return month
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate()
}

const nextMonth = (year: number, month: number) => {
  if (month === 12) {
    return { year: year + 1, month: 1 }
  }
  return { year, month: month + 1 }
}

export function runSimulation(params: SimulationParams): SimulationResult[] {
  const {
    loanAmount,
    interestRate,
    basePayment,
    extraBudget,
    startCash,
    startCashUsage,
    stockGrowth,
    dividendYield,
    useDividendsForMortgage,
    autoLiquidate,
    startYear = DEFAULT_START_YEAR,
    startMonth = DEFAULT_START_MONTH,
    dividendPayouts,
    strategies,
  } = params

  const growthRateMonthly = stockGrowth / 100 / 12
  const annualDividendRate = dividendYield / 100

  const payoutSchedule =
    dividendPayouts && dividendPayouts.length > 0 ? dividendPayouts : DEFAULT_DIVIDEND_PAYOUTS

  const normalizedPayoutSchedule = payoutSchedule
    .map((item) => ({
      month: clampMonth(Math.round(item.month)),
      weight: Math.max(0, item.weight),
    }))
    .filter((item) => item.weight > 0)

  const payoutWeightSum = normalizedPayoutSchedule.reduce((sum, item) => sum + item.weight, 0)
  const dividendSchedule =
    payoutWeightSum > 0
      ? normalizedPayoutSchedule.map((item) => ({
          month: item.month,
          weight: item.weight / payoutWeightSum,
        }))
      : []

  return strategies
    .map((plan) => {
      let balance = Math.max(0, loanAmount - (startCashUsage === "principal" ? startCash : 0))
      let portfolio = startCashUsage === "invest" ? startCash : 0
      let investedPrincipal = startCashUsage === "invest" ? startCash : 0
      let months = 0
      let completed = false
      let cumulativePayment = 0
      let cumulativeInterest = 0
      let cumulativePrincipal = 0
      let currentYear = startYear
      let currentMonth = clampMonth(startMonth)

      const history: HistoryPoint[] = [
        {
          month: 0,
          year: currentYear,
          calendarMonth: currentMonth,
          daysInMonth: 0,
          balance,
          portfolio,
          bankPayment: 0,
          interestPaid: 0,
          principalPaid: 0,
          extraPrincipal: 0,
          dividendApplied: 0,
          investContribution: 0,
          investedPrincipal,
          portfolioLiquidation: 0,
          dividendEarned: 0,
          dividendRateApplied: 0,
          totalPaidToBank: 0,
          totalInterestPaid: 0,
          totalPrincipalPaid: 0,
        },
      ]

      while (balance > 0 && months < MAX_MONTHS) {
        months += 1
        const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth)
        const interestFactor = (interestRate / 100) * (daysInCurrentMonth / DAYS_IN_YEAR)
        const interestDue = balance * interestFactor
        let principalPayment = Math.max(0, basePayment - interestDue)

        if (principalPayment <= 0 && plan.principalShare <= 0 && !useDividendsForMortgage) {
          break
        }

        if (principalPayment > balance) {
          principalPayment = balance
        }

        balance = Math.max(0, balance - principalPayment)

        let extraPrincipal = extraBudget * plan.principalShare
        if (extraPrincipal > balance) {
          extraPrincipal = balance
        }
        balance = Math.max(0, balance - extraPrincipal)

        const investmentContribution = extraBudget * plan.investShare
        if (investmentContribution > 0) {
          portfolio += investmentContribution
          investedPrincipal += investmentContribution
        }

        if (portfolio > 0) {
          const growthFactor = Math.max(0, 1 + growthRateMonthly)
          portfolio *= growthFactor
        }

        const payout = dividendSchedule.find((item) => item.month === currentMonth)
        const dividendRateApplied = payout && annualDividendRate > 0 ? annualDividendRate * payout.weight : 0
        const grossDividend = dividendRateApplied > 0 ? portfolio * dividendRateApplied : 0
        let dividendApplied = 0
        if (useDividendsForMortgage && grossDividend > 0) {
          dividendApplied = Math.min(grossDividend, balance)
          balance = Math.max(0, balance - dividendApplied)
        } else if (grossDividend > 0) {
          portfolio += grossDividend
        }

        let liquidation = 0
        if (autoLiquidate && portfolio >= balance && balance > 0) {
          liquidation = balance
          portfolio -= balance
          balance = 0
        }

        const bankPayment = interestDue + principalPayment + extraPrincipal + dividendApplied
        cumulativePayment += bankPayment
        cumulativeInterest += interestDue
        cumulativePrincipal += principalPayment + extraPrincipal + dividendApplied + liquidation

        history.push({
          month: months,
          year: currentYear,
          calendarMonth: currentMonth,
          daysInMonth: daysInCurrentMonth,
          balance,
          portfolio,
          bankPayment,
          interestPaid: interestDue,
          principalPaid: principalPayment,
          extraPrincipal,
          dividendApplied,
          investContribution: investmentContribution,
          investedPrincipal,
          portfolioLiquidation: liquidation,
          dividendEarned: grossDividend,
          dividendRateApplied,
          totalPaidToBank: cumulativePayment,
          totalInterestPaid: cumulativeInterest,
          totalPrincipalPaid: cumulativePrincipal,
        })

        if (balance === 0) {
          completed = true
          break
        }

        const next = nextMonth(currentYear, currentMonth)
        currentYear = next.year
        currentMonth = next.month
      }

      const dividendIncome = portfolio * annualDividendRate * (1 / 12)
      return {
        plan,
        months: completed ? months : MAX_MONTHS,
        years: completed ? months / 12 : null,
        paidOff: completed,
        portfolio,
        dividendIncome,
        history,
      }
    })
    .sort((a, b) => a.months - b.months)
}
