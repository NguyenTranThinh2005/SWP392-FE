'use client'
import { useEffect, useState, useMemo } from 'react'
import { salaryService, type SalaryRecord } from '@/services/salaryService'
import { formatVND } from '@/lib/salary'

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
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  useEffect(() => {
    salaryService.getSalaryRecords().then(setRecords).finally(() => setLoading(false))
  }, [])

  const months = useMemo(() => {
    const set = new Set(records.map(r => monthKey(r.approvedAt)))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [records])

  const filtered = useMemo(() => {
    const list = selectedMonth === 'all' ? records : records.filter(r => monthKey(r.approvedAt) === selectedMonth)
    return [...list].sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime())
  }, [records, selectedMonth])

  const total = filtered.reduce((sum, r) => sum + (r.amount || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Salary History</h1>
        <p className="text-sm text-muted-foreground">Salary recorded when the task is approved. Settled monthly.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">Month:</span>
        <button onClick={() => setSelectedMonth('all')} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedMonth === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}>All</button>
        {months.map(m => (
          <button key={m} onClick={() => setSelectedMonth(m)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${selectedMonth === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}>{monthLabel(m)}</button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold">{selectedMonth === 'all' ? 'Total (all months)' : `Total ${monthLabel(selectedMonth)}`}</span>
          <span className="text-lg font-extrabold text-green-600">{formatVND(total)}</span>
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