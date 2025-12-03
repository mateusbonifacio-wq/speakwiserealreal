/**
 * Extract slide content from PDF or PPTX files
 */

export interface ExtractedSlide {
  index: number
  title: string | null
  content: string | null
}

/**
 * Extract slides from PDF
 */
export async function extractSlidesFromPDF(pdfBuffer: Buffer): Promise<ExtractedSlide[]> {
  try {
    // Polyfill DOMMatrix before importing pdf-parse (it may use pdfjs-dist internally)
    if (typeof globalThis.DOMMatrix === 'undefined') {
      (globalThis as any).DOMMatrix = class DOMMatrix {
        constructor(init?: string | number[]) {
          // Minimal implementation
        }
        static fromMatrix() {
          return new DOMMatrix()
        }
      }
    }
    
    // Polyfill ImageData
    if (typeof globalThis.ImageData === 'undefined') {
      (globalThis as any).ImageData = class ImageData {
        data: Uint8ClampedArray
        width: number
        height: number
        constructor(dataOrWidth: Uint8ClampedArray | number, heightOrWidth?: number, height?: number) {
          if (typeof dataOrWidth === 'number') {
            this.width = dataOrWidth
            this.height = heightOrWidth || 1
            this.data = new Uint8ClampedArray(this.width * this.height * 4)
          } else {
            this.data = dataOrWidth
            this.width = heightOrWidth || 1
            this.height = height || 1
          }
        }
      }
    }
    
    // Polyfill Path2D
    if (typeof globalThis.Path2D === 'undefined') {
      (globalThis as any).Path2D = class Path2D {
        constructor() {
          // Minimal implementation
        }
      }
    }
    
    // Use pdf-parse which is simpler and works better in Node.js/serverless
    // Dynamic import to handle CommonJS module
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = (pdfParseModule as any).default || pdfParseModule
    
    // Parse the PDF
    const data = await pdfParse(pdfBuffer)
    
    // pdf-parse returns all text, we need to split by pages
    // Unfortunately pdf-parse doesn't provide per-page text directly
    // We'll use a workaround: split by form feed characters or estimate pages
    
    // Try to split by form feed (page break character)
    const pages = data.text.split(/\f/).filter((page: string) => page.trim().length > 0)
    
    // If no form feeds found, estimate pages based on text length
    // Average ~500 characters per page is a rough estimate
    let estimatedPages: string[] = []
    if (pages.length === 1 && data.text.length > 0) {
      // No page breaks found, split by approximate page size
      const charsPerPage = 500
      const text = data.text
      for (let i = 0; i < text.length; i += charsPerPage) {
        estimatedPages.push(text.substring(i, i + charsPerPage))
      }
    } else {
      estimatedPages = pages
    }
    
    // Extract slides from pages
    const slides: ExtractedSlide[] = estimatedPages.map((pageText: string, index: number) => {
      const lines = pageText.split(/\n+/).filter((line: string) => line.trim().length > 0)
      const title = lines[0]?.trim() || null
      const content = lines.slice(1).join('\n').trim() || null
      
      return {
        index: index + 1,
        title,
        content,
      }
    })
    
    return slides.filter((slide: ExtractedSlide) => slide.title || slide.content)
  } catch (error: any) {
    console.error('[PDF] Parsing error:', error)
    throw new Error(`Failed to parse PDF: ${error.message}`)
  }
}

/**
 * Extract slides from PPTX
 */
export async function extractSlidesFromPPTX(pptxBuffer: Buffer): Promise<ExtractedSlide[]> {
  try {
    // Use pptx-parser library
    // The library API may vary, so we'll try multiple approaches
    const PPTXParser = await import('pptx-parser')
    
    let slides: any[] = []
    
    // Try different initialization patterns
    try {
      // Pattern 1: Direct instantiation with buffer
      const parser = new (PPTXParser as any).default(pptxBuffer)
      slides = await parser.parse()
    } catch (e1) {
      try {
        // Pattern 2: Create parser then parse
        const Parser = (PPTXParser as any).default || PPTXParser
        const parser = new Parser()
        slides = await parser.parse(pptxBuffer)
      } catch (e2) {
        try {
          // Pattern 3: Static parse method
          const Parser = (PPTXParser as any).default || PPTXParser
          slides = await Parser.parse(pptxBuffer)
        } catch (e3) {
          throw new Error(`Failed to initialize PPTX parser: ${e1}, ${e2}, ${e3}`)
        }
      }
    }
    
    if (!slides || slides.length === 0) {
      throw new Error('No slides found in presentation')
    }
    
    return slides.map((slide: any, index: number) => {
      // Extract title (usually first text element or slide title)
      let title: string | null = null
      let contentParts: string[] = []
      
      // Try different possible structures
      if (slide.title) {
        title = slide.title
      } else if (slide.shapes && slide.shapes.length > 0) {
        // First shape might be title
        const firstShape = slide.shapes[0]
        if (firstShape && firstShape.text) {
          title = firstShape.text
        }
      }
      
      // Extract all text content
      if (slide.shapes && Array.isArray(slide.shapes)) {
        slide.shapes.forEach((shape: any, shapeIndex: number) => {
          if (shape.text) {
            const text = shape.text.trim()
            if (text && (shapeIndex === 0 ? text !== title : true)) {
              if (shapeIndex === 0 && !title) {
                title = text
              } else {
                contentParts.push(text)
              }
            }
          }
        })
      }
      
      // If no title found, use first content line as title
      if (!title && contentParts.length > 0) {
        title = contentParts[0]
        contentParts = contentParts.slice(1)
      }
      
      const content = contentParts.length > 0 ? contentParts.join('\n') : null
      
      return {
        index: index + 1,
        title: title?.trim() || null,
        content: content?.trim() || null,
      }
    }).filter((slide: ExtractedSlide) => slide.title || slide.content)
  } catch (error: any) {
    console.error('[Slides] PPTX parsing error:', error)
    // If parsing fails, provide helpful error
    throw new Error(`Failed to parse PPTX file: ${error.message}. Please ensure the file is a valid PowerPoint (.pptx) file.`)
  }
}

/**
 * Extract slides from PDF (PDF only for now)
 */
export async function extractSlides(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractedSlide[]> {
  const fileExtension = fileName.split('.').pop()?.toLowerCase()
  
  if (fileExtension === 'pdf' || mimeType === 'application/pdf') {
    return await extractSlidesFromPDF(fileBuffer)
  } else {
    throw new Error(`Unsupported file type: ${fileExtension || mimeType}. Only PDF files are supported.`)
  }
}

