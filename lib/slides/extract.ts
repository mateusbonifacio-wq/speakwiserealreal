/**
 * Extract slide content from PDF or PPTX files
 */

import pdfParse from 'pdf-parse'

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
    const data = await pdfParse(pdfBuffer)
    
    // Split PDF into pages (slides)
    // For now, treat each page as a slide
    // In the future, we could use more sophisticated parsing
    const pages = data.text.split(/\f/) // Form feed character separates pages
    
    return pages.map((pageText, index) => {
      const lines = pageText.split('\n').filter(line => line.trim().length > 0)
      const title = lines[0]?.trim() || null
      const content = lines.slice(1).join('\n').trim() || null
      
      return {
        index: index + 1,
        title,
        content,
      }
    }).filter(slide => slide.title || slide.content) // Only include slides with content
  } catch (error: any) {
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
 * Extract slides based on file type
 */
export async function extractSlides(
  fileBuffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<ExtractedSlide[]> {
  const fileExtension = fileName.split('.').pop()?.toLowerCase()
  
  if (fileExtension === 'pdf' || mimeType === 'application/pdf') {
    return await extractSlidesFromPDF(fileBuffer)
  } else if (fileExtension === 'pptx' || mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return await extractSlidesFromPPTX(fileBuffer)
  } else {
    throw new Error(`Unsupported file type: ${fileExtension || mimeType}. Only PDF and PPTX files are supported.`)
  }
}

