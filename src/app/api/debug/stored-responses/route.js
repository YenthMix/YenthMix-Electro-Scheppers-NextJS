import { NextResponse } from 'next/server';
import { getStoredResponses } from '../../../../../lib/services/botpress.js';

export async function GET() {
  try {
    const result = getStoredResponses();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error getting stored responses:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
