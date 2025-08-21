import { NextResponse } from 'next/server';
import { getBotResponse } from '../../../../../lib/services/botpress.js';

export async function GET(request, { params }) {
  try {
    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const userKey = searchParams.get('userKey');
    
    if (!userKey) {
      return NextResponse.json(
        { error: 'userKey is required' },
        { status: 400 }
      );
    }
    
    const result = await getBotResponse(conversationId, userKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error getting bot response:', error);
    return NextResponse.json(
      { error: 'Failed to get bot messages' },
      { status: 500 }
    );
  }
}
