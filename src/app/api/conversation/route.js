import { NextResponse } from 'next/server';
import { createConversation } from '../../../../lib/services/botpress.js';

export async function POST(request) {
  try {
    const { userKey } = await request.json();
    const result = await createConversation(userKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
