import pixelmatch from 'pixelmatch'

// Tải 1 ảnh từ URL về dạng có thể đọc pixel
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // cho phep canvas doc pixel anh tu domain khac
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Không tải được ảnh: ' + url))
    img.src = url
  })
}

// Vẽ ảnh lên canvas với kích thước cố định -> lấy pixel data
function getImageData(img: HTMLImageElement, w: number, h: number): ImageData {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h) // resize ve cung kich thuoc
  return ctx.getImageData(0, 0, w, h)
}

export interface CompareResult {
  diffPercent: number      // % pixel khac biet
  diffDataUrl: string      // anh diff (vung khac to do) dang base64 de hien
}

// So sánh 2 ảnh -> ra % khác + ảnh diff
export async function compareImages(urlA: string, urlB: string): Promise<CompareResult> {
  const [imgA, imgB] = await Promise.all([loadImage(urlA), loadImage(urlB)])

  // pixelmatch bat buoc 2 anh cung kich thuoc -> resize ve cung 1 size
  const w = 800
  const h = 1200
  const dataA = getImageData(imgA, w, h)
  const dataB = getImageData(imgB, w, h)

  // canvas chua anh diff
  const diffCanvas = document.createElement('canvas')
  diffCanvas.width = w
  diffCanvas.height = h
  const diffCtx = diffCanvas.getContext('2d')!
  const diffData = diffCtx.createImageData(w, h)

  // so sanh tung pixel; tra ve so pixel khac
  const numDiff = pixelmatch(dataA.data, dataB.data, diffData.data, w, h, { threshold: 0.1 })

  diffCtx.putImageData(diffData, 0, 0)

  return {
    diffPercent: Math.round((numDiff / (w * h)) * 100 * 100) / 100, // lam tron 2 so le
    diffDataUrl: diffCanvas.toDataURL()
  }
}