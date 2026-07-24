'use client'
import { useEffect, useState, useMemo } from 'react'
import { salaryService, type SalaryRecord } from '@/services/salaryService'
import { formatVND } from '@/lib/salary'
import * as XLSX from 'xlsx'

function monthKey(dateStr?: string): string {
  if (!dateStr) return 'unknown'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(key: string): string {
  if (key === 'unknown') return 'Không rõ tháng'
  const [y, m] = key.split('-')
  return `Tháng ${m}/${y}`
}

export default function SalaryPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()))
  const [selectedMonthNum, setSelectedMonthNum] = useState<string>('all')
  useEffect(() => {
    salaryService.getSalaryRecords().then(setRecords).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const list = records.filter(r => {
      const key = monthKey(r.approvedAt)
      if (key === 'unknown') return false
      const [y, m] = key.split('-')
      if (y !== selectedYear) return false
      if (selectedMonthNum !== 'all' && m !== selectedMonthNum) return false
      return true
    })
    return [...list].sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime())
  }, [records, selectedYear, selectedMonthNum])

  const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0)
  const exportExcel = () => {
    if (filtered.length === 0) return
    const rows = filtered.map(r => ({
      Assistant: r.assistantName || 'Assistant',
      'Task Type': r.taskType || '',
      'Page Range': `${r.pageStart}-${r.pageEnd}`,
      'Pages Count': r.pages,
      'Rate per Page': r.rateAtApproval,
      'Total Amount': r.amount,
      'Approval Date': r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('en-US') : '',
    }))
    rows.push({
      Assistant: 'TOTAL', 'Task Type': '', 'Page Range': '', 'Pages Count': '' as any,
      'Rate per Page': '' as any, 'Total Amount': total, 'Approval Date': '',
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Salary')
    const period = selectedMonthNum === 'all' ? selectedYear : `${selectedYear}-${selectedMonthNum}`
    XLSX.writeFile(wb, `salary-${period}.xlsx`)
  }
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Salary History</h1>
        <p className="text-sm text-muted-foreground">Salary recorded when the task is approved. Settled monthly.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">Period:</span>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {[0, 1, 2].map((offset) => {
            const y = String(new Date().getFullYear() - 1 + offset)
            return <option key={y} value={y}>{y}</option>
          })}
        </select>
        <select
          value={selectedMonthNum}
          onChange={(e) => setSelectedMonthNum(e.target.value)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All months</option>
          {Array.from({ length: 12 }, (_, i) => {
            const mm = String(i + 1).padStart(2, '0')
            const label = new Date(2000, i).toLocaleDateString('en-US', { month: 'long' })
            return <option key={mm} value={mm}>{label}</option>
          })}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
         {selectedMonthNum === 'all' ? `Total ${selectedYear}` : `Total ${new Date(2000, Number(selectedMonthNum) - 1).toLocaleDateString('en-US', { month: 'long' })} ${selectedYear}`}
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold text-green-600">{formatVND(total)}</span>
            <button
              type="button"
              onClick={exportExcel}
              disabled={filtered.length === 0}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
            >
              Export Excel
            </button>
          </div>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No salary records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-bold">Assistant</th>
                  <th className="py-2 font-bold">Task Type</th>
                  <th className="py-2 font-bold text-center">Pages</th>
                  <th className="py-2 font-bold text-center">Pages Count</th>
                  <th className="py-2 font-bold text-right">Rate</th>
                  <th className="py-2 font-bold text-right">Total Amount</th>
                  <th className="py-2 font-bold text-right">Approval Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.salaryRecordId} className="border-b border-border/50">
                    <td className="py-2 font-semibold">{r.assistantName || 'Assistant'}</td>
                    <td className="py-2">{r.taskType || '—'}</td>
                    <td className="py-2 text-center">{r.pageStart}–{r.pageEnd}</td>
                    <td className="py-2 text-center">{r.pages}</td>
                    <td className="py-2 text-right">{formatVND(r.rateAtApproval)}</td>
                    <td className="py-2 text-right font-bold">{formatVND(r.amount)}</td>
                    <td className="py-2 text-right text-muted-foreground">{r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('en-US') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}