/**
 * Download utilities
 * HTML: uses Tailwind CDN for identical layout to webpage
 * PDF: print button triggers browser print dialog (Ctrl+P → Save as PDF)
 */

// ── Minimal base CSS (fonts + teacher-answer + print rules) ──────
const BASE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Noto+Serif+TC:wght@400;600;700;900&display=swap');

:root {
  --teacher-red: #dc2626;
  --ink-50: #f8f6f0; --ink-100: #ede8d8; --ink-200: #d9d0b8;
  --ink-400: #a99872; --ink-600: #6e6040; --ink-900: #221e14;
  --gold-400: #fbbf24; --gold-500: #f59e0b; --gold-600: #d97706;
}

body {
  font-family: "Noto Sans TC", "Microsoft JhengHei", sans-serif;
  background: #f8f6f0;
  color: #221e14;
}

/* Teacher answer */
.teacher-answer { color: #dc2626 !important; font-weight: 700 !important; }
.student-mode .teacher-answer {
  color: transparent !important;
  background: #e5e7eb;
  border-radius: 2px;
  user-select: none;
}

/* Paper header */
.paper-header {
  text-align: center;
  border-bottom: 2px solid #221e14;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
}
.paper-header h1 {
  font-family: "Noto Serif TC", serif;
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  margin-bottom: 0.5rem;
}

/* Translation grid */
.translation-grid { display: grid; grid-template-columns: 40% 60%; }
.translation-original { border-right: 1px solid #d9d0b8; }
.translation-modern { padding-left: 1rem; }

/* Tips box */
.tips-box {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  padding: 0.75rem 1rem;
  border-radius: 0 8px 8px 0;
}

/* Print - A4 layout */
@media print {
  @page {
    size: A4 portrait;
    margin: 1.5cm 2cm;
  }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  .no-print { display: none !important; }
  body {
    background: white !important;
    font-size: 11pt !important;
    width: 170mm;
    margin: 0 auto;
  }
  h1 { font-size: 16pt !important; }
  h2 { font-size: 13pt !important; }
  .paper-header h1 { font-size: 16pt !important; }
  section { page-break-inside: avoid; }
  table { page-break-inside: avoid; }
}
`

// ── Build full HTML with Tailwind CDN ────────────────────────────
function buildHTML(elementId, title, isTeacher) {
  const el = document.getElementById(elementId)
  if (!el) throw new Error('找不到工作紙元素')

  const clone = el.cloneNode(true)

  // Remove UI-only elements
  clone.querySelectorAll('.no-print, button, [role="button"]').forEach(n => n.remove())
  clone.querySelectorAll('svg').forEach(n => n.remove())

  // Student mode: add class to wrapper for CSS to hide answers
  const wrapperClass = isTeacher ? '' : 'student-mode'

  return `<!DOCTYPE html>
<html lang="zh-HK">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — ${isTeacher ? '教師版' : '學生版'}</title>
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif TC"', 'serif'],
        sans: ['"Noto Sans TC"', 'sans-serif'],
      },
      colors: {
        ink: {
          50:'#f8f6f0',100:'#ede8d8',200:'#d9d0b8',300:'#c4b898',
          400:'#a99872',500:'#8a7a52',600:'#6e6040',700:'#524830',
          800:'#3a3222',900:'#221e14',950:'#110f0a',
        },
        gold: {
          50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',
          400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309',
        },
        vermillion: {
          50:'#fff1f0',100:'#ffe0de',200:'#ffc5c2',600:'#dc2626',700:'#b91c1c',
        },
      }
    }
  }
}
</script>
<style>${BASE_CSS}</style>
</head>
<body class="p-6 max-w-4xl mx-auto" style="width:170mm;margin:0 auto;">
<div class="${wrapperClass}">
${clone.innerHTML}
</div>
</body>
</html>`
}

// ── HTML Download ────────────────────────────────────────────────
export function downloadHTML(elementId, filename, isTeacher) {
  const html = buildHTML(elementId, filename, isTeacher)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `${filename}_${isTeacher ? '教師版' : '學生版'}.html`,
  })
  a.click()
  URL.revokeObjectURL(url)
}

// ── PDF via print button (window.print) ──────────────────────────
export function printPDF(elementId, filename, isTeacher) {
  const html = buildHTML(elementId, filename, isTeacher)

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:0'
  document.body.appendChild(iframe)

  iframe.contentDocument.open()
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()

  iframe.contentWindow.onafterprint = () => {
    document.body.removeChild(iframe)
  }

  // Wait for Tailwind CDN + fonts to load before printing
  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  }, 1800)
}

// ── Print current page directly (no iframe) ──────────────────────
export function printCurrentPage(isTeacher) {
  // Toggle teacher answers visibility
  const teacherSpans = document.querySelectorAll('.teacher-answer')
  if (!isTeacher) {
    teacherSpans.forEach(s => {
      s.dataset.origColor = s.style.color
      s.style.color = 'transparent'
      s.style.background = '#e5e7eb'
      s.style.borderRadius = '2px'
    })
  }

  // Hide all UI elements
  const noprint = document.querySelectorAll('.no-print')
  noprint.forEach(el => el.style.display = 'none')

  window.print()

  // Restore
  if (!isTeacher) {
    teacherSpans.forEach(s => {
      s.style.color = s.dataset.origColor || ''
      s.style.background = ''
      s.style.borderRadius = ''
    })
  }
  noprint.forEach(el => el.style.display = '')
}
