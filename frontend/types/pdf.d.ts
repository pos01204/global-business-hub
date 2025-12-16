/**
 * jspdf 및 html2canvas 타입 선언
 */

declare module 'jspdf' {
  interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape'
    unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc'
    format?: string | [number, number]
    compress?: boolean
    precision?: number
    putOnlyUsedFonts?: boolean
    hotfixes?: string[]
    encryption?: {
      userPassword?: string
      ownerPassword?: string
      userPermissions?: string[]
    }
    floatPrecision?: number | 'smart'
  }

  interface TextOptionsLight {
    align?: 'left' | 'center' | 'right' | 'justify'
    baseline?: 'alphabetic' | 'ideographic' | 'bottom' | 'top' | 'middle' | 'hanging'
    angle?: number
    rotationDirection?: 0 | 1
    charSpace?: number
    horizontalScale?: number
    lineHeightFactor?: number
    flags?: {
      noBOM?: boolean
      autoencode?: boolean
    }
    maxWidth?: number
    renderingMode?: 'fill' | 'stroke' | 'fillThenStroke' | 'invisible' | 'fillAndAddForClipping' | 'strokeAndAddPathForClipping' | 'fillThenStrokeAndAddToPathForClipping' | 'addToPathForClipping'
    isInputVisual?: boolean
    isOutputVisual?: boolean
    isInputRtl?: boolean
    isOutputRtl?: boolean
    isSymmetricSwapping?: boolean
  }

  interface ImageOptions {
    imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array
    x: number
    y: number
    width: number
    height: number
    alias?: string
    compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW'
    rotation?: number
    format?: string
  }

  class jsPDF {
    constructor(options?: jsPDFOptions)
    constructor(orientation?: 'portrait' | 'landscape', unit?: string, format?: string | [number, number])
    
    addPage(format?: string | [number, number], orientation?: 'portrait' | 'landscape'): jsPDF
    setPage(pageNumber: number): jsPDF
    getNumberOfPages(): number
    
    text(text: string | string[], x: number, y: number, options?: TextOptionsLight): jsPDF
    setFontSize(size: number): jsPDF
    setFont(fontName: string, fontStyle?: string, fontWeight?: string | number): jsPDF
    setTextColor(r: number, g?: number, b?: number): jsPDF
    setTextColor(color: string): jsPDF
    
    setDrawColor(r: number, g?: number, b?: number): jsPDF
    setDrawColor(color: string): jsPDF
    setFillColor(r: number, g?: number, b?: number): jsPDF
    setFillColor(color: string): jsPDF
    setLineWidth(width: number): jsPDF
    
    line(x1: number, y1: number, x2: number, y2: number): jsPDF
    rect(x: number, y: number, w: number, h: number, style?: 'S' | 'F' | 'FD' | 'DF'): jsPDF
    roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: 'S' | 'F' | 'FD' | 'DF'): jsPDF
    circle(x: number, y: number, r: number, style?: 'S' | 'F' | 'FD' | 'DF'): jsPDF
    ellipse(x: number, y: number, rx: number, ry: number, style?: 'S' | 'F' | 'FD' | 'DF'): jsPDF
    
    addImage(imageData: string | HTMLImageElement | HTMLCanvasElement | Uint8Array, format: string, x: number, y: number, width: number, height: number, alias?: string, compression?: 'NONE' | 'FAST' | 'MEDIUM' | 'SLOW', rotation?: number): jsPDF
    addImage(options: ImageOptions): jsPDF
    
    save(filename: string, options?: { returnPromise?: boolean }): jsPDF | Promise<void>
    output(type: 'arraybuffer'): ArrayBuffer
    output(type: 'blob'): Blob
    output(type: 'bloburi' | 'bloburl'): string
    output(type: 'datauristring' | 'dataurlstring'): string
    output(type: 'datauri' | 'dataurl'): void
    output(type: 'pdfobjectnewwindow'): void
    output(type: 'pdfjsnewwindow'): void
    
    internal: {
      pageSize: {
        getWidth(): number
        getHeight(): number
        width: number
        height: number
      }
      getNumberOfPages(): number
      getCurrentPageInfo(): { pageNumber: number }
    }
    
    getTextWidth(text: string): number
    splitTextToSize(text: string, maxWidth: number): string[]
  }

  export default jsPDF
  export { jsPDF }
}

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    allowTaint?: boolean
    backgroundColor?: string | null
    canvas?: HTMLCanvasElement
    foreignObjectRendering?: boolean
    imageTimeout?: number
    ignoreElements?: (element: Element) => boolean
    logging?: boolean
    onclone?: (document: Document, element: HTMLElement) => void
    proxy?: string
    removeContainer?: boolean
    scale?: number
    useCORS?: boolean
    width?: number
    height?: number
    x?: number
    y?: number
    scrollX?: number
    scrollY?: number
    windowWidth?: number
    windowHeight?: number
  }

  function html2canvas(element: HTMLElement, options?: Html2CanvasOptions): Promise<HTMLCanvasElement>
  
  export default html2canvas
  export { html2canvas, Html2CanvasOptions }
}

