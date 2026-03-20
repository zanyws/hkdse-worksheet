import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const A4_WIDTH = 210
const A4_HEIGHT = 297
const MARGIN = 20 // mm

export async function generatePDF(elementId, filename, isTeacher = false) {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('找不到工作紙元素')

  // Toggle teacher answers
  const teacherSpans = element.querySelectorAll('.teacher-answer')
  teacherSpans.forEach(span => {
    if (!isTeacher) {
      span.style.visibility = 'hidden'
      span.style.borderBottom = '1px solid #ccc'
      span.style.minWidth = '80px'
      span.style.display = 'inline-block'
    } else {
      span.style.visibility = 'visible'
    }
  })

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  
  // Split into pages
  const pageHeight = element.scrollHeight
  const a4HeightPx = (A4_HEIGHT - MARGIN * 2) / A4_WIDTH * (element.offsetWidth)
  let currentY = 0
  let pageNum = 0

  while (currentY < pageHeight) {
    if (pageNum > 0) pdf.addPage()
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      y: currentY,
      height: Math.min(a4HeightPx, pageHeight - currentY),
      windowHeight: pageHeight,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = A4_WIDTH - MARGIN * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, imgWidth, imgHeight)
    currentY += a4HeightPx
    pageNum++
  }

  // Restore teacher answers
  teacherSpans.forEach(span => {
    span.style.visibility = 'visible'
    span.style.borderBottom = ''
    span.style.minWidth = ''
    span.style.display = ''
  })

  pdf.save(`${filename}_${isTeacher ? '教師版' : '學生版'}.pdf`)
}

export async function generateMergedPDF(pageIds, title, isTeacher = false) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  let isFirst = true

  // Add TOC page
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(18)
  pdf.text('目錄', A4_WIDTH / 2, 30, { align: 'center' })
  
  const pageNames = ['知人論世', '篇章語譯', '課文結構', '寫作手法', '鞏固練習']
  pageNames.forEach((name, i) => {
    pdf.setFontSize(12)
    pdf.text(`${i + 1}. ${name}`, MARGIN + 10, 60 + i * 12)
    pdf.text(`第 ${i + 2} 頁`, A4_WIDTH - MARGIN - 10, 60 + i * 12)
  })

  for (const pageId of pageIds) {
    const element = document.getElementById(pageId)
    if (!element) continue

    if (!isFirst) pdf.addPage()
    isFirst = false

    const teacherSpans = element.querySelectorAll('.teacher-answer')
    teacherSpans.forEach(span => {
      span.style.visibility = isTeacher ? 'visible' : 'hidden'
    })

    const canvas = await html2canvas(element, { scale: 1.5, useCORS: true })
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = A4_WIDTH - MARGIN * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, imgWidth, Math.min(imgHeight, A4_HEIGHT - MARGIN * 2))

    teacherSpans.forEach(span => { span.style.visibility = 'visible' })
  }

  pdf.save(`${title}_完整工作紙_${isTeacher ? '教師版' : '學生版'}.pdf`)
}
