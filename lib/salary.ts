import { Task } from './chapters-store'

// Don gia luong theo loai task (VND / trang)
export const TASK_RATES: Record<string, number> = {
  'Line Art': 40000,
  'Coloring': 60000,
  'Background Art': 50000,
  'Screentoning': 45000,
  'Clean-up': 30000,
}
const DEFAULT_RATE = 35000

function getTaskPageCount(task: Task): number {
  const start = task.pageStart ?? 0
  const end = task.pageEnd ?? 0
  const count = end - start + 1
  return count > 0 ? count : 0
}

export function getRate(taskType?: string): number {
  if (!taskType) return DEFAULT_RATE
  return TASK_RATES[taskType] ?? DEFAULT_RATE
}

export function calcTaskSalary(task: Task): number {
  if (task.status !== 'Approved') return 0
  const rate = task.ratePerPage && task.ratePerPage > 0 ? task.ratePerPage : getRate(task.type)
  return getTaskPageCount(task) * rate
}

export function calcTotalSalary(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + calcTaskSalary(t), 0)
}

export function formatVND(amount: number): string {
  return amount.toLocaleString('en-US') + ' ₫'
}

// Chi tiet luong tung task (chi task Approved)
export interface SalaryRow {
  taskId: string
  type: string
  pages: number
  rate: number
  amount: number
}

export function getSalaryBreakdown(tasks: Task[]): SalaryRow[] {
  return tasks
    .filter(t => t.status === 'Approved')
    .map(t => {
      const pages = Math.max((t.pageEnd ?? 0) - (t.pageStart ?? 0) + 1, 0)
      const rate = t.ratePerPage && t.ratePerPage > 0 ? t.ratePerPage : getRate(t.type)
      return { taskId: t.id, type: t.type || 'Other', pages, rate, amount: pages * rate }
    })
}

// Gom luong theo tung assistant (chi task Approved)
export interface AssistantSalary {
  assistantName: string
  taskCount: number
  totalPages: number
  amount: number
}

export function getSalaryByAssistant(tasks: Task[]): AssistantSalary[] {
  const map = new Map<string, AssistantSalary>()
  tasks.filter(t => t.status === 'Approved').forEach(t => {
    const name = t.assistantName || 'Assistant'
    const pages = Math.max((t.pageEnd ?? 0) - (t.pageStart ?? 0) + 1, 0)
    const amount = pages * (t.ratePerPage && t.ratePerPage > 0 ? t.ratePerPage : getRate(t.type))
    const cur = map.get(name) || { assistantName: name, taskCount: 0, totalPages: 0, amount: 0 }
    cur.taskCount += 1
    cur.totalPages += pages
    cur.amount += amount
    map.set(name, cur)
  })
  return Array.from(map.values())
}