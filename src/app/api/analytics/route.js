import { NextResponse } from 'next/server';
import { BOTPRESS_CONFIG } from '../../../../lib/config.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Check if required environment variables are set
    if (!BOTPRESS_CONFIG.BEARER_TOKEN) {
      throw new Error('BOTPRESS_BEARER_TOKEN is not configured');
    }
    
    if (!BOTPRESS_CONFIG.WORKSPACE_ID) {
      throw new Error('BOTPRESS_WORKSPACE_ID is not configured');
    }
    
    if (!BOTPRESS_CONFIG.BOT_ID) {
      throw new Error('BOTPRESS_BOT_ID is not configured');
    }

    console.log('📊 Fetching bot analytics...', { startDate, endDate });

    // URL encode the date parameters
    const encodedStartDate = encodeURIComponent(startDate);
    const encodedEndDate = encodeURIComponent(endDate);

    const response = await fetch(
      `https://api.botpress.cloud/v1/admin/bots/${BOTPRESS_CONFIG.BOT_ID}/analytics?startDate=${encodedStartDate}&endDate=${encodedEndDate}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${BOTPRESS_CONFIG.BEARER_TOKEN}`,
          'x-workspace-id': BOTPRESS_CONFIG.WORKSPACE_ID,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Botpress Analytics API error:', response.status, errorText);
      throw new Error(`Botpress API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Analytics data fetched successfully:', data);

    return NextResponse.json({
      success: true,
      records: data.records || []
    });

  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        records: [] // Return empty array on error
      },
      { status: 500 }
    );
  }
}
