import { NextResponse } from 'next/server';
import { generateProteins } from '@/lib/ml/dataGenerator';

// Cache proteins for performance
let cachedProteins: Awaited<ReturnType<typeof generateProteins>> | null = null;

export async function GET() {
  try {
    if (!cachedProteins) {
      cachedProteins = generateProteins(32);
    }
    
    const proteins = cachedProteins.map(p => ({
      id: p.id,
      name: p.name,
      gene: p.gene,
      pathway: p.pathway,
      baselineAbundance: p.baselineAbundance,
    }));
    
    return NextResponse.json({
      success: true,
      proteins,
      total: proteins.length,
    });
  } catch (error) {
    console.error('Error fetching proteins:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch proteins' },
      { status: 500 }
    );
  }
}
