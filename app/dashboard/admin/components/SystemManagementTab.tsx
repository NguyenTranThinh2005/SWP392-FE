'use client'

import { useState } from 'react'
import { Layers, Search, Plus, Edit3, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { systemService, type GenreResponse } from '@/services/systemService'

interface SystemManagementTabProps {
  genresList: GenreResponse[]
  systemLoading: boolean
  onRefresh: () => void
}

export default function SystemManagementTab({
  genresList,
  systemLoading,
  onRefresh
}: SystemManagementTabProps) {
  const [genreSearch, setGenreSearch] = useState('')
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false)
  const [editingGenre, setEditingGenre] = useState<GenreResponse | null>(null)
  const [formGenreTitle, setFormGenreTitle] = useState('')

  const handleGenreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formGenreTitle.trim()) {
      toast.error('Vui lòng nhập tên thể loại!')
      return
    }

    try {
      if (editingGenre) {
        await systemService.updateGenre(editingGenre.genreId, formGenreTitle.trim())
        toast.success(`Đã cập nhật thể loại thành công!`)
      } else {
        await systemService.createGenre(formGenreTitle.trim())
        toast.success(`Đã tạo thể loại "${formGenreTitle}" thành công!`)
      }
      setIsGenreModalOpen(false)
      setEditingGenre(null)
      setFormGenreTitle('')
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thể loại thất bại.')
    }
  }

  const handleDeleteGenre = async (genreId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa thể loại "${title}" không?`)) return
    try {
      await systemService.deleteGenre(genreId)
      toast.success(`Đã xóa thể loại "${title}" thành công!`)
      onRefresh()
    } catch (err: any) {
      toast.error(err.message || 'Xóa thể loại thất bại.')
    }
  }

  const filteredGenres = genresList.filter(g =>
    g.title.toLowerCase().includes(genreSearch.toLowerCase())
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Genres Management Card */}
      <Card className="p-6 bg-card border border-border rounded-xl shadow-sm flex flex-col space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Quản lý Thể loại</h2>
              <p className="text-xs text-muted-foreground">Cấu hình thể loại manga</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingGenre(null)
              setFormGenreTitle('')
              setIsGenreModalOpen(true)
            }}
            className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm thể loại
          </Button>
        </div>

        {/* Search Genres */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
          <input
            type="text"
            placeholder="Tìm kiếm thể loại..."
            value={genreSearch}
            onChange={(e) => setGenreSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-muted/50 border border-border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Genres Table */}
        <div className="border border-border/80 rounded-xl overflow-hidden bg-muted/10 max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border">
              <TableRow>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground">Tên Thể loại</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground w-1/4">Trạng thái</TableHead>
                <TableHead className="font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-center w-24">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {systemLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="p-8 text-center text-xs text-muted-foreground">
                    Đang tải dữ liệu...
                  </TableCell>
                </TableRow>
              ) : filteredGenres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="p-8 text-center text-xs text-muted-foreground italic">
                    Không tìm thấy thể loại nào.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGenres.map((g) => (
                  <TableRow key={g.genreId} className="border-b border-border hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-xs text-foreground py-3">{g.title}</TableCell>
                    <TableCell className="py-3">
                      {g.deletedAt ? (
                        <Badge className="bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Đã ẩn (Deleted)
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          Kích hoạt (Active)
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingGenre(g)
                            setFormGenreTitle(g.title)
                            setIsGenreModalOpen(true)
                          }}
                          className="p-1.5 hover:bg-muted border border-transparent hover:border-border rounded-lg text-slate-400 hover:text-foreground transition-all cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteGenre(g.genreId, g.title)}
                          className="p-1.5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                          title="Xóa"
                          disabled={g.deletedAt !== null}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Genre Add/Edit Dialog Modal */}
      <Dialog open={isGenreModalOpen} onOpenChange={(open) => !open && setIsGenreModalOpen(false)}>
        <DialogContent className="bg-card border border-border rounded-xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-500" />
              {editingGenre ? `Cập nhật thể loại "${editingGenre.title}"` : 'Thêm thể loại mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleGenreSubmit} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Tên thể loại <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Comedy, Isekai..."
                value={formGenreTitle}
                onChange={(e) => setFormGenreTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-muted/65 border border-border rounded-xl text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:border-primary/50"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <Button
                type="button"
                onClick={() => setIsGenreModalOpen(false)}
                variant="outline"
                className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold rounded-xl cursor-pointer"
              >
                {editingGenre ? 'Lưu thay đổi' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
