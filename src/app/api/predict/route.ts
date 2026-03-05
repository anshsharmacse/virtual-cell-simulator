import { NextRequest, NextResponse } from 'next/server';
import { generateProteins, generatePerturbations } from '@/lib/ml/dataGenerator';

// Cache for proteins and perturbations
let proteinsCache: Awaited<ReturnType<typeof generateProteins>> | null = null;
let perturbationsCache: Awaited<ReturnType<typeof generatePerturbations>> | null = null;

function getCachedData() {
  if (!proteinsCache) {
    proteinsCache = generateProteins(32);
  }
  if (!perturbationsCache) {
    perturbationsCache = generatePerturbations(32);
  }
  return { proteins: proteinsCache, perturbations: perturbationsCache };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proteinIds, perturbationId, intensity } = body;

    console.log('Predict API called with:', { proteinIds, perturbationId, intensity });

    if (!proteinIds || !Array.isArray(proteinIds)) {
      return NextResponse.json(
        { success: false, error: 'proteinIds must be an array' },
        { status: 400 }
      );
    }

    if (!perturbationId) {
      return NextResponse.json(
        { success: false, error: 'perturbationId is required' },
        { status: 400 }
      );
    }

    const { proteins, perturbations } = getCachedData();
    
    // Find the perturbation
    const perturbation = perturbations.find(p => p.id === perturbationId);
    if (!perturbation) {
      return NextResponse.json(
        { success: false, error: `Perturbation ${perturbationId} not found` },
        { status: 404 }
      );
    }

    // Generate predictions using the VAE-style simulation
    const predictions = proteinIds.map(proteinId => {
      const protein = proteins.find(p => p.id === proteinId);
      if (!protein) return null;

      // Simulate VAE latent space prediction
      const pathwayMatch = protein.pathway === perturbation.targetPathway;
      const baseEffect = pathwayMatch ? 0.8 : 0.3;
      const intensityEffect = intensity ?? perturbation.intensity;
      
      // Calculate fold change with some realistic variation
      const noise = (Math.random() - 0.5) * 0.3;
      const foldChange = (Math.random() - 0.5) * 2 * baseEffect * intensityEffect + noise;
      
      // Calculate predicted abundance
      const predictedAbundance = protein.baselineAbundance * Math.pow(2, foldChange);
      
      // Confidence based on pathway match and intensity
      let confidence = 0.6 + (pathwayMatch ? 0.2 : 0) + intensityEffect * 0.15;
      confidence = Math.min(0.95, Math.max(0.5, confidence + (Math.random() - 0.5) * 0.1));

      return {
        proteinId: protein.id,
        proteinName: protein.name,
        baselineAbundance: protein.baselineAbundance,
        predictedAbundance,
        foldChange,
        confidence,
        pathway: protein.pathway,
      };
    }).filter(Boolean);

    console.log('Generated predictions:', predictions.length);

    return NextResponse.json({
      success: true,
      predictions,
      metadata: {
        correlation: 0.78 + Math.random() * 0.05,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error running prediction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run prediction' },
      { status: 500 }
    );
  }
}
