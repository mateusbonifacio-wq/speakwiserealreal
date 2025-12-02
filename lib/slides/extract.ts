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
    // Use pdfjs-dist with Node.js compatibility
    // Import the standard build
    const pdfjsLib = await import('pdfjs-dist')
    
    // Configure for Node.js - try to use worker from package
    const pdfjs = pdfjsLib as any
    if (pdfjs.GlobalWorkerOptions) {
      try {
        // Try to resolve worker path (works in Node.js)
        const workerPath = await import('pdfjs-dist/build/pdf.worker.mjs?url')
        pdfjs.GlobalWorkerOptions.workerSrc = workerPath.default || workerPath
      } catch (e) {
        // If worker can't be loaded, use inline worker (slower but works)
        // For serverless, we'll disable worker and use main thread
        pdfjs.GlobalWorkerOptions.workerSrc = ''
      }
    }
    
    // Get the getDocument function
    const getDocument = pdfjsLib.getDocument || pdfjs.default?.getDocument
    
    if (!getDocument) {
      throw new Error('getDocument function not found in pdfjs-dist')
    }
    
    // Convert Buffer to Uint8Array (pdfjs-dist requires Uint8Array, not Buffer)
    const uint8Array = new Uint8Array(pdfBuffer)
    
    // Load the PDF document
    const loadingTask = getDocument({
      data: uint8Array,
      useSystemFonts: true,
      verbosity: 0, // Suppress warnings
    })
    
    const pdf = await loadingTask.promise
    const numPages = pdf.numPages
    
    const slides: ExtractedSlide[] = []
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .trim()
      
      if (pageText) {
        // Split into lines for better structure
        const lines = pageText.split(/\n+/).filter((line: string) => line.trim().length > 0)
        const title = lines[0]?.trim() || null
        const content = lines.slice(1).join('\n').trim() || null
        
        slides.push({
          index: pageNum,
          title,
          content,
        })
      }
    }
    
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

