/**
 * Export Draft Utilities
 *
 * Utilities for exporting drafts in various formats (HTML, PDF, etc.)
 */

import jsPDF from 'jspdf'

export interface ExportDraftOptions {
  title?: string
  content: string
  metadata?: {
    caseId?: string
    version?: number
    createdAt?: string
    updatedAt?: string
  }
}

/**
 * Exports draft content as a downloadable HTML file
 *
 * @param options - Export options including content and metadata
 * @returns void - Triggers browser download
 */
export function exportDraftAsHTML(options: ExportDraftOptions): void {
  const { title = 'Minuta', content, metadata } = options

  // Create a complete HTML document with embedded styles
  const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* Reset and Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 2cm;
      max-width: 21cm;
      margin: 0 auto;
    }

    /* Typography */
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 1em;
      text-align: center;
      text-transform: uppercase;
    }

    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      text-transform: uppercase;
    }

    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    p {
      margin-bottom: 1em;
      text-align: justify;
      text-indent: 2em;
    }

    /* Lists */
    ul, ol {
      margin-left: 2em;
      margin-bottom: 1em;
    }

    li {
      margin-bottom: 0.5em;
    }

    /* Text Formatting */
    strong, b {
      font-weight: bold;
    }

    em, i {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    s, strike, del {
      text-decoration: line-through;
    }

    /* Code */
    code {
      font-family: 'Courier New', Courier, monospace;
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }

    pre {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 1em;
    }

    pre code {
      background: none;
      padding: 0;
    }

    /* Blockquote */
    blockquote {
      border-left: 4px solid #ccc;
      padding-left: 1em;
      margin-left: 0;
      margin-bottom: 1em;
      font-style: italic;
      color: #555;
    }

    /* Horizontal Rule */
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 2em 0;
    }

    /* Metadata Section */
    .metadata {
      margin-bottom: 2em;
      padding: 1em;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 10pt;
    }

    .metadata-item {
      margin-bottom: 0.5em;
    }

    .metadata-label {
      font-weight: bold;
      margin-right: 0.5em;
    }

    /* Print Styles */
    @media print {
      /* Page Setup */
      @page {
        size: A4;
        margin: 2cm;
      }

      @page :first {
        margin-top: 3cm;
      }

      /* Body */
      body {
        padding: 0;
        max-width: 100%;
        background: white;
        color: black;
      }

      /* Metadata Section */
      .metadata {
        page-break-after: avoid;
        break-after: avoid;
        background-color: #f9f9f9;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Headers */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        break-after: avoid;
        page-break-inside: avoid;
        break-inside: avoid;
        color: black;
      }

      /* Paragraphs and Text */
      p {
        orphans: 3;
        widows: 3;
        color: black;
      }

      /* Lists */
      ul, ol {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      li {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Tables */
      table {
        page-break-inside: auto;
      }

      thead {
        display: table-header-group;
      }

      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Blockquotes and Code */
      blockquote {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      pre {
        page-break-inside: avoid;
        break-inside: avoid;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      code {
        background-color: #f5f5f5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Horizontal Rules */
      hr {
        page-break-after: avoid;
        break-after: avoid;
      }

      /* Images */
      img {
        max-width: 100%;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Links - Show URLs */
      a[href]:after {
        content: " (" attr(href) ")";
        font-size: 9pt;
        font-style: italic;
      }

      /* Ensure colors print correctly */
      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  ${metadata ? generateMetadataSection(metadata) : ''}

  <div class="content">
    ${content}
  </div>
</body>
</html>`

  // Create a Blob with the HTML content
  const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' })

  // Create a download link and trigger it
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sanitizeFilename(title)}.html`

  // Trigger download
  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate metadata section HTML
 */
function generateMetadataSection(metadata: ExportDraftOptions['metadata']): string {
  if (!metadata) return ''

  const items: string[] = []

  if (metadata.caseId) {
    items.push(`<div class="metadata-item"><span class="metadata-label">Caso:</span>${escapeHtml(metadata.caseId)}</div>`)
  }

  if (metadata.version !== undefined) {
    items.push(`<div class="metadata-item"><span class="metadata-label">Versão:</span>${metadata.version}</div>`)
  }

  if (metadata.createdAt) {
    items.push(`<div class="metadata-item"><span class="metadata-label">Criado em:</span>${formatDate(metadata.createdAt)}</div>`)
  }

  if (metadata.updatedAt) {
    items.push(`<div class="metadata-item"><span class="metadata-label">Atualizado em:</span>${formatDate(metadata.updatedAt)}</div>`)
  }

  if (items.length === 0) return ''

  return `<div class="metadata">
    <h3>Informações do Documento</h3>
    ${items.join('\n    ')}
  </div>`
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Sanitize filename for safe downloads
 */
function sanitizeFilename(filename: string): string {
  // Remove or replace invalid filename characters
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 200) // Limit length
}

/**
 * Format date string for display
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * Exports draft content as a downloadable PDF file
 *
 * @param options - Export options including content and metadata
 * @returns void - Triggers browser download
 */
export function exportDraftAsPDF(options: ExportDraftOptions): void {
  const { title = 'Minuta', content, metadata } = options

  // Create a new jsPDF instance (A4 size, portrait orientation)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Set document properties
  pdf.setProperties({
    title: title,
    subject: 'Minuta',
    author: 'Sistema de Minutas',
    creator: 'Sistema de Minutas',
  })

  // Set margins
  const margin = 20
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const contentWidth = pageWidth - 2 * margin

  let yPosition = margin

  // Add metadata section if available
  if (metadata) {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Informações do Documento', margin, yPosition)
    yPosition += 7

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)

    if (metadata.caseId) {
      pdf.text(`Caso: ${metadata.caseId}`, margin, yPosition)
      yPosition += 5
    }

    if (metadata.version !== undefined) {
      pdf.text(`Versão: ${metadata.version}`, margin, yPosition)
      yPosition += 5
    }

    if (metadata.createdAt) {
      pdf.text(`Criado em: ${formatDate(metadata.createdAt)}`, margin, yPosition)
      yPosition += 5
    }

    if (metadata.updatedAt) {
      pdf.text(`Atualizado em: ${formatDate(metadata.updatedAt)}`, margin, yPosition)
      yPosition += 5
    }

    // Add separator line
    yPosition += 5
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 10
  }

  // Convert HTML content to plain text for PDF
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = content

  // Extract text content, preserving some structure
  const textContent = extractTextFromHTML(tempDiv)

  // Set font for main content
  pdf.setFontSize(12)
  pdf.setFont('times', 'normal')

  // Split text into lines that fit the page width
  const lines = pdf.splitTextToSize(textContent, contentWidth)

  // Add text to PDF, handling page breaks
  for (const line of lines) {
    // Check if we need a new page
    if (yPosition + 7 > pageHeight - margin) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.text(line, margin, yPosition)
    yPosition += 7
  }

  // Save the PDF
  pdf.save(`${sanitizeFilename(title)}.pdf`)
}

/**
 * Extract text from HTML while preserving some structure
 */
function extractTextFromHTML(element: HTMLElement): string {
  let text = ''

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tagName = el.tagName.toLowerCase()

      // Add line breaks for block elements
      if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br'].includes(tagName)) {
        text += extractTextFromHTML(el) + '\n'
      } else if (tagName === 'ul' || tagName === 'ol') {
        text += '\n' + extractTextFromHTML(el)
      } else {
        text += extractTextFromHTML(el)
      }
    }
  }

  return text
}

/**
 * Prints draft content using browser's native print dialog
 *
 * @param options - Export options including content and metadata
 * @returns void - Opens browser print dialog
 */
export function printDraft(options: ExportDraftOptions): void {
  const { title = 'Minuta', content, metadata } = options

  // Create a complete HTML document with embedded styles
  const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    /* Reset and Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
      padding: 2cm;
      max-width: 21cm;
      margin: 0 auto;
    }

    /* Typography */
    h1 {
      font-size: 18pt;
      font-weight: bold;
      margin-bottom: 1em;
      text-align: center;
      text-transform: uppercase;
    }

    h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      text-transform: uppercase;
    }

    h3 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }

    p {
      margin-bottom: 1em;
      text-align: justify;
      text-indent: 2em;
    }

    /* Lists */
    ul, ol {
      margin-left: 2em;
      margin-bottom: 1em;
    }

    li {
      margin-bottom: 0.5em;
    }

    /* Text Formatting */
    strong, b {
      font-weight: bold;
    }

    em, i {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    s, strike, del {
      text-decoration: line-through;
    }

    /* Code */
    code {
      font-family: 'Courier New', Courier, monospace;
      background-color: #f5f5f5;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.9em;
    }

    pre {
      background-color: #f5f5f5;
      padding: 1em;
      border-radius: 5px;
      overflow-x: auto;
      margin-bottom: 1em;
    }

    pre code {
      background: none;
      padding: 0;
    }

    /* Blockquote */
    blockquote {
      border-left: 4px solid #ccc;
      padding-left: 1em;
      margin-left: 0;
      margin-bottom: 1em;
      font-style: italic;
      color: #555;
    }

    /* Horizontal Rule */
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 2em 0;
    }

    /* Metadata Section */
    .metadata {
      margin-bottom: 2em;
      padding: 1em;
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 10pt;
    }

    .metadata-item {
      margin-bottom: 0.5em;
    }

    .metadata-label {
      font-weight: bold;
      margin-right: 0.5em;
    }

    /* Print Styles */
    @media print {
      /* Page Setup */
      @page {
        size: A4;
        margin: 2cm;
      }

      @page :first {
        margin-top: 3cm;
      }

      /* Body */
      body {
        padding: 0;
        max-width: 100%;
        background: white;
        color: black;
      }

      /* Metadata Section */
      .metadata {
        page-break-after: avoid;
        break-after: avoid;
        background-color: #f9f9f9;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Headers */
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        break-after: avoid;
        page-break-inside: avoid;
        break-inside: avoid;
        color: black;
      }

      /* Paragraphs and Text */
      p {
        orphans: 3;
        widows: 3;
        color: black;
      }

      /* Lists */
      ul, ol {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      li {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Tables */
      table {
        page-break-inside: auto;
      }

      thead {
        display: table-header-group;
      }

      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Blockquotes and Code */
      blockquote {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      pre {
        page-break-inside: avoid;
        break-inside: avoid;
        white-space: pre-wrap;
        word-wrap: break-word;
      }

      code {
        background-color: #f5f5f5;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      /* Horizontal Rules */
      hr {
        page-break-after: avoid;
        break-after: avoid;
      }

      /* Images */
      img {
        max-width: 100%;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Links - Show URLs */
      a[href]:after {
        content: " (" attr(href) ")";
        font-size: 9pt;
        font-style: italic;
      }

      /* Ensure colors print correctly */
      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  ${metadata ? generateMetadataSection(metadata) : ''}

  <div class="content">
    ${content}
  </div>
</body>
</html>`

  // Create a new window with the print content
  const printWindow = window.open('', '_blank')

  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow pop-ups for this site.')
  }

  // Write the HTML content to the new window
  printWindow.document.write(htmlTemplate)
  printWindow.document.close()

  // Wait for content to load, then trigger print dialog
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    // Close the window after printing (or if user cancels)
    printWindow.onafterprint = () => {
      printWindow.close()
    }
  }
}
