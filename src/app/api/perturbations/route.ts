import { NextResponse } from 'next/server';
import { generatePerturbations } from '@/lib/ml/dataGenerator';

// Cache perturbations for performance
let cachedPerturbations: Awaited<ReturnType<typeof generatePerturbations>> | null = null;

export async function GET() {
  try {
    if (!cachedPerturbations) {
      cachedPerturbations = generatePerturbations(32);
    }
    
    const perturbations = cachedPerturbations.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      targetPathway: p.targetPathway,
      intensity: p.intensity,
    }));
    
    return NextResponse.json({
      success: true,
      perturbations,
      total: perturbations.length,
    });
  } catch (error) {
    console.error('Error fetching perturbations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch perturbations' },
      { status: 500 }
    );
  }
}
