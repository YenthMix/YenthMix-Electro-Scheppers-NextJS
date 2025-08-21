import { NextResponse } from 'next/server';
import { createUser } from '../../../../lib/services/botpress.js';

export async function POST() {
  try {
    const result = await createUser();
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
