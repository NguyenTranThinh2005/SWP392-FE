'use client'
import { useState } from 'react'
import type { Annotation } from "@/types/manuscript"

interface Props {
    imageUrl: string
    pageNo: number
    annotations: Annotation[]
    onAddAnnotation?: (pageNo: number, x: number, y: number, text: string) => Promise<void>
    readOnly?: boolean
}

export function ImageCommentLayer({ imageUrl, pageNo, annotations, onAddAnnotation, readOnly = false }: Props) {
    const [draft, setDraft] = useState<{ x: number, y: number, text: string } | null>(null)

    const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
        if (readOnly) return
        const rect = event.currentTarget.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        const y = (event.clientY - rect.top) / rect.height

        setDraft({ x, y, text: "" })
    }

    const handleSave = async () => {
        if (readOnly || !onAddAnnotation || !draft || !draft.text.trim()) return

        await onAddAnnotation(pageNo, draft.x, draft.y, draft.text.trim())
        setDraft(null)
    }

    const filteredAnnotations = annotations.filter((annotation) => annotation.pageNo === pageNo)

    return (
        <div className="w-full space-y-4">
            {/* Image Container with Pins */}
            <div className="relative w-full overflow-hidden rounded-xl bg-muted">
                <img
                    src={imageUrl}
                    alt={`Page ${pageNo}`}
                    className={`block w-full select-none ${readOnly ? '' : 'cursor-crosshair'}`}
                    onClick={handleImageClick}
                />

                {/* Saved Pins on Image */}
                {filteredAnnotations.map((annotation, index) => (
                    <div
                        key={annotation.id}
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group"
                        style={{
                            left: `${annotation.positionX * 100}%`,
                            top: `${annotation.positionY * 100}%`,
                        }}
                    >
                        <div className="h-5 w-5 rounded-full border-2 border-white bg-red-500 shadow flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:scale-110 transition-transform">
                            {index + 1}
                        </div>
                        {/* Hover Tooltip */}
                        <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 hidden group-hover:block z-30 w-48 bg-black/95 text-white p-2 rounded-lg text-[10px] shadow-lg pointer-events-none whitespace-normal">
                            <p className="font-bold border-b border-white/20 pb-0.5 mb-1">{annotation.authorName || 'Reviewer'}</p>
                            <p className="leading-snug">{annotation.text}</p>
                        </div>
                    </div>
                ))}

                {/* Draft Pin on Image */}
                {!readOnly && draft && (
                    <div
                        className="absolute z-20 -translate-x-1/2 -translate-y-1/2 animate-bounce"
                        style={{
                            left: `${draft.x * 100}%`,
                            top: `${draft.y * 100}%`,
                        }}
                    >
                        <div className="h-5 w-5 rounded-full border-2 border-white bg-primary shadow flex items-center justify-center text-[10px] font-bold text-white">
                            +
                        </div>
                    </div>
                )}
            </div>

            {/* Comment Input Box (Rigidly below the image) */}
            {!readOnly && draft && (
                <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            Thêm chú thích tại điểm đã chọn
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                            (x: {Math.round(draft.x * 100)}%, y: {Math.round(draft.y * 100)}%)
                        </span>
                    </div>
                    <textarea
                        value={draft.text}
                        onChange={(event) => setDraft({ ...draft, text: event.target.value })}
                        className="min-h-[80px] w-full resize-none rounded-xl border border-border bg-muted/40 p-3 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground"
                        placeholder="Nhập nội dung ghi chú chỉnh sửa ở đây..."
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setDraft(null)}
                            className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            Lưu ghi chú
                        </button>
                    </div>
                </div>
            )}

            {/* List of annotations below the image */}
            {filteredAnnotations.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        Danh sách ghi chú ({filteredAnnotations.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {filteredAnnotations.map((annotation, index) => (
                            <div key={annotation.id} className="flex gap-2.5 p-2.5 bg-muted/30 border border-border/50 rounded-xl text-xs hover:bg-muted/50 transition-colors">
                                <span className="h-5 w-5 rounded-full bg-red-500 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                                    {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="font-bold text-foreground truncate">{annotation.authorName || 'Reviewer'}</span>
                                        <span className="text-[9px] text-muted-foreground shrink-0">{new Date(annotation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{annotation.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
