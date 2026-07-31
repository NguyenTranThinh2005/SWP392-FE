import pixelmatch from 'pixelmatch'
import JSZip from 'jszip'
import { API_BASE_URL } from '@/lib/constants'
import { tokenService } from '@/services/tokenService'

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

export type ExtractedZipImages = ({ name: string; dataUrl: string })[] & { originalZipName?: string }

// Recursive helper to extract images from a ZIP Blob, including nested ZIP archives (e.g. backend wrapping submitted zip inside another zip)
async function extractImagesFromBlob(
  blob: Blob,
  depth = 0
): Promise<{ images: { name: string; dataUrl: string }[]; originalZipName?: string }> {
  if (depth > 3) return { images: [] }

  try {
    const zip = await JSZip.loadAsync(blob)
    const allFiles = Object.values(zip.files).filter((f) => !f.dir)

    // 1. Check for direct images in this zip archive
    const imageEntries = allFiles
      .filter((f) => isImageName(f.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

    if (imageEntries.length > 0) {
      const images: { name: string; dataUrl: string }[] = []
      for (const entry of imageEntries) {
        const base64 = await entry.async('base64')
        const ext = entry.name.split('.').pop()?.toLowerCase() || ''
        let mime = 'image/jpeg'
        if (ext === 'png') mime = 'image/png'
        else if (ext === 'webp') mime = 'image/webp'
        else if (ext === 'gif') mime = 'image/gif'
        else if (ext === 'svg') mime = 'image/svg+xml'
        else if (ext === 'bmp') mime = 'image/bmp'
        const cleanName = entry.name.split('/').pop()?.split('\\').pop() || entry.name
        images.push({ name: cleanName, dataUrl: `data:${mime};base64,${base64}` })
      }
      return { images }
    }

    // 2. If no direct images, check for nested .zip archives inside this archive (e.g. outer submission zip containing user's submitted zip)
    const zipEntries = allFiles
      .filter((f) => /\.zip$/i.test(f.name) && !f.name.startsWith('._') && !f.name.includes('__MACOSX'))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

    if (zipEntries.length > 0) {
      const nestedImages: { name: string; dataUrl: string }[] = []
      let detectedZipName: string | undefined = undefined

      for (const zipEntry of zipEntries) {
        try {
          const cleanZipName = zipEntry.name.split('/').pop()?.split('\\').pop()
          if (cleanZipName && !detectedZipName) {
            detectedZipName = cleanZipName
          }
          const nestedBlob = await zipEntry.async('blob')
          const res = await extractImagesFromBlob(nestedBlob, depth + 1)
          nestedImages.push(...res.images)
          if (res.originalZipName && !detectedZipName) {
            detectedZipName = res.originalZipName
          }
        } catch (nestedErr) {
          console.warn("Failed to extract nested zip entry:", zipEntry.name, nestedErr)
        }
      }
      return { images: nestedImages, originalZipName: detectedZipName }
    }
  } catch (zipErr) {
    console.warn("JSZip loadAsync failed on blob:", zipErr)
  }

  return { images: [] }
}

// Giai nen 1 zip tu URL -> tra ve danh sach { ten, dataUrl } cua cac anh, sort theo ten
export async function extractImagesFromZip(
  zipUrl: string,
  assetId?: string
): Promise<ExtractedZipImages> {
  if (!zipUrl && !assetId) return [] as any

  const urlsToTry: string[] = []
  if (zipUrl) urlsToTry.push(zipUrl)
  if (assetId) {
    const backendUrl =
      assetId.startsWith('http') || assetId.startsWith('/') ? assetId : `${API_BASE_URL}/api/files/${assetId}`
    if (!urlsToTry.includes(backendUrl)) urlsToTry.push(backendUrl)
  }

  const resolveActualFileBlob = async (targetUrl: string): Promise<Blob | null> => {
    try {
      const token = tokenService.getToken()
      const reqHeaders: Record<string, string> = {}
      if (token) {
        reqHeaders['Authorization'] = `Bearer ${token}`
      }

      let r = await fetch(targetUrl, { headers: reqHeaders })
      if (!r.ok && r.status === 401) {
        try {
          const newToken = await tokenService.getOrTriggerRefresh()
          if (newToken) {
            reqHeaders['Authorization'] = `Bearer ${newToken}`
            r = await fetch(targetUrl, { headers: reqHeaders })
          }
        } catch { }
      }

      if (!r.ok) return null

      const contentType = r.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const json = await r.json()
        const actualUrl =
          json?.data?.publicUrl || json?.publicUrl || json?.data?.fileUrl || json?.url || json?.data?.url
        if (actualUrl) {
          const fullUrl = actualUrl.startsWith('http')
            ? actualUrl
            : `${API_BASE_URL}${actualUrl.startsWith('/') ? '' : '/'}${actualUrl}`
          const binaryRes = await fetch(fullUrl, { headers: reqHeaders })
          if (binaryRes.ok) {
            return await binaryRes.blob()
          }
        }
        return null
      }

      return await r.blob()
    } catch (e) {
      console.warn("resolveActualFileBlob failed for:", targetUrl, e)
      return null
    }
  }

  let blob: Blob | null = null
  for (const url of urlsToTry) {
    blob = await resolveActualFileBlob(url)
    if (blob) break
  }

  if (!blob) {
    console.error("Failed to fetch zip blob from candidate URLs:", urlsToTry)
    const result: ExtractedZipImages = [{ name: 'image', dataUrl: zipUrl }] as any
    return result
  }

  const extracted = await extractImagesFromBlob(blob)
  if (extracted.images.length > 0) {
    const result: ExtractedZipImages = extracted.images as any
    if (extracted.originalZipName) {
      result.originalZipName = extracted.originalZipName
    }
    return result
  }

  if (/\.zip(\?|$)/i.test(zipUrl) || blob.type.includes('zip')) {
    return [] as any
  }

  const result: ExtractedZipImages = [{ name: 'image', dataUrl: zipUrl }] as any
  return result
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
