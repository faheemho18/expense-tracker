/**
 * Receipt Image Processing Service
 * Enhances captured images for better OCR results
 */

export interface ImageProcessingOptions {
  enhanceContrast?: boolean
  normalizeSize?: boolean
  maxWidth?: number
  maxHeight?: number
  quality?: number
}

export interface ProcessedImageResult {
  processedImage: string
  originalSize: { width: number; height: number }
  processedSize: { width: number; height: number }
  qualityScore: number
  recommendations: string[]
}

export class ReceiptImageProcessor {
  private static instance: ReceiptImageProcessor

  static getInstance(): ReceiptImageProcessor {
    if (!ReceiptImageProcessor.instance) {
      ReceiptImageProcessor.instance = new ReceiptImageProcessor()
    }
    return ReceiptImageProcessor.instance
  }

  /**
   * Process image for optimal OCR results
   */
  async processImage(
    imageData: string, 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImageResult> {
    const {
      enhanceContrast = true,
      normalizeSize = true,
      maxWidth = 2048,
      maxHeight = 2048,
      quality = 0.92
    } = options

    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          if (!ctx) {
            throw new Error('Could not get canvas context')
          }

          const originalSize = { width: img.width, height: img.height }
          
          // Calculate optimal size
          let { width, height } = this.calculateOptimalSize(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          )

          canvas.width = width
          canvas.height = height

          // Draw image
          ctx.drawImage(img, 0, 0, width, height)

          // Apply image enhancements
          if (enhanceContrast) {
            this.enhanceContrast(ctx, width, height)
          }

          // Convert to data URL
          const processedImage = canvas.toDataURL('image/jpeg', quality)
          
          // Calculate quality score and recommendations
          const qualityScore = this.calculateQualityScore(originalSize, { width, height })
          const recommendations = this.generateRecommendations(originalSize, qualityScore)

          resolve({
            processedImage,
            originalSize,
            processedSize: { width, height },
            qualityScore,
            recommendations
          })
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = imageData
    })
  }

  /**
   * Quick image validation for OCR suitability
   */
  async validateImageQuality(imageData: string): Promise<{
    isValid: boolean
    issues: string[]
    suggestions: string[]
  }> {
    return new Promise((resolve) => {
      const img = new Image()
      
      img.onload = () => {
        const issues: string[] = []
        const suggestions: string[] = []

        // Check resolution
        if (img.width < 800 || img.height < 600) {
          issues.push('Low resolution image')
          suggestions.push('Use higher camera resolution or move closer to receipt')
        }

        // Check aspect ratio (receipts are typically tall)
        const aspectRatio = img.height / img.width
        if (aspectRatio < 1.0) {
          issues.push('Image appears to be landscape oriented')
          suggestions.push('Try rotating to portrait orientation for better receipt capture')
        }

        // Basic size validation
        if (img.width > 4000 || img.height > 4000) {
          suggestions.push('Image is very large - processing may take longer')
        }

        const isValid = issues.length === 0

        resolve({
          isValid,
          issues,
          suggestions
        })
      }

      img.onerror = () => {
        resolve({
          isValid: false,
          issues: ['Invalid image format'],
          suggestions: ['Please try taking a new photo']
        })
      }

      img.src = imageData
    })
  }

  /**
   * Calculate optimal image size for OCR processing
   */
  private calculateOptimalSize(
    originalWidth: number, 
    originalHeight: number, 
    maxWidth: number, 
    maxHeight: number
  ): { width: number; height: number } {
    // Don't upscale
    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight }
    }

    // Calculate scaling factor
    const scaleX = maxWidth / originalWidth
    const scaleY = maxHeight / originalHeight
    const scale = Math.min(scaleX, scaleY)

    return {
      width: Math.round(originalWidth * scale),
      height: Math.round(originalHeight * scale)
    }
  }

  /**
   * Enhance image contrast for better text recognition
   */
  private enhanceContrast(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ): void {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Simple contrast enhancement
    const factor = 1.2 // Contrast factor
    const intercept = 128 * (1 - factor)

    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast to RGB channels
      data[i] = Math.max(0, Math.min(255, data[i] * factor + intercept))     // Red
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * factor + intercept)) // Green
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * factor + intercept)) // Blue
      // Alpha channel (data[i + 3]) remains unchanged
    }

    ctx.putImageData(imageData, 0, 0)
  }

  /**
   * Calculate image quality score for OCR
   */
  private calculateQualityScore(
    originalSize: { width: number; height: number },
    processedSize: { width: number; height: number }
  ): number {
    // Score based on resolution and aspect ratio
    let score = 0

    // Resolution score (0-40 points)
    const minDimension = Math.min(processedSize.width, processedSize.height)
    if (minDimension >= 1080) score += 40
    else if (minDimension >= 720) score += 30
    else if (minDimension >= 480) score += 20
    else score += 10

    // Aspect ratio score (0-30 points) - prefer portrait for receipts
    const aspectRatio = processedSize.height / processedSize.width
    if (aspectRatio >= 1.3) score += 30
    else if (aspectRatio >= 1.0) score += 20
    else score += 10

    // Size consistency score (0-30 points)
    const sizeRatio = (processedSize.width * processedSize.height) / 
                      (originalSize.width * originalSize.height)
    if (sizeRatio >= 0.8) score += 30
    else if (sizeRatio >= 0.5) score += 20
    else score += 10

    return Math.min(100, score)
  }

  /**
   * Generate recommendations based on image analysis
   */
  private generateRecommendations(
    originalSize: { width: number; height: number },
    qualityScore: number
  ): string[] {
    const recommendations: string[] = []

    if (qualityScore < 60) {
      recommendations.push('Consider retaking photo with better lighting')
    }

    if (originalSize.width < 1080 || originalSize.height < 1080) {
      recommendations.push('Use higher camera resolution for better text recognition')
    }

    const aspectRatio = originalSize.height / originalSize.width
    if (aspectRatio < 1.0) {
      recommendations.push('Try rotating to portrait orientation')
    }

    if (qualityScore >= 80) {
      recommendations.push('Image quality looks good for OCR processing')
    }

    return recommendations
  }
}

// Export singleton instance
export const receiptImageProcessor = ReceiptImageProcessor.getInstance()