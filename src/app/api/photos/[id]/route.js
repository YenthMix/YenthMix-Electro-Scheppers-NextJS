import { NextResponse } from 'next/server';

// Mock Botpress client for now - you'll need to replace this with actual Botpress client
const mockBotpressClient = {
  deleteTableRows: async ({ table, ids, filter, deleteAllRows }) => {
    // Mock implementation - replace with actual Botpress client
    console.log(`🗑️ Deleting rows from table: ${table}`, { ids, filter, deleteAllRows });
    return {
      deletedRows: ids || [1, 2, 3] // Mock deleted row IDs
    };
  }
};

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Photo ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`🗑️ Deleting photo with ID: ${id} from AfbeeldingenTable`);
    
    const result = await mockBotpressClient.deleteTableRows({
      table: 'AfbeeldingenTable',
      ids: [parseInt(id)]
    });
    
    console.log('✅ Photo deleted successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Photo deleted from knowledge base successfully',
      deletedRows: result.deletedRows
    });
  } catch (error) {
    console.error('❌ Error deleting photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo from knowledge base' },
      { status: 500 }
    );
  }
}
