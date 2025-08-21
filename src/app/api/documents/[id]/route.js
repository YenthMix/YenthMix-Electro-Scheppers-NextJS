import { NextResponse } from 'next/server';
import { deleteDocument } from '../../../../../lib/services/botpress.js';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const result = await deleteDocument(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
