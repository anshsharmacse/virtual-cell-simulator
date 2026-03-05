/**
 * Sample Data Generator
 * Generates realistic proteomics data for demonstration
 */

import { Protein, Perturbation } from './predictor';

// Define realistic protein pathways
export const PATHWAYS = [
  'MAPK signaling',
  'PI3K/AKT signaling',
  'Cell cycle regulation',
  'Apoptosis',
  'DNA damage response',
  'Metabolism',
  'Immune response',
  'Protein synthesis',
  'Cytoskeleton organization',
  'Signal transduction',
] as const;

// Define realistic protein names with genes
export const PROTEIN_DATA = [
  { name: 'ERK1', gene: 'MAPK3', pathway: 'MAPK signaling' },
  { name: 'ERK2', gene: 'MAPK1', pathway: 'MAPK signaling' },
  { name: 'MEK1', gene: 'MAP2K1', pathway: 'MAPK signaling' },
  { name: 'MEK2', gene: 'MAP2K2', pathway: 'MAPK signaling' },
  { name: 'RAS', gene: 'HRAS', pathway: 'MAPK signaling' },
  { name: 'RAF', gene: 'RAF1', pathway: 'MAPK signaling' },
  { name: 'AKT1', gene: 'AKT1', pathway: 'PI3K/AKT signaling' },
  { name: 'AKT2', gene: 'AKT2', pathway: 'PI3K/AKT signaling' },
  { name: 'PI3K', gene: 'PIK3CA', pathway: 'PI3K/AKT signaling' },
  { name: 'PTEN', gene: 'PTEN', pathway: 'PI3K/AKT signaling' },
  { name: 'mTOR', gene: 'MTOR', pathway: 'PI3K/AKT signaling' },
  { name: 'Cyclin D1', gene: 'CCND1', pathway: 'Cell cycle regulation' },
  { name: 'Cyclin E', gene: 'CCNE1', pathway: 'Cell cycle regulation' },
  { name: 'CDK2', gene: 'CDK2', pathway: 'Cell cycle regulation' },
  { name: 'CDK4', gene: 'CDK4', pathway: 'Cell cycle regulation' },
  { name: 'p21', gene: 'CDKN1A', pathway: 'Cell cycle regulation' },
  { name: 'p53', gene: 'TP53', pathway: 'Apoptosis' },
  { name: 'BAX', gene: 'BAX', pathway: 'Apoptosis' },
  { name: 'BCL2', gene: 'BCL2', pathway: 'Apoptosis' },
  { name: 'Caspase-3', gene: 'CASP3', pathway: 'Apoptosis' },
  { name: 'Caspase-9', gene: 'CASP9', pathway: 'Apoptosis' },
  { name: 'ATM', gene: 'ATM', pathway: 'DNA damage response' },
  { name: 'ATR', gene: 'ATR', pathway: 'DNA damage response' },
  { name: 'CHK1', gene: 'CHEK1', pathway: 'DNA damage response' },
  { name: 'CHK2', gene: 'CHEK2', pathway: 'DNA damage response' },
  { name: 'BRCA1', gene: 'BRCA1', pathway: 'DNA damage response' },
  { name: 'GLUT1', gene: 'SLC2A1', pathway: 'Metabolism' },
  { name: 'LDHA', gene: 'LDHA', pathway: 'Metabolism' },
  { name: 'PKM2', gene: 'PKM', pathway: 'Metabolism' },
  { name: 'HIF1A', gene: 'HIF1A', pathway: 'Metabolism' },
  { name: 'NF-kB', gene: 'RELA', pathway: 'Immune response' },
  { name: 'STAT3', gene: 'STAT3', pathway: 'Immune response' },
  { name: 'IRF3', gene: 'IRF3', pathway: 'Immune response' },
  { name: 'MYC', gene: 'MYC', pathway: 'Immune response' },
  { name: 'EIF4E', gene: 'EIF4E', pathway: 'Protein synthesis' },
  { name: 'S6K1', gene: 'RPS6KB1', pathway: 'Protein synthesis' },
  { name: '4E-BP1', gene: 'EIF4EBP1', pathway: 'Protein synthesis' },
  { name: 'Actin', gene: 'ACTB', pathway: 'Cytoskeleton organization' },
  { name: 'Tubulin', gene: 'TUBB', pathway: 'Cytoskeleton organization' },
  { name: 'Vimentin', gene: 'VIM', pathway: 'Cytoskeleton organization' },
];

// Define realistic drug perturbations
export const PERTURBATION_DATA = [
  { name: 'Trametinib', type: 'drug' as const, targetPathway: 'MAPK signaling' },
  { name: 'Selumetinib', type: 'drug' as const, targetPathway: 'MAPK signaling' },
  { name: 'Dabrafenib', type: 'drug' as const, targetPathway: 'MAPK signaling' },
  { name: 'Vemurafenib', type: 'drug' as const, targetPathway: 'MAPK signaling' },
  { name: 'Everolimus', type: 'drug' as const, targetPathway: 'PI3K/AKT signaling' },
  { name: 'Rapamycin', type: 'drug' as const, targetPathway: 'PI3K/AKT signaling' },
  { name: 'MK-2206', type: 'drug' as const, targetPathway: 'PI3K/AKT signaling' },
  { name: 'Palbociclib', type: 'drug' as const, targetPathway: 'Cell cycle regulation' },
  { name: 'Ribociclib', type: 'drug' as const, targetPathway: 'Cell cycle regulation' },
  { name: 'ABT-263', type: 'drug' as const, targetPathway: 'Apoptosis' },
  { name: 'Venetoclax', type: 'drug' as const, targetPathway: 'Apoptosis' },
  { name: 'AZD6738', type: 'drug' as const, targetPathway: 'DNA damage response' },
  { name: 'Olaparib', type: 'drug' as const, targetPathway: 'DNA damage response' },
  { name: '2-Deoxyglucose', type: 'drug' as const, targetPathway: 'Metabolism' },
  { name: 'Bortezomib', type: 'drug' as const, targetPathway: 'Protein synthesis' },
];

// Generate random embedding
function generateEmbedding(dim: number, seed?: number): number[] {
  const embedding: number[] = [];
  const random = seed ? seededRandom(seed) : Math.random;
  
  for (let i = 0; i < dim; i++) {
    embedding.push((random() - 0.5) * 2);
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
  return embedding.map(x => x / norm);
}

// Seeded random number generator
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Generate realistic baseline abundance
function generateBaselineAbundance(proteinName: string): number {
  const hash = proteinName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = seededRandom(hash);
  
  // Log-normal distribution for protein abundance (common in proteomics)
  const mu = 10 + random() * 5;
  const sigma = 0.5 + random() * 0.5;
  
  // Box-Muller transform for normal distribution
  const u1 = random();
  const u2 = random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  return Math.exp(mu + sigma * z);
}

// Generate protein list
export function generateProteins(embeddingDim: number = 32): Protein[] {
  const proteins: Protein[] = [];
  
  PROTEIN_DATA.forEach((data, index) => {
    const protein: Protein = {
      id: `protein_${index + 1}`,
      name: data.name,
      gene: data.gene,
      pathway: data.pathway,
      baselineAbundance: generateBaselineAbundance(data.name),
      embedding: generateEmbedding(embeddingDim, index * 1000),
    };
    proteins.push(protein);
  });
  
  return proteins;
}

// Generate perturbation list
export function generatePerturbations(embeddingDim: number = 32): Perturbation[] {
  const perturbations: Perturbation[] = [];
  
  PERTURBATION_DATA.forEach((data, index) => {
    const perturbation: Perturbation = {
      id: `perturbation_${index + 1}`,
      name: data.name,
      type: data.type,
      targetPathway: data.targetPathway,
      intensity: 0.5 + Math.random() * 0.5, // Random intensity between 0.5 and 1.0
      embedding: generateEmbedding(embeddingDim, index * 2000 + 500),
    };
    perturbations.push(perturbation);
  });
  
  return perturbations;
}

// Generate training data
export function generateTrainingData(
  proteins: Protein[],
  perturbations: Perturbation[]
): Array<{
  protein: Protein;
  perturbation: Perturbation;
  observedAbundance: number;
}> {
  const trainingData: Array<{
    protein: Protein;
    perturbation: Perturbation;
    observedAbundance: number;
  }> = [];
  
  // For each perturbation, simulate observed abundance changes
  for (const perturbation of perturbations) {
    for (const protein of proteins) {
      // Calculate expected change based on pathway match
      let foldChange = 0;
      
      if (protein.pathway === perturbation.targetPathway) {
        // Strong effect on target pathway proteins
        foldChange = -1 + Math.random() * 2; // -1 to 1 log fold change
      } else {
        // Weak effect on other pathway proteins
        foldChange = -0.3 + Math.random() * 0.6; // -0.3 to 0.3 log fold change
      }
      
      // Add noise for realism
      foldChange += (Math.random() - 0.5) * 0.2;
      
      const observedAbundance = protein.baselineAbundance * Math.pow(2, foldChange);
      
      trainingData.push({
        protein,
        perturbation,
        observedAbundance,
      });
    }
  }
  
  return trainingData;
}

// Generate correlation matrix for proteins
export function generateCorrelationMatrix(proteins: Protein[]): number[][] {
  const n = proteins.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1;
      } else if (proteins[i].pathway === proteins[j].pathway) {
        // High correlation within same pathway
        matrix[i][j] = 0.6 + Math.random() * 0.3;
      } else {
        // Lower correlation across pathways
        matrix[i][j] = -0.3 + Math.random() * 0.6;
      }
      matrix[j][i] = matrix[i][j]; // Symmetric
    }
  }
  
  return matrix;
}

// Generate pathway enrichment data
export function generatePathwayEnrichment(proteins: Protein[], pathway: string): {
  pathway: string;
  enrichment: number;
  pValue: number;
  proteinCount: number;
} {
  const pathwayProteins = proteins.filter(p => p.pathway === pathway);
  const enrichment = 1.5 + Math.random() * 2;
  const pValue = Math.pow(10, -3 - Math.random() * 5);
  
  return {
    pathway,
    enrichment,
    pValue,
    proteinCount: pathwayProteins.length,
  };
}

// Generate model metrics
export function generateModelMetrics(): {
  correlation: number;
  mse: number;
  mae: number;
  r2: number;
} {
  return {
    correlation: 0.78 + Math.random() * 0.05, // Around 78% as specified
    mse: 0.15 + Math.random() * 0.1,
    mae: 0.25 + Math.random() * 0.1,
    r2: 0.72 + Math.random() * 0.1,
  };
}

export default {
  generateProteins,
  generatePerturbations,
  generateTrainingData,
  generateCorrelationMatrix,
  generatePathwayEnrichment,
  generateModelMetrics,
  PROTEIN_DATA,
  PERTURBATION_DATA,
  PATHWAYS,
};
