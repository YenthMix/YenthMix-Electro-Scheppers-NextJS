import { NextResponse } from 'next/server';
import { clearAllState } from '../../../../../lib/services/botpress.js';

export async function POST() {
  try {
    const result = clearAllState();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error clearing state:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
