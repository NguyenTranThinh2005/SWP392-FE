'use client'
import { useState } from 'react'
import type { Annotation } from "@/types/manuscript"

interface Props {
    imageUrl: string
    pageNo: number
    annotations: Annotation[]
    onAddAnnotation: (pageNo: number, x: number, y: number, text: string) => Promise<void>
}

export function ImageCommentLayer({ imageUrl, pageNo, annotations, onAddAnnotation }: Props) {
    const [draft, setDraft] = useState<{ x: number, y: number, text: string } | null>(null)

    const handleImageClick = (event: React.MouseEvent<HTMLImageElement>) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        const y = (event.clientY - rect.top) / rect.height

        setDraft({ x, y, text: "" })
    }

    const handleSave = async () => {
        if (!draft || !draft.text.trim()) return

        await onAddAnnotation(pageNo, draft.x, draft.y, draft.text.trim())
        setDraft(null)
    }

    return (
        <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted">
            <img
                src={imageUrl}
                alt={`Page ${pageNo}`}
                className="block w-full select-none"
                onClick={handleImageClick}
            />

            {annotations
                .filter((annotation) => annotation.pageNo === pageNo)
                .map((annotation) => (
                    <div
                        key={annotation.id}
                        className="absolute z-10 -translate-x-1/2 -translate-y-full"
                        style={{
                            left: `${annotation.positionX * 100}%`,
                            top: `${annotation.positionY * 100}%`,
                        }}
                    >
                        <div className="h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow" />
                        <div className="mt-1 max-w-56 rounded-md border border-border bg-popover p-2 text-xs shadow-lg">
                            <p className="font-semibold text-foreground">{annotation.authorName || 'Reviewer'}</p>
                            <p className="text-muted-foreground">{annotation.text}</p>
                        </div>
                    </div>
                ))}

            {draft && (
                <div
                    className="absolute z-20 w-64 -translate-x-1/2"
                    style={{
                        left: `${draft.x * 100}%`,
                        top: `${draft.y * 100}%`,
                    }}
                >
                    <div className="h-4 w-4 rounded-full border-2 border-white bg-primary shadow" />
                    <div className="mt-2 rounded-md border border-border bg-popover p-2 shadow-lg">
                        <textarea
                            value={draft.text}
                            onChange={(event) => setDraft({ ...draft, text: event.target.value })}
                            className="min-h-20 w-full resize-none rounded border border-border bg-background p-2 text-sm outline-none"
                            placeholder="Comment..."
                            autoFocus
                        />
                        <div className="mt-2 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDraft(null)}
                                className="px-2 py-1 text-xs text-muted-foreground"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="rounded bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}
