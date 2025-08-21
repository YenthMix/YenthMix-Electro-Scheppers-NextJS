import { NextResponse } from 'next/server';
import { sendMessage } from '../../../../lib/services/botpress.js';

export async function POST(request) {
  try {
    const { conversationId, text, userKey } = await request.json();
    const result = await sendMessage(conversationId, text, userKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
