import { NextResponse } from 'next/server';

// Mock Botpress client for now - you'll need to replace this with actual Botpress client
const mockBotpressClient = {
  findTableRows: async ({ table, limit = 50, offset = 0, filter = {}, orderBy = 'row_id', orderDirection = 'asc' }) => {
    // Mock implementation - replace with actual Botpress client
    console.log(`🔍 Finding rows in table: ${table}`);
    return {
      rows: [], // Empty array - no sample images
      limit,
      offset,
      count: 0
    };
  },
  
  createTableRows: async ({ table, rows }) => {
    // Mock implementation - replace with actual Botpress client
    console.log(`➕ Creating rows in table: ${table}`, rows);
    return {
      rows: rows.map((row, index) => ({
        row_id: Date.now() + index,
        ...row,
        createdAt: new Date().toISOString()
      })),
      errors: [],
      warnings: []
    };
  }
};

export async function GET() {
  try {
    console.log('📸 Fetching photos from AfbeeldingenTable...');
    
    const result = await mockBotpressClient.findTableRows({
      table: 'AfbeeldingenTable',
      limit: 50,
      offset: 0,
      filter: {},
      orderBy: 'row_id',
      orderDirection: 'asc'
    });
    
    console.log(`✅ Found ${result.rows.length} photos`);
    
    return NextResponse.json({
      success: true,
      rows: result.rows,
      count: result.count
    });
  } catch (error) {
    console.error('❌ Error fetching photos:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { title, url } = await request.json();
    
    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required' },
        { status: 400 }
      );
    }
    
    console.log(`📸 Adding photo to AfbeeldingenTable: ${title} - ${url}`);
    
    const result = await mockBotpressClient.createTableRows({
      table: 'AfbeeldingenTable',
      rows: [
        {
          URL: url,
          Title: title
        }
      ]
    });
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Failed to create photo: ${result.errors.join(', ')}`);
    }
    
    console.log('✅ Photo added successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Photo added to knowledge base successfully',
      photo: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error adding photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add photo to knowledge base' },
      { status: 500 }
    );
  }
}
