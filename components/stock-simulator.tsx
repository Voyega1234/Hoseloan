"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { DollarSign, TrendingUp, Zap } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import {
  runSimulation,
  type Strategy,
  type SimulationParams,
  type SimulationResult,
  type StartCashUsage,
} from "@/lib/simulation"

type BaseSimulationParams = Omit<SimulationParams, "strategies">

const PLAN_STRATEGIES: Strategy[] = [
  {
    id: "A",
    title: "Plan A",
    description: "ผ่อนขั้นต่ำตามธนาคาร ไม่ทำอะไรเพิ่ม",
    principalShare: 0,
    investShare: 0,
  },
  {
    id: "B",
    title: "Plan B",
    description: "ทุ่มเงินส่วนเกินทั้งหมดไปโปะต้น",
    principalShare: 1,
    investShare: 0,
  },
  {
    id: "C",
    title: "Plan C",
    description: "ลงทุนเงินส่วนเกินด้วย DCA หุ้น 100%",
    principalShare: 0,
    investShare: 1,
  },
  {
    id: "D",
    title: "Plan D",
    description: "แบ่งเงินส่วนเกินโปะต้นและ DCA อย่างละครึ่ง",
    principalShare: 0.5,
    investShare: 0.5,
  },
]

const START_CASH_OPTIONS: { value: StartCashUsage; label: string }[] = [
  { value: "none", label: "เก็บเป็นเงินสำรอง" },
  { value: "principal", label: "โปะลดต้นทันที" },
  { value: "invest", label: "นำไปลงทุนทั้งหมด" },
]

const STOCK_OPTIONS = [
  { symbol: "LH", dividendPercent: 11.54, beta: 0.94, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "RCL", dividendPercent: 9.71, beta: 1.21, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "SIRI", dividendPercent: 9.29, beta: 1.27, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "PTTEP", dividendPercent: 9.0, beta: 0.42, growth10Year: 34, avgGrowth10Year: 2.97 },
  { symbol: "KTB", dividendPercent: 8.88, beta: 0.44, growth10Year: 62, avgGrowth10Year: 4.94 },
  { symbol: "SPALI", dividendPercent: 8.48, beta: 0.93, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "QH", dividendPercent: 8.33, beta: 0.68, growth10Year: -49.22, avgGrowth10Year: -6.55 },
  { symbol: "SCBX", dividendPercent: 7.97, beta: 0.56, growth10Year: -9.42, avgGrowth10Year: -0.98 },
  { symbol: "PRM", dividendPercent: 7.44, beta: 0.87, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "TISCO", dividendPercent: 7.21, beta: 0.5, growth10Year: 91, avgGrowth10Year: 6.68 },
  { symbol: "PTT", dividendPercent: 7.15, beta: 0.69, growth10Year: -10.96, avgGrowth10Year: -1.15 },
  { symbol: "TTB", dividendPercent: 7.03, beta: 0.57, growth10Year: -6, avgGrowth10Year: -0.62 },
  { symbol: "AP", dividendPercent: 6.94, beta: 1.23, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "ITC", dividendPercent: 6.69, beta: 0, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "TCAP", dividendPercent: 6.57, beta: 0, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "KKP", dividendPercent: 6.47, beta: 1.14, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "TASCO", dividendPercent: 6.47, beta: 0.41, growth10Year: -24, avgGrowth10Year: -2.71 },
  { symbol: "HMPRO", dividendPercent: 6.26, beta: 1.06, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "WHAUP", dividendPercent: 6.19, beta: 0.77, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "WHA", dividendPercent: 5.85, beta: 1, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "RATCH", dividendPercent: 5.77, beta: 0.91, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "MEGA", dividendPercent: 5.42, beta: 0.71, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "BBL", dividendPercent: 5.36, beta: 0.59, growth10Year: -0.35, avgGrowth10Year: -0.04 },
  { symbol: "JMT", dividendPercent: 5.33, beta: 0, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "TOP", dividendPercent: 5.31, beta: 1.56, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "BAM", dividendPercent: 5.19, beta: 1.18, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "MK", dividendPercent: 4.73, beta: 1.96, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "KCE", dividendPercent: 4.71, beta: 1.3, growth10Year: 0, avgGrowth10Year: 0 },
  { symbol: "COM7", dividendPercent: 3.44, beta: 0, growth10Year: 0, avgGrowth10Year: 0 },
]

const DEFAULT_STOCK = STOCK_OPTIONS.find((stock) => stock.symbol === "KTB") ?? STOCK_OPTIONS[0]

const currency = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
})

const formatNumber = (value: number, digits = 2) =>
  Number.isFinite(value) ? value.toFixed(digits) : "–"

const PLAN_COLORS: Record<string, string> = {
  A: "#d97706",
  B: "#f43f5e",
  C: "#2563eb",
  D: "#8b5cf6",
}

export default function HousingPlanner() {
  const [loanAmount, setLoanAmount] = useState("5000000")
  const [interestRate, setInterestRate] = useState("3.5")
  const [basePayment, setBasePayment] = useState("20000")
  const [extraBudget, setExtraBudget] = useState("8000")
  const [startCash, setStartCash] = useState("100000")
  const [startCashUsage, setStartCashUsage] = useState<StartCashUsage>("none")
  const [stockGrowth, setStockGrowth] = useState(DEFAULT_STOCK.avgGrowth10Year.toString())
  const [dividendYield, setDividendYield] = useState(DEFAULT_STOCK.dividendPercent.toString())
  const [useDividends, setUseDividends] = useState(false)
  const [autoLiquidate, setAutoLiquidate] = useState(false)
  const [selectedStockSymbol, setSelectedStockSymbol] = useState(DEFAULT_STOCK.symbol)
  const [manualFocus, setManualFocus] = useState(false)
  const [focusedPlan, setFocusedPlan] = useState(PLAN_STRATEGIES[0].id)
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null)
  const scheduleRef = useRef<HTMLDivElement | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [lastSimulatedAt, setLastSimulatedAt] = useState<Date | null>(new Date())

  const numeric = (value: string, fallback = 0) => {
    const parsed = Number(value.replace(/,/g, ""))
    return Number.isFinite(parsed) ? parsed : fallback
  }

  const buildParams = (): BaseSimulationParams => ({
    loanAmount: numeric(loanAmount),
    interestRate: numeric(interestRate),
    basePayment: numeric(basePayment),
    extraBudget: numeric(extraBudget),
    startCash: numeric(startCash),
    startCashUsage,
    stockGrowth: numeric(stockGrowth),
    dividendYield: numeric(dividendYield),
    useDividendsForMortgage: useDividends,
    autoLiquidate,
  })

  const [appliedParams, setAppliedParams] = useState<BaseSimulationParams>(() => buildParams())
  const scrollToSchedule = () => {
    scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const handleStockSelection = (symbol: string) => {
    const option = STOCK_OPTIONS.find((stock) => stock.symbol === symbol)
    if (!option) return
    setSelectedStockSymbol(symbol)
    setDividendYield(option.dividendPercent.toString())
    setStockGrowth(option.avgGrowth10Year.toString())
  }

  const handleSimulate = () => {
    setIsSimulating(true)
    setAppliedParams(buildParams())
    setManualFocus(false)
    setLastSimulatedAt(new Date())
    setTimeout(() => setIsSimulating(false), 400)
  }

  const simulation = useMemo(
    () =>
      runSimulation({
        ...appliedParams,
        strategies: PLAN_STRATEGIES,
      }),
    [appliedParams],
  )

  useEffect(() => {
    if (!simulation.length) return
    if (!manualFocus) {
      setFocusedPlan(simulation[0].plan.id)
    } else if (!simulation.some((item) => item.plan.id === focusedPlan)) {
      setFocusedPlan(simulation[0].plan.id)
      setManualFocus(false)
    }
  }, [simulation, manualFocus, focusedPlan])

  useEffect(() => {
    if (!carouselApi) return
    const index = simulation.findIndex((item) => item.plan.id === focusedPlan)
    if (index >= 0) {
      carouselApi.scrollTo(index, true)
    }
  }, [carouselApi, focusedPlan, simulation])

  const focusedResult = simulation.find((item) => item.plan.id === focusedPlan)

  return (
    <div className="min-h-screen bg-neutral-50 px-3 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl space-y-12">
        <header className="space-y-4">
          <p className="text-base font-semibold text-gray-500">เครื่องมือวางแผนผ่อนบ้าน</p>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">จัดสมดุลการผ่อนบ้านกับการลงทุนของคุณ</h1>
              <p className="mt-3 text-lg text-gray-600">
                เปรียบเทียบ 4 กลยุทธ์ที่ผสมการโปะต้นและลงทุนหุ้น แล้วดูว่าเส้นทางไหนปลดหนี้ได้เร็วที่สุดพร้อมเหลือพอร์ตเท่าไหร่
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-500">งบชำระรวมต่อเดือน</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {currency.format(numeric(basePayment) + numeric(extraBudget))}
                </p>
                <p className="text-xs text-gray-500 mt-1">ค่างวดพื้นฐาน + เงินเพิ่มที่คุณตั้งใจจ่าย</p>
              </div>
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className={`w-full rounded-2xl px-4 py-4 text-sm font-semibold tracking-[0.2em] text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all ${
                  isSimulating
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-black hover:bg-gray-900 active:scale-[0.99]"
                }`}
                type="button"
              >
                {isSimulating ? "กำลังคำนวณ…" : "คำนวณแผน"}
              </button>
              <p className="text-xs text-gray-500" aria-live="polite">
                {isSimulating
                  ? "กำลังประมวลผลแผนชุดใหม่…"
                  : "ปรับค่าต่าง ๆ เลือกหุ้นปันผล แล้วกดคำนวณเพื่ออัปเดตผลทุกส่วน"}
              </p>
            </div>
          </div>
        </header>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
              <div>
                <p className="text-base font-semibold text-gray-500">แดชบอร์ดภาพรวม</p>
                <h2 className="text-3xl font-semibold text-gray-900">เห็นพฤติกรรมหนี้และพอร์ตตามเวลา</h2>
                <p className="text-sm text-gray-500">
                  ดูเส้นเงินกู้ มูลค่าพอร์ต และข้อมูลสรุปของแต่ละแผนที่อัปเดตด้วยสมมติฐานล่าสุด
                </p>
                {lastSimulatedAt && (
                  <p className="text-xs text-gray-400 mt-2">
                    คำนวณล่าสุด {lastSimulatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>

              <ComparisonChart data={simulation} />

              <Carousel opts={{ align: "start" }} className="w-full" setApi={setCarouselApi}>
                <CarouselContent className="-ml-4">
                  {simulation.map((result) => (
                    <CarouselItem key={result.plan.id} className="pl-4 basis-[70%] sm:basis-[55%] lg:basis-1/2">
                      <StrategyCard
                        result={result}
                        highlight={result.plan.id === focusedPlan}
                        onSelect={() => {
                          setFocusedPlan(result.plan.id)
                          setManualFocus(true)
                          scrollToSchedule()
                        }}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex" />
                <CarouselNext className="hidden sm:flex" />
              </Carousel>
            </div>

            <div ref={scheduleRef} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-6">
              <div>
                <p className="text-base font-semibold text-gray-500">ไทม์ไลน์การผ่อนละเอียด</p>
                <h2 className="text-2xl font-semibold text-gray-900 mt-2">ติดตามเงินเข้าออกในแต่ละเดือน</h2>
                <p className="text-sm text-gray-500">
                  เลือกแผนเพื่อดูรายละเอียดค่างวด ดอกเบี้ย เงินโปะ การลงทุน และพอร์ตที่เหลือแบบเดือนต่อเดือน
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {PLAN_STRATEGIES.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setFocusedPlan(plan.id)
                      setManualFocus(true)
                    }}
                    className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition-all ${
                      focusedPlan === plan.id
                        ? "border-black bg-black text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {plan.title}
                  </button>
                ))}
              </div>

              <DetailedSchedule result={focusedResult} />
            </div>
          </div>

          <div className="space-y-6 order-1 lg:order-2 lg:pl-6">
            <Card title="ข้อมูลเงินกู้">
              <InputField
                label="ยอดกู้"
                value={loanAmount}
                onChange={setLoanAmount}
                prefix="฿"
                hint="จำนวนเงินต้นที่ต้องการกู้หรือยอดหนี้คงเหลือที่ใช้จำลอง"
              />
              <InputField
                label="ดอกเบี้ยเฉลี่ยต่อปี (%)"
                value={interestRate}
                onChange={setInterestRate}
                suffix="%"
                hint="ใช้อัตราดอกเบี้ยเฉลี่ยของสัญญาหรืออัตราที่คาดว่าจะได้รับ"
              />
              <InputField
                label="ค่างวดตามธนาคาร"
                value={basePayment}
                onChange={setBasePayment}
                prefix="฿"
                hint="จำนวนเงินที่ต้องจ่ายขั้นต่ำในแต่ละเดือนตามสัญญาธนาคาร"
              />
            </Card>

            <Card title="กระแสเงินสด / เงินสำรอง">
              <InputField
                label="เงินเพิ่มต่อเดือน"
                value={extraBudget}
                onChange={setExtraBudget}
                prefix="฿"
                hint="งบที่พร้อมจ่ายเพิ่มทุกเดือน เพื่อนำไปโปะหนี้หรือแบ่งไปลงทุน"
              />
              <InputField
                label="เงินก้อนตั้งต้น"
                value={startCash}
                onChange={setStartCash}
                prefix="฿"
                hint="เงินสดที่มีอยู่ในวันเริ่มจำลอง เลือกว่าจะใช้โปะหนี้หรือลงทุน"
              />
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-500">ใช้เงินก้อนตั้งต้นอย่างไร</label>
                <div className="grid gap-2">
                  {START_CASH_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStartCashUsage(option.value)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all ${
                        startCashUsage === option.value
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            <Card title="สมมติฐานการลงทุน">
              <InputField
                label="การเติบโตหุ้นต่อปี (%)"
                value={stockGrowth}
                onChange={setStockGrowth}
                suffix="%"
                hint="คาดการณ์การเพิ่มขึ้นของราคาหุ้นแบบเฉลี่ยต่อปี ใช้สะสมพอร์ต"
              />
              <InputField
                label="อัตราปันผลต่อปี (%)"
                value={dividendYield}
                onChange={setDividendYield}
                suffix="%"
                hint="ใช้คำนวณเงินปันผลรายเดือนเพื่อนำไปลงทุนหรือโปะหนี้"
              />
              <ToggleRow
                label="ใช้เงินปันผลไปจ่ายหนี้"
                checked={useDividends}
                onChange={() => setUseDividends((prev) => !prev)}
              />
              <ToggleRow
                label="ปิดหนี้ทันทีเมื่อพอร์ตใหญ่พอ"
                checked={autoLiquidate}
                onChange={() => setAutoLiquidate((prev) => !prev)}
              />
            </Card>

            <Card title="หุ้นปันผลแนะนำ">
              <p className="text-sm text-gray-500">เลือกใช้ข้อมูลอัตราปันผลและการเติบโตของหุ้นไทยที่เหมาะกับแผนนี้ได้ทันที</p>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {STOCK_OPTIONS.map((stock) => (
                  <button
                    key={stock.symbol}
                    type="button"
                    onClick={() => handleStockSelection(stock.symbol)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                      selectedStockSymbol === stock.symbol
                        ? "border-black bg-black text-white"
                        : "border-gray-200 text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold tracking-wide">{stock.symbol}</p>
                        <p className="text-xs text-gray-500">β {stock.beta.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">ปันผล {stock.dividendPercent.toFixed(2)}%</p>
                        <p className="text-xs text-gray-500">
                          การเติบโตเฉลี่ย {stock.avgGrowth10Year >= 0 ? "+" : ""}
                          {stock.avgGrowth10Year.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">เมื่อเลือกหุ้น ระบบจะอัปเดตอัตราการเติบโตและปันผลให้อัตโนมัติ</p>
            </Card>
          </div>

        </section>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div>
        <p className="text-lg font-semibold text-gray-900">{title}</p>
      </div>
      <div className="space-y-6">{children}</div>
    </div>
  )
}

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  prefix?: string
  suffix?: string
  hint?: string
}) {
  return (
    <label className="space-y-0.5 text-sm font-medium text-gray-700 inline-flex w-full flex-col">
      <span className="flex items-center gap-2">
        {label}
        {hint && (
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-500 cursor-help"
            title={hint}
          >
            !
          </span>
        )}
      </span>
      <div className="relative pt-0.5 pb-0.5">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{prefix}</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base font-semibold text-gray-900 focus:border-black focus:bg-white focus:outline-none ${
            prefix ? "pl-9" : ""
          } ${suffix ? "pr-9" : ""}`}
          type="number"
          min="0"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{suffix}</span>}
      </div>
    </label>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
        checked ? "border-black bg-black text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"
      }`}
    >
      <span className="pr-6">{label}</span>
      <span
        className={`h-5 w-10 rounded-full border-2 transition-all ${
          checked ? "border-white bg-white" : "border-gray-300 bg-white"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-black transition-all ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  )
}

function StrategyCard({
  result,
  highlight,
  onSelect,
}: {
  result: SimulationResult
  highlight: boolean
  onSelect?: () => void
}) {
  const { plan, months, years, paidOff, portfolio, dividendIncome } = result

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full h-full text-left rounded-2xl border px-4 py-5 text-sm transition-all ${
        highlight
          ? "border-black bg-black text-white shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold text-gray-400">{plan.title}</p>
          <p className="text-base font-semibold mt-1 leading-snug">{plan.description}</p>
        </div>
        {highlight && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em]">
            <Zap className="h-3 w-3" />
            เร็วที่สุด
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <MetricLine
          label="เวลาปิดหนี้"
          value={paidOff ? `${months} เดือน` : "ยังปิดไม่หมดภายในช่วงจำลอง"}
          helper={paidOff && years ? `${formatNumber(years, 2)} ปี` : undefined}
          icon={<TrendingUp className="h-4 w-4" />}
          inverted={highlight}
        />
        <MetricLine
          label="พอร์ตคงเหลือ"
          value={currency.format(Math.max(0, portfolio))}
          helper={paidOff ? "หลังปิดหนี้แล้ว" : "หนี้ยังไม่ปิด"}
          icon={<DollarSign className="h-4 w-4" />}
          inverted={highlight}
        />
        <MetricLine
          label="คาดการณ์ปันผลต่อเดือน"
          value={currency.format(dividendIncome)}
          helper="อ้างอิงจากอัตราปันผลที่ตั้งไว้"
          icon={<DollarSign className="h-4 w-4" />}
          inverted={highlight}
        />
      </div>
    </button>
  )
}

function ComparisonChart({ data }: { data: SimulationResult[] }) {
  const merged = useMemo(() => {
    const longest = Math.max(...data.map((item) => item.history.length))
    const rows = []
    for (let i = 0; i < longest; i++) {
      const row: Record<string, number | null> = { month: i }
      data.forEach((item) => {
        const point = item.history[i]
        row[`${item.plan.id}_balance`] = point ? point.balance : null
        row[`${item.plan.id}_portfolio`] = point ? point.portfolio : null
      })
      rows.push(row)
    }
    return rows
  }, [data])

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-base font-semibold text-gray-500">ยอดหนี้เทียบเวลา</p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {PLAN_STRATEGIES.map((plan) => (
            <span key={plan.id} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: PLAN_COLORS[plan.id] }} />
              {plan.title}
            </span>
          ))}
          <span className="inline-flex items-center gap-2 text-gray-500">
            <span className="h-1.5 w-6 rounded-full border-2 border-dashed border-gray-500" />
            มูลค่าพอร์ต
          </span>
        </div>
      </div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ left: 0, right: 16, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tickFormatter={(val) => `${val}m`}
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              width={90}
              tickFormatter={(val) => `฿${Math.round(Number(val)).toLocaleString("en-US")}`}
              stroke="#9ca3af"
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              formatter={(value: number | null, name) => [
                typeof value === "number" ? currency.format(value) : "–",
                name.replace("_", " "),
              ]}br
              labelFormatter={(label) => `เดือน ${label}`}
            />
            {PLAN_STRATEGIES.map((plan) => (
              <Line
                key={`${plan.id}-balance`}
                type="monotone"
                dataKey={`${plan.id}_balance`}
                stroke={PLAN_COLORS[plan.id]}
                strokeWidth={2.2}
                dot={false}
                name={`${plan.title} - เงินกู้คงเหลือ`}
              />
            ))}
            {PLAN_STRATEGIES.filter((plan) => plan.investShare > 0).map((plan) => (
              <Line
                key={`${plan.id}-portfolio`}
                type="monotone"
                dataKey={`${plan.id}_portfolio`}
                stroke={PLAN_COLORS[plan.id]}
                strokeDasharray="5 5"
                strokeWidth={1.8}
                dot={false}
                name={`${plan.title} - พอร์ตลงทุน`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function DetailedSchedule({ result }: { result?: SimulationResult }) {
  const [rowLimit, setRowLimit] = useState(24)

  useEffect(() => {
    setRowLimit(24)
  }, [result?.plan.id])

  if (!result) {
    return <p className="text-sm text-gray-500">กดคำนวณแล้วเลือกแผนเพื่อดูรายละเอียดรายเดือน</p>
  }

  const totalMonths = Math.max(0, result.history.length - 1)
  const effectiveLimit = Math.min(rowLimit, totalMonths)
  const rows = result.history.slice(1, effectiveLimit + 1)
  const hasMore = effectiveLimit < totalMonths

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
        <p>
          <span className="font-semibold text-gray-900">{result.plan.title}</span>{" "}
          {result.paidOff ? `• ${result.months} เดือน (${formatNumber(result.months / 12, 2)} ปี)` : "• ยังปิดหนี้ไม่หมด"}
        </p>
        <p>
          มูลค่าพอร์ตที่เหลือ: <span className="font-semibold text-gray-900">{currency.format(result.portfolio)}</span>
        </p>
      </div>
      <div className="rounded-2xl border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
            <tr>
              <th className="px-3 py-2 text-left">เดือน</th>
              <th className="px-3 py-2 text-right">จ่ายให้ธนาคาร</th>
              <th className="px-3 py-2 text-right">ดอกเบี้ย</th>
              <th className="px-3 py-2 text-right">เข้าต้น</th>
              <th className="px-3 py-2 text-right">โปะเพิ่ม</th>
              <th className="px-3 py-2 text-right">ปันผลที่ใช้โปะ</th>
              <th className="px-3 py-2 text-right">ต้นคงเหลือ</th>
              <th className="px-3 py-2 text-right">เงินลง DCA</th>
              <th className="px-3 py-2 text-right">ปันผลที่ได้รับ</th>
              <th className="px-3 py-2 text-right">ใช้ลงทุนทั้งสิ้น</th>
              <th className="px-3 py-2 text-right">มูลค่าพอร์ต</th>
              <th className="px-3 py-2 text-right">ขายพอร์ตมาปิดหนี้</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((point) => (
              <tr key={point.month} className="border-t border-gray-100">
                <td className="px-3 py-2 font-semibold text-gray-900">#{point.month}</td>
                <td className="px-3 py-2 text-right">{currency.format(point.bankPayment)}</td>
                <td className="px-3 py-2 text-right text-gray-500">{currency.format(point.interestPaid)}</td>
                <td className="px-3 py-2 text-right">{currency.format(point.principalPaid)}</td>
                <td className="px-3 py-2 text-right text-emerald-600">
                  {point.extraPrincipal > 0 ? currency.format(point.extraPrincipal) : "—"}
                </td>
                <td className="px-3 py-2 text-right text-emerald-600">
                  {point.dividendApplied > 0 ? currency.format(point.dividendApplied) : "—"}
                </td>
                <td className="px-3 py-2 text-right font-semibold">{currency.format(point.balance)}</td>
                <td className="px-3 py-2 text-right text-sky-600">
                  {point.investContribution > 0 ? currency.format(point.investContribution) : "—"}
                </td>
                <td className="px-3 py-2 text-right text-amber-600">
                  {point.dividendEarned > 0 ? currency.format(point.dividendEarned) : "—"}
                </td>
                <td className="px-3 py-2 text-right text-fuchsia-600">
                  {point.investContribution + point.dividendEarned > 0
                    ? currency.format(point.investContribution + point.dividendEarned)
                    : "—"}
                </td>
                <td className="px-3 py-2 text-right">{currency.format(point.portfolio)}</td>
                <td className="px-3 py-2 text-right text-rose-600">
                  {point.portfolioLiquidation > 0 ? currency.format(point.portfolioLiquidation) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setRowLimit((prev) => prev + 24)}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400"
        >
          ดูเพิ่มอีก 24 เดือน
        </button>
      )}
      {!hasMore && (
        <p className="text-xs text-gray-400">
          แสดงครบทั้งหมด ({totalMonths} เดือน)
        </p>
      )}
    </div>
  )
}

function MetricLine({
  label,
  value,
  helper,
  icon,
  inverted = false,
}: {
  label: string
  value: string
  helper?: string
  icon: React.ReactNode
  inverted?: boolean
}) {
  const textMuted = inverted ? "text-white/70" : "text-gray-500"
  const textValue = inverted ? "text-white" : "text-gray-900"
  const iconBg = inverted ? "bg-white/15 text-white" : "bg-gray-100 text-gray-700"

  return (
    <div className="flex gap-3">
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${iconBg}`}>{icon}</span>
      <div className="space-y-0.5">
        <p className={`text-[10px] font-semibold tracking-[0.2em] ${textMuted}`}>{label}</p>
        <p className={`text-base font-semibold ${textValue}`}>{value}</p>
        {helper && <p className={`text-xs ${textMuted}`}>{helper}</p>}
      </div>
    </div>
  )
}
