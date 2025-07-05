import { NextRequest, NextResponse } from 'next/server';
import { receiptOCRService } from '@/lib/ai-services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing required field: imageData' },
        { status: 400 }
      );
    }

    const result = await receiptOCRService.extractFromReceipt(imageData);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in OCR API:', error);
    return NextResponse.json(
      { error: 'Failed to process receipt' },
      { status: 500 }
    );
  }
}