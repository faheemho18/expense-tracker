import { NextRequest, NextResponse } from 'next/server';
import { expenseCategorizationService } from '@/lib/ai-services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, amount, availableCategories } = body;

    if (!description || !amount || !availableCategories) {
      return NextResponse.json(
        { error: 'Missing required fields: description, amount, availableCategories' },
        { status: 400 }
      );
    }

    const result = await expenseCategorizationService.categorizeExpense({
      description,
      amount,
      availableCategories,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in categorize API:', error);
    return NextResponse.json(
      { error: 'Failed to categorize expense' },
      { status: 500 }
    );
  }
}