"use client"

export type Strategy = {
  id: string
  title: string
  description: string
  principalShare: number
  investShare: number
}

export type SimulationParams = {
  loanAmount: number
  interestRate: number
  basePayment: number
  extraBudget: number
  startCash: number
  startCashUsage: string
  stockGrowth: number
  dividendYield: number
  useDividendsForMortgage: boolean
  autoLiquidate: boolean
  strategies: Strategy[]
}

export type HistoryPoint = {
  month: number
  balance: number
  portfolio: number
  bankPayment: number
  interestPaid: number
  principalPaid: number
  extraPrincipal: number
  dividendApplied: number
  investContribution: number
  portfolioLiquidation: number
  dividendEarned: number
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
    strategies,
  } = params

  const monthlyRate = interestRate / 100 / 12
  const growthRateMonthly = stockGrowth / 100 / 12
  const dividendRateMonthly = dividendYield / 100 / 12

  return strategies
    .map((plan) => {
      let balance = Math.max(0, loanAmount - (startCashUsage === "principal" ? startCash : 0))
      let portfolio = startCashUsage === "invest" ? startCash : 0
      let months = 0
      let completed = false
      const history: HistoryPoint[] = [
        {
          month: 0,
          balance,
          portfolio,
          bankPayment: 0,
          interestPaid: 0,
          principalPaid: 0,
          extraPrincipal: 0,
          dividendApplied: 0,
          investContribution: 0,
          portfolioLiquidation: 0,
          dividendEarned: 0,
        },
      ]

      while (balance > 0 && months < MAX_MONTHS) {
        months += 1
        const interestDue = balance * monthlyRate
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
        }

        if (portfolio > 0) {
          const growthFactor = Math.max(0, 1 + growthRateMonthly)
          portfolio *= growthFactor
        }

        const grossDividend = portfolio * dividendRateMonthly
        let dividendApplied = 0
        if (useDividendsForMortgage && grossDividend > 0) {
          dividendApplied = Math.min(grossDividend, balance)
          balance = Math.max(0, balance - dividendApplied)
          portfolio = Math.max(0, portfolio - dividendApplied)
        } else if (grossDividend > 0) {
          portfolio += grossDividend
        }

        let liquidation = 0
        if (autoLiquidate && portfolio >= balance && balance > 0) {
          liquidation = balance
          portfolio -= balance
          balance = 0
        }

        history.push({
          month: months,
          balance,
          portfolio,
          bankPayment: interestDue + principalPayment + extraPrincipal + dividendApplied,
          interestPaid: interestDue,
          principalPaid: principalPayment,
          extraPrincipal,
          dividendApplied,
          investContribution: investmentContribution,
          portfolioLiquidation: liquidation,
          dividendEarned: grossDividend,
        })

        if (balance === 0) {
          completed = true
          break
        }
      }

      const dividendIncome = portfolio * dividendRateMonthly
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
