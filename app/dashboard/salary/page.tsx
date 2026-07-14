'use client'

import { useEffect, useState } from 'react'
import { salaryService, type SalaryRecord } from '@/services/salaryService'
import { formatVND } from '@/lib/salary'

export default function SalaryPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    salaryService.getSalaryRecords()
      .then(setRecords)
      .finally(() => setLoading(false))
  }, [])

  const total = records.reduce((sum, r) => sum + (r.amount || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Salary History</h1>
        <p className="text-sm text-muted-foreground">Salary recorded when the task is approved.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold">Total Received</span>
          <span className="text-lg font-extrabold text-green-600">{formatVND(total)}</span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
        ) : records.length === 0 ? (
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
                {records.map((r) => (
                  <tr key={r.salaryRecordId} className="border-b border-border/50">
                    <td className="py-2 font-semibold">{r.assistantName || 'Assistant'}</td>
                    <td className="py-2">{r.taskType || '—'}</td>
                    <td className="py-2 text-center">{r.pageStart}–{r.pageEnd}</td>
                    <td className="py-2 text-center">{r.pages}</td>
                    <td className="py-2 text-right">{formatVND(r.rateAtApproval)}</td>
                    <td className="py-2 text-right font-bold">{formatVND(r.amount)}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('en-US') : '—'}
                    </td>
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