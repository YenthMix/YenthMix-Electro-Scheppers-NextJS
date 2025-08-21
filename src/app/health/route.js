import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Elektro Scheppers Next.js App',
    version: '3.0.0 - Next.js Monolithic with Botpress Integration',
    runtime: 'Next.js API Routes'
  });
}
