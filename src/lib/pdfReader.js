/**
 * Frontend PDF text extraction
 * Uses PDF.js via CDN script injection to avoid version mismatch
 */

// PDF.js CDN version - main lib and worker must match exactly
const PDFJS_VERSION = '4.4.168'
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`

let pdfjsLoaded = false

async function loadPdfjs() {
  if (pdfjsLoaded && window.pdfjsLib) return window.pdfjsLib

  return new Promise((resolve, reject) => {
    // Load main script
    const script = document.createElement('script')
    script.src = `${PDFJS_CDN}/pdf.min.js`
    script.onload = () => {
      if (window.pdfjsLib) {
        // Set worker to matching version from same CDN
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          `${PDFJS_CDN}/pdf.worker.min.js`
        pdfjsLoaded = true
        resolve(window.pdfjsLib)
      } else {
        reject(new Error('PDF.js 載入失敗'))
      }
    }
    script.onerror = () => reject(new Error('無法載入 PDF.js，請檢查網絡連接'))
    document.head.appendChild(script)
  })
}

export async function extractTextFromPDF(file) {
  const pdfjs = await loadPdfjs()

  // Read file as ArrayBuffer
  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('檔案讀取失敗'))
    reader.readAsArrayBuffer(file)
  })

  // Load PDF document
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
  const pdf = await loadingTask.promise

  let fullText = ''
  const numPages = pdf.numPages

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    let pageText = ''
    let lastY = null

    textContent.items.forEach(item => {
      if ('str' in item && item.str.trim()) {
        // New line when Y position changes
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += '\n'
        }
        pageText += item.str
        lastY = item.transform[5]
      }
    })

    fullText += pageText.trim() + '\n\n'
  }

  return fullText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function extractTextFromImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('圖片讀取失敗'))
    reader.readAsDataURL(file)
  })
}
