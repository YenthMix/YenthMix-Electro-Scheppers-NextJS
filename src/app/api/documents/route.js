import { NextResponse } from 'next/server';
import { getDocuments } from '../../../../lib/services/botpress.js';

export async function GET() {
  try {
    const result = await getDocuments();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message, 
        details: error.response?.data 
      },
      { status: 500 }
    );
  }
}
