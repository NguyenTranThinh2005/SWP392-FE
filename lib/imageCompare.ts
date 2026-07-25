import pixelmatch from 'pixelmatch'
import JSZip from 'jszip'
import { API_BASE_URL } from '@/lib/constants'

// Tải 1 ảnh từ URL hoặc base64 về dạng HTMLImageElement
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image: ' + url))
    img.src = url
  })
}

// Vẽ ảnh lên canvas với kích thước cố định -> lấy pixel data
function getImageData(img: HTMLImageElement, w: number, h: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

export interface CompareResult {
  diffPercent: number
  diffDataUrl: string
}

// So sánh 2 ảnh -> ra % khác + ảnh diff
export async function compareImages(urlA: string, urlB: string): Promise<CompareResult> {
  const [imgA, imgB] = await Promise.all([loadImage(urlA), loadImage(urlB)])

  const w = 800
  const h = 1200
  const dataA = getImageData(imgA, w, h)
  const dataB = getImageData(imgB, w, h)

  const diffCanvas = document.createElement('canvas')
  diffCanvas.width = w
  diffCanvas.height = h
  const diffCtx = diffCanvas.getContext('2d')!
  const diffData = diffCtx.createImageData(w, h)

  const numDiff = pixelmatch(dataA.data, dataB.data, diffData.data, w, h, { threshold: 0.1 })

  diffCtx.putImageData(diffData, 0, 0)

  return {
    diffPercent: Math.round((numDiff / (w * h)) * 100 * 100) / 100,
    diffDataUrl: diffCanvas.toDataURL()
  }
}

// Kiem tra file co phai anh khong (theo duoi)
function isImageName(name: string): boolean {
  const fileNameOnly = name.split('/').pop() || ''
  if (fileNameOnly.startsWith('._') || name.includes('__MACOSX')) return false
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name)
}

// Giai nen 1 zip tu URL -> tra ve danh sach { ten, dataUrl } cua cac anh, sort theo ten
export async function extractImagesFromZip(zipUrl: string, assetId?: string): Promise<{ name: string; dataUrl: string }[]> {
  if (!zipUrl) return []

  const urlsToTry: string[] = []
  if (zipUrl) urlsToTry.push(zipUrl)
  if (assetId) {
    const backendUrl = `${API_BASE_URL}/api/files/${assetId}`
    if (!urlsToTry.includes(backendUrl)) urlsToTry.push(backendUrl)
  }

  let res: Response | null = null
  for (const url of urlsToTry) {
    try {
      const r = await fetch(url)
      if (r.ok) {
        res = r
        break
      }
    } catch (e) {
      console.warn("Fetch failed for candidate URL:", url, e)
    }
  }

  if (!res || !res.ok) {
    console.error("Failed to fetch zip from all candidates:", urlsToTry)
    if (/\.zip(\?|$)/i.test(zipUrl)) return []
    return [{ name: 'image', dataUrl: zipUrl }]
  }

  const blob = await res.blob()

  try {
    const zip = await JSZip.loadAsync(blob)
    const entries = Object.values(zip.files)
      .filter(f => !f.dir && isImageName(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

    if (entries.length > 0) {
      const images: { name: string; dataUrl: string }[] = []
      for (const entry of entries) {
        const base64 = await entry.async('base64')
        const ext = entry.name.split('.').pop()?.toLowerCase() || ''
        let mime = 'image/jpeg'
        if (ext === 'png') mime = 'image/png'
        else if (ext === 'webp') mime = 'image/webp'
        else if (ext === 'gif') mime = 'image/gif'
        else if (ext === 'svg') mime = 'image/svg+xml'
        else if (ext === 'bmp') mime = 'image/bmp'
        images.push({ name: entry.name, dataUrl: `data:${mime};base64,${base64}` })
      }
      return images
    }
  } catch (zipErr) {
    console.warn("JSZip loadAsync failed:", zipErr)
  }

  if (/\.zip(\?|$)/i.test(zipUrl) || blob.type.includes('zip')) {
    return []
  }

  return [{ name: 'image', dataUrl: zipUrl }]
}

export interface PageCompareResult {
  index: number
  nameA?: string
  nameB?: string
  status: 'changed' | 'same' | 'added' | 'removed'
  oldDataUrl?: string
  newDataUrl?: string
  diffPercent?: number
  diffDataUrl?: string
}

export async function compareZips(
  zipUrlOld: string,
  zipUrlNew: string,
  assetIdOld?: string,
  assetIdNew?: string
): Promise<{
  pages: PageCompareResult[]
  avgDiffPercent: number
}> {
  const [imagesOld, imagesNew] = await Promise.all([
    extractImagesFromZip(zipUrlOld, assetIdOld),
    extractImagesFromZip(zipUrlNew, assetIdNew),
  ])

  const maxLen = Math.max(imagesOld.length, imagesNew.length)
  const pages: PageCompareResult[] = []
  let sumDiff = 0
  let comparedCount = 0

  for (let i = 0; i < maxLen; i++) {
    const oldImg = imagesOld[i]
    const newImg = imagesNew[i]

    if (oldImg && !newImg) {
      pages.push({ index: i, nameA: oldImg.name, status: 'removed', oldDataUrl: oldImg.dataUrl })
    } else if (!oldImg && newImg) {
      pages.push({ index: i, nameB: newImg.name, status: 'added', newDataUrl: newImg.dataUrl })
    } else if (oldImg && newImg) {
      const result = await compareImages(oldImg.dataUrl, newImg.dataUrl)
      sumDiff += result.diffPercent
      comparedCount++
      pages.push({
        index: i,
        nameA: oldImg.name,
        nameB: newImg.name,
        status: result.diffPercent > 0 ? 'changed' : 'same',
        diffPercent: result.diffPercent,
        diffDataUrl: result.diffDataUrl,
        oldDataUrl: oldImg.dataUrl,
        newDataUrl: newImg.dataUrl,
      })
    }
  }

  return {
    pages,
    avgDiffPercent: comparedCount > 0 ? Math.round((sumDiff / comparedCount) * 100) / 100 : 0,
  }
}

export async function compareAny(
  urlA: string,
  urlB: string,
  assetIdA?: string,
  assetIdB?: string
): Promise<{
  isZip: boolean
  diffPercent: number
  diffDataUrl?: string
  pages?: PageCompareResult[]
}> {
  const isZip = (u: string) => /\.zip(\?|$)/i.test(u)
  const aZip = isZip(urlA)
  const bZip = isZip(urlB)

  const [imagesA, imagesB] = await Promise.all([
    extractImagesFromZip(urlA, assetIdA),
    extractImagesFromZip(urlB, assetIdB)
  ])

  if (aZip || bZip || imagesA.length > 1 || imagesB.length > 1 || (imagesA.length > 0 && imagesB.length > 0)) {
    const maxLen = Math.max(imagesA.length, imagesB.length)
    if (maxLen === 0) {
      throw new Error("Could not extract images from the zip files. Please verify the uploaded zip files.")
    }
    const pages: PageCompareResult[] = []
    let sumDiff = 0
    let comparedCount = 0

    for (let i = 0; i < maxLen; i++) {
      const oldImg = imagesA[i]
      const newImg = imagesB[i]

      if (oldImg && !newImg) {
        pages.push({ index: i, nameA: oldImg.name, status: 'removed', oldDataUrl: oldImg.dataUrl })
      } else if (!oldImg && newImg) {
        pages.push({ index: i, nameB: newImg.name, status: 'added', newDataUrl: newImg.dataUrl })
      } else if (oldImg && newImg) {
        const result = await compareImages(oldImg.dataUrl, newImg.dataUrl)
        sumDiff += result.diffPercent
        comparedCount++
        pages.push({
          index: i,
          nameA: oldImg.name,
          nameB: newImg.name,
          status: result.diffPercent > 0 ? 'changed' : 'same',
          diffPercent: result.diffPercent,
          diffDataUrl: result.diffDataUrl,
          oldDataUrl: oldImg.dataUrl,
          newDataUrl: newImg.dataUrl,
        })
      }
    }

    return {
      isZip: true,
      diffPercent: comparedCount > 0 ? Math.round((sumDiff / comparedCount) * 100) / 100 : 0,
      pages
    }
  }

  const r = await compareImages(urlA, urlB)
  return { isZip: false, diffPercent: r.diffPercent, diffDataUrl: r.diffDataUrl }
}
