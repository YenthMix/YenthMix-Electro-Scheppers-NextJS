import { NextResponse } from 'next/server';
import { trackUserMessage } from '../../../../lib/services/botpress.js';

export async function POST(request) {
  try {
    const { conversationId, text } = await request.json();
    
    if (!conversationId || !text) {
      return NextResponse.json(
        { error: 'Missing conversationId or text' },
        { status: 400 }
      );
    }
    
    const result = await trackUserMessage(conversationId, text);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error tracking user message:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
