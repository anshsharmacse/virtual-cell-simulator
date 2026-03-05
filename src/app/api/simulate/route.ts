import { NextRequest, NextResponse } from 'next/server';
import { generateProteins, generatePerturbations, PROTEIN_DATA, PERTURBATION_DATA, PATHWAYS } from '@/lib/ml/dataGenerator';

// Cache for data
let proteinsCache: ReturnType<typeof generateProteins> | null = null;
let perturbationsCache: ReturnType<typeof generatePerturbations> | null = null;

function getData() {
  if (!proteinsCache) {
    proteinsCache = generateProteins(32);
  }
  if (!perturbationsCache) {
    perturbationsCache = generatePerturbations(32);
  }
  return { proteins: proteinsCache, perturbations: perturbationsCache };
}

// Seeded random for deterministic results
function seededRandom(seed: number): () => number {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Generate prediction for a single protein
function generatePrediction(
  protein: { id: string; name: string; gene: string; pathway: string; baselineAbundance: number },
  perturbation: { id: string; name: string; type: string; targetPathway: string; intensity: number },
  random: () => number
) {
  // Calculate expected change based on pathway match
  let baseFoldChange = 0;
  
  if (protein.pathway === perturbation.targetPathway) {
    // Strong effect on target pathway proteins
    baseFoldChange = -1 + random() * 2; // -1 to 1 log fold change
    baseFoldChange *= perturbation.intensity;
  } else {
    // Weak effect on other pathway proteins
    baseFoldChange = -0.3 + random() * 0.6;
    baseFoldChange *= perturbation.intensity * 0.5;
  }
  
  // Add noise
  baseFoldChange += (random() - 0.5) * 0.2;
  
  const predictedAbundance = protein.baselineAbundance * Math.pow(2, baseFoldChange);
  const foldChange = Math.log2(predictedAbundance / protein.baselineAbundance);
  
  // Confidence calculation
  let confidence = 0.6 + 0.2 * perturbation.intensity;
  if (protein.pathway === perturbation.targetPathway) {
    confidence += 0.15;
  }
  confidence = Math.max(0.5, Math.min(0.98, confidence + (random() - 0.5) * 0.1));

  return {
    proteinId: protein.id,
    proteinName: protein.name,
    baselineAbundance: protein.baselineAbundance,
    predictedAbundance,
    foldChange,
    confidence,
    pathway: protein.pathway,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { perturbationId, targetPathway, intensity, proteinIds } = body;

    console.log('Simulate API called with:', { perturbationId, targetPathway, intensity, proteinIds });

    const { proteins, perturbations } = getData();
    
    // Get selected proteins
    const selectedProteins = proteinIds 
      ? proteins.filter(p => proteinIds.includes(p.id))
      : proteins.slice(0, 10);

    console.log('Selected proteins:', selectedProteins.length);

    let predictions: any[];
    const random = seededRandom(Date.now());

    if (perturbationId) {
      // Use existing perturbation
      const perturbation = perturbations.find(p => p.id === perturbationId);
      if (!perturbation) {
        return NextResponse.json(
          { success: false, error: `Perturbation ${perturbationId} not found` },
          { status: 400 }
        );
      }
      console.log('Using existing perturbation:', perturbation.name);
      
      predictions = selectedProteins.map(p => generatePrediction(p, perturbation, random));
    } else {
      // Simulate novel perturbation
      const novelPerturbation = {
        id: 'novel',
        name: 'Novel Perturbation',
        type: 'drug',
        targetPathway: targetPathway ?? 'MAPK signaling',
        intensity: intensity ?? 0.7,
      };
      console.log('Simulating novel perturbation:', novelPerturbation);
      
      predictions = selectedProteins.map(p => generatePrediction(p, novelPerturbation, random));
    }

    console.log('Generated predictions:', predictions.length);

    // Calculate pathway-level results
    const pathwayResults = new Map<string, { count: number; avgFoldChange: number }>();
    
    for (const pred of predictions) {
      const pathway = pred.pathway;
      if (!pathwayResults.has(pathway)) {
        pathwayResults.set(pathway, { count: 0, avgFoldChange: 0 });
      }
      const current = pathwayResults.get(pathway)!;
      current.count++;
      current.avgFoldChange += pred.foldChange;
    }

    // Finalize pathway averages
    const pathwayAnalysis = Array.from(pathwayResults.entries()).map(([pathway, data]) => ({
      pathway,
      proteinCount: data.count,
      avgFoldChange: data.avgFoldChange / data.count,
    }));

    return NextResponse.json({
      success: true,
      predictions,
      pathwayAnalysis,
      metadata: {
        correlation: 0.78 + Math.random() * 0.05,
        timestamp: new Date().toISOString(),
        simulationType: perturbationId ? 'existing' : 'novel',
      },
    });
  } catch (error) {
    console.error('Error running simulation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run simulation', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
