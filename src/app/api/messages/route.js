import { NextResponse } from 'next/server';
import { getMessages } from '../../../../lib/services/botpress.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userKey = searchParams.get('userKey');
    
    const result = await getMessages(conversationId, userKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
