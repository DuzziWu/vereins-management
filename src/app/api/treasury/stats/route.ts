import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/treasury/stats - Kassenstand und Statistiken
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is Vorstand
  const { data: isVorstand } = await supabase.rpc('is_vorstand')
  if (!isVorstand) {
    return NextResponse.json({ error: 'Forbidden: Vorstand access required' }, { status: 403 })
  }

  // Parse query parameters for period filter
  const searchParams = request.nextUrl.searchParams
  const dateFrom = searchParams.get('date_from')
  const dateTo = searchParams.get('date_to')
  const showPayments = searchParams.get('show_payments') === 'true'

  // 1. Kassenstand (Gesamtsumme aller nicht-gelöschten Buchungen)
  const { data: totalBalance, error: balanceError } = await supabase.rpc('get_treasury_balance')

  if (balanceError) {
    // Fallback: Berechne manuell
    console.error('Error fetching balance via RPC, using fallback:', balanceError)
  }

  // 2. Einnahmen und Ausgaben im Zeitraum
  let incomeQuery = supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'income')
    .eq('is_deleted', false)

  let expenseQuery = supabase
    .from('transactions')
    .select('amount')
    .eq('type', 'expense')
    .eq('is_deleted', false)

  if (dateFrom) {
    incomeQuery = incomeQuery.gte('transaction_date', dateFrom)
    expenseQuery = expenseQuery.gte('transaction_date', dateFrom)
  }
  if (dateTo) {
    incomeQuery = incomeQuery.lte('transaction_date', dateTo)
    expenseQuery = expenseQuery.lte('transaction_date', dateTo)
  }

  const [incomeResult, expenseResult] = await Promise.all([
    incomeQuery,
    expenseQuery,
  ])

  if (incomeResult.error || expenseResult.error) {
    console.error('Error fetching stats:', incomeResult.error, expenseResult.error)
    return NextResponse.json({ error: 'Error fetching statistics' }, { status: 500 })
  }

  let periodIncome = (incomeResult.data || []).reduce(
    (sum, t) => sum + Number(t.amount), 0
  )
  const periodExpense = (expenseResult.data || []).reduce(
    (sum, t) => sum + Number(t.amount), 0
  )

  // 3. Gesamtbilanz berechnen (falls RPC nicht verfügbar)
  let balance = totalBalance
  if (balance === null || balance === undefined) {
    // Fallback: manuell berechnen
    const { data: allIncome } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'income')
      .eq('is_deleted', false)

    const { data: allExpense } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'expense')
      .eq('is_deleted', false)

    const totalIncome = (allIncome || []).reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpense = (allExpense || []).reduce((sum, t) => sum + Number(t.amount), 0)
    balance = totalIncome - totalExpense
  }

  // 4. Ausgaben nach Kategorie im Zeitraum
  let categoryQuery = supabase
    .from('transactions')
    .select(`
      amount,
      type,
      category:transaction_categories (
        id,
        name,
        icon,
        color
      )
    `)
    .eq('is_deleted', false)

  if (dateFrom) {
    categoryQuery = categoryQuery.gte('transaction_date', dateFrom)
  }
  if (dateTo) {
    categoryQuery = categoryQuery.lte('transaction_date', dateTo)
  }

  const { data: categoryData } = await categoryQuery

  // Gruppiere nach Kategorie und Typ
  const categoryBreakdown: Record<string, {
    category_id: string
    name: string
    icon: string | null
    color: string | null
    type: string
    total: number
    count: number
  }> = {}

  for (const t of categoryData || []) {
    const cat = t.category as { id: string; name: string; icon: string | null; color: string | null } | null
    const key = cat ? `${cat.id}_${t.type}` : `uncategorized_${t.type}`
    if (!categoryBreakdown[key]) {
      categoryBreakdown[key] = {
        category_id: cat?.id || 'uncategorized',
        name: cat?.name || 'Ohne Kategorie',
        icon: cat?.icon || null,
        color: cat?.color || null,
        type: t.type,
        total: 0,
        count: 0,
      }
    }
    categoryBreakdown[key].total += Number(t.amount)
    categoryBreakdown[key].count += 1
  }

  // 5. Monthly breakdown for the current year (for bar chart)
  const currentYear = new Date().getFullYear()
  const previousYear = currentYear - 1

  const { data: monthlyData } = await supabase
    .from('transactions')
    .select('amount, type, transaction_date')
    .eq('is_deleted', false)
    .gte('transaction_date', `${previousYear}-01-01`)
    .lte('transaction_date', `${currentYear}-12-31`)

  // Group by year and month
  const monthlyBreakdown: Record<string, { month: number; year: number; income: number; expense: number }> = {}

  for (const t of monthlyData || []) {
    const date = new Date(t.transaction_date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 1-indexed
    const key = `${year}-${String(month).padStart(2, '0')}`
    if (!monthlyBreakdown[key]) {
      monthlyBreakdown[key] = { month, year, income: 0, expense: 0 }
    }
    if (t.type === 'income') {
      monthlyBreakdown[key].income += Number(t.amount)
    } else {
      monthlyBreakdown[key].expense += Number(t.amount)
    }
  }

  // Fill in missing months for current year
  for (let m = 1; m <= 12; m++) {
    const key = `${currentYear}-${String(m).padStart(2, '0')}`
    if (!monthlyBreakdown[key]) {
      monthlyBreakdown[key] = { month: m, year: currentYear, income: 0, expense: 0 }
    }
  }

  // Sort by key (year-month)
  const sortedMonthly = Object.entries(monthlyBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v)

  // 6. Include payment data if requested
  if (showPayments) {
    // Look up "Mitgliedsbeiträge" system category
    const { data: systemCat } = await supabase
      .from('transaction_categories')
      .select('id')
      .eq('name', 'Mitgliedsbeiträge')
      .eq('type', 'income')
      .eq('is_system', true)
      .single()
    const systemCategoryId = systemCat?.id || 'payments'

    // Total non-cancelled payments (for balance)
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('is_cancelled', false)

    const totalPaymentAmount = (allPayments || []).reduce((sum, p) => sum + Number(p.amount), 0)
    balance = Number(balance) + totalPaymentAmount

    // Payments in period (for periodIncome)
    let periodPaymentQuery = supabase
      .from('payments')
      .select('amount')
      .eq('is_cancelled', false)

    if (dateFrom) periodPaymentQuery = periodPaymentQuery.gte('payment_date', dateFrom)
    if (dateTo) periodPaymentQuery = periodPaymentQuery.lte('payment_date', dateTo)

    const { data: periodPayments } = await periodPaymentQuery
    const periodPaymentTotal = (periodPayments || []).reduce((sum, p) => sum + Number(p.amount), 0)
    const periodPaymentCount = (periodPayments || []).length

    periodIncome += periodPaymentTotal

    // Payments for monthly breakdown
    const { data: monthlyPayments } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('is_cancelled', false)
      .gte('payment_date', `${previousYear}-01-01`)
      .lte('payment_date', `${currentYear}-12-31`)

    for (const p of monthlyPayments || []) {
      const date = new Date(p.payment_date)
      const pYear = date.getFullYear()
      const pMonth = date.getMonth() + 1
      const key = `${pYear}-${String(pMonth).padStart(2, '0')}`
      const existing = sortedMonthly.find((m) => m.year === pYear && m.month === pMonth)
      if (existing) {
        existing.income += Number(p.amount)
      }
    }

    // Add Mitgliedsbeiträge to category breakdown
    const beitraegeKey = `${systemCategoryId}_income`
    if (!categoryBreakdown[beitraegeKey]) {
      categoryBreakdown[beitraegeKey] = {
        category_id: systemCategoryId,
        name: 'Mitgliedsbeiträge',
        icon: 'users',
        color: null,
        type: 'income',
        total: 0,
        count: 0,
      }
    }
    categoryBreakdown[beitraegeKey].total += periodPaymentTotal
    categoryBreakdown[beitraegeKey].count += periodPaymentCount
  }

  return NextResponse.json({
    balance: Number(balance),
    period: {
      income: periodIncome,
      expense: periodExpense,
      difference: periodIncome - periodExpense,
      date_from: dateFrom,
      date_to: dateTo,
    },
    category_breakdown: Object.values(categoryBreakdown),
    monthly_breakdown: sortedMonthly,
  })
}
