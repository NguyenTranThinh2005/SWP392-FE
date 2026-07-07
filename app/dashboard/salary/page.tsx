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
        <h1 className="text-xl font-bold text-foreground">Lịch sử lương</h1>
        <p className="text-sm text-muted-foreground">Lương đã ghi nhận khi task được duyệt.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold">Tổng đã nhận</span>
          <span className="text-lg font-extrabold text-green-600">{formatVND(total)}</span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Đang tải...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Chưa có bản ghi lương nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 font-bold">Trợ lý</th>
                  <th className="py-2 font-bold">Loại task</th>
                  <th className="py-2 font-bold text-center">Trang</th>
                  <th className="py-2 font-bold text-center">Số trang</th>
                  <th className="py-2 font-bold text-right">Đơn giá</th>
                  <th className="py-2 font-bold text-right">Thành tiền</th>
                  <th className="py-2 font-bold text-right">Ngày duyệt</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.salaryRecordId} className="border-b border-border/50">
                    <td className="py-2 font-semibold">{r.assistantName || 'Trợ lý'}</td>
                    <td className="py-2">{r.taskType || '—'}</td>
                    <td className="py-2 text-center">{r.pageStart}–{r.pageEnd}</td>
                    <td className="py-2 text-center">{r.pages}</td>
                    <td className="py-2 text-right">{formatVND(r.rateAtApproval)}</td>
                    <td className="py-2 text-right font-bold">{formatVND(r.amount)}</td>
                    <td className="py-2 text-right text-muted-foreground">
                      {r.approvedAt ? new Date(r.approvedAt).toLocaleDateString('vi-VN') : '—'}
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