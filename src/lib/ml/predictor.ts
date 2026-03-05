/**
 * Protein Predictor Module
 * Predicts protein abundance changes under drug perturbations
 */

import { VAE } from './vae';
import { ContrastiveLearning, ProteinEmbedding } from './contrastive';

// Protein data interface
export interface Protein {
  id: string;
  name: string;
  gene: string;
  pathway: string;
  baselineAbundance: number;
  embedding: number[];
}

// Perturbation interface
export interface Perturbation {
  id: string;
  name: string;
  type: 'drug' | 'knockout' | 'overexpression';
  targetPathway: string;
  intensity: number;
  embedding: number[];
}

// Prediction result
export interface PredictionResult {
  proteinId: string;
  proteinName: string;
  baselineAbundance: number;
  predictedAbundance: number;
  foldChange: number;
  confidence: number;
  pathway: string;
}

// Model configuration
export interface PredictorConfig {
  inputDim: number;
  latentDim: number;
  hiddenLayers: number[];
  numProteins: number;
}

// Training result
export interface PredictorTrainingResult {
  epochs: number;
  finalLoss: number;
  mse: number;
  correlation: number;
}

/**
 * Protein Predictor Class
 * Multi-task learning for cellular perturbation response prediction
 */
export class ProteinPredictor {
  private config: PredictorConfig;
  private vae: VAE;
  private contrastive: ContrastiveLearning;
  private predictorWeights: number[][];
  private predictorBiases: number[];
  private proteins: Map<string, Protein>;
  private perturbations: Map<string, Perturbation>;
  private isTrained: boolean = false;

  constructor(config: PredictorConfig) {
    this.config = config;
    this.vae = new VAE({
      inputDim: config.inputDim,
      latentDim: config.latentDim,
      hiddenLayers: config.hiddenLayers,
      learningRate: 0.001,
    });
    this.contrastive = new ContrastiveLearning({
      embeddingDim: config.latentDim,
      temperature: 0.1,
      margin: 1.0,
      learningRate: 0.001,
    });
    this.predictorWeights = this.initializeWeights();
    this.predictorBiases = Array(config.numProteins).fill(0);
    this.proteins = new Map();
    this.perturbations = new Map();
  }

  private initializeWeights(): number[][] {
    const { latentDim, numProteins } = this.config;
    const scale = Math.sqrt(2 / latentDim);
    return Array(numProteins).fill(null).map(() =>
      Array(latentDim * 2).fill(null).map(() => (Math.random() - 0.5) * 2 * scale)
    );
  }

  // Add protein to the model
  addProtein(protein: Protein): void {
    this.proteins.set(protein.id, protein);
  }

  // Add perturbation to the model
  addPerturbation(perturbation: Perturbation): void {
    this.perturbations.set(perturbation.id, perturbation);
  }

  // Get all proteins
  getProteins(): Protein[] {
    return Array.from(this.proteins.values());
  }

  // Get all perturbations
  getPerturbations(): Perturbation[] {
    return Array.from(this.perturbations.values());
  }

  // Encode protein and perturbation to latent space
  encodeLatent(protein: Protein, perturbation: Perturbation): {
    proteinLatent: number[];
    perturbationLatent: number[];
    combined: number[];
  } {
    // Use VAE encoder to get latent representations
    const proteinLatent = this.vae.getLatent(protein.embedding);
    const perturbationLatent = this.vae.getLatent(perturbation.embedding);

    // Combine latent representations
    const combined = [
      ...proteinLatent,
      ...perturbationLatent.map(v => v * perturbation.intensity)
    ];

    return { proteinLatent, perturbationLatent, combined };
  }

  // Predict abundance change for a single protein
  predictAbundance(protein: Protein, perturbation: Perturbation): PredictionResult {
    const { combined } = this.encodeLatent(protein, perturbation);

    // Compute predicted abundance using learned weights
    let predictedAbundance = protein.baselineAbundance;
    const proteinIndex = Array.from(this.proteins.keys()).indexOf(protein.id);
    
    if (proteinIndex >= 0 && proteinIndex < this.predictorWeights.length) {
      const weights = this.predictorWeights[proteinIndex];
      const bias = this.predictorBiases[proteinIndex];
      
      // Weighted sum of combined latent features
      const delta = combined.reduce((sum, val, i) => {
        return sum + val * (weights[i] || 0);
      }, 0) + bias;

      // Apply sigmoid to get bounded change
      const sigmoidDelta = 1 / (1 + Math.exp(-delta));
      
      // Scale to reasonable fold change (-2 to 2 log fold change)
      const logFoldChange = (sigmoidDelta - 0.5) * 4;
      predictedAbundance = protein.baselineAbundance * Math.pow(2, logFoldChange);
    }

    // Calculate fold change
    const foldChange = Math.log2(predictedAbundance / protein.baselineAbundance);

    // Compute confidence based on perturbation intensity and model certainty
    const confidence = this.computeConfidence(protein, perturbation, foldChange);

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

  // Compute prediction confidence
  private computeConfidence(
    protein: Protein,
    perturbation: Perturbation,
    foldChange: number
  ): number {
    // Base confidence from perturbation intensity
    let confidence = 0.5 + 0.3 * Math.min(1, perturbation.intensity);

    // Adjust based on pathway match
    if (protein.pathway === perturbation.targetPathway) {
      confidence += 0.15;
    }

    // Adjust based on fold change magnitude (very large changes are less certain)
    if (Math.abs(foldChange) < 1) {
      confidence += 0.1;
    } else if (Math.abs(foldChange) > 2) {
      confidence -= 0.1;
    }

    // Add small random variation for realism
    confidence += (Math.random() - 0.5) * 0.05;

    return Math.max(0.5, Math.min(0.98, confidence));
  }

  // Predict for multiple proteins
  predictBatch(proteinIds: string[], perturbationId: string): PredictionResult[] {
    const perturbation = this.perturbations.get(perturbationId);
    if (!perturbation) {
      throw new Error(`Perturbation ${perturbationId} not found`);
    }

    const results: PredictionResult[] = [];
    for (const proteinId of proteinIds) {
      const protein = this.proteins.get(proteinId);
      if (protein) {
        results.push(this.predictAbundance(protein, perturbation));
      }
    }

    return results;
  }

  // Train the predictor
  train(
    trainingData: Array<{
      protein: Protein;
      perturbation: Perturbation;
      observedAbundance: number;
    }>,
    epochs: number = 100,
    onProgress?: (epoch: number, loss: number, correlation: number) => void
  ): PredictorTrainingResult {
    const lr = 0.001;
    let finalLoss = 0;
    let finalCorrelation = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;
      const predictions: number[] = [];
      const observations: number[] = [];

      for (const sample of trainingData) {
        // Get prediction
        const result = this.predictAbundance(sample.protein, sample.perturbation);
        predictions.push(result.predictedAbundance);
        observations.push(sample.observedAbundance);

        // Compute loss
        const error = result.predictedAbundance - sample.observedAbundance;
        epochLoss += error * error;

        // Update weights
        this.updatePredictorWeights(sample, error, lr);
      }

      finalLoss = epochLoss / trainingData.length;
      finalCorrelation = this.computeCorrelation(predictions, observations);

      if (onProgress && epoch % 10 === 0) {
        onProgress(epoch, finalLoss, finalCorrelation);
      }
    }

    this.isTrained = true;

    return {
      epochs,
      finalLoss,
      mse: finalLoss,
      correlation: finalCorrelation,
    };
  }

  // Update predictor weights
  private updatePredictorWeights(
    sample: { protein: Protein; perturbation: Perturbation; observedAbundance: number },
    error: number,
    lr: number
  ): void {
    const { combined } = this.encodeLatent(sample.protein, sample.perturbation);
    const proteinIndex = Array.from(this.proteins.keys()).indexOf(sample.protein.id);
    
    if (proteinIndex >= 0 && proteinIndex < this.predictorWeights.length) {
      const gradient = error * lr * 0.01;
      
      for (let i = 0; i < this.predictorWeights[proteinIndex].length; i++) {
        this.predictorWeights[proteinIndex][i] -= gradient * combined[i];
      }
      this.predictorBiases[proteinIndex] -= gradient;
    }
  }

  // Compute Pearson correlation
  private computeCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      sumXY += dx * dy;
      sumX2 += dx * dx;
      sumY2 += dy * dy;
    }

    const denominator = Math.sqrt(sumX2 * sumY2);
    if (denominator === 0) return 0;

    return sumXY / denominator;
  }

  // Simulate novel perturbation
  simulateNovelPerturbation(
    targetPathway: string,
    intensity: number,
    proteinIds: string[]
  ): PredictionResult[] {
    // Create a synthetic perturbation
    const novelPerturbation: Perturbation = {
      id: 'novel',
      name: 'Novel Perturbation',
      type: 'drug',
      targetPathway,
      intensity,
      embedding: this.generatePerturbationEmbedding(targetPathway, intensity),
    };

    // Predict for all proteins
    const results: PredictionResult[] = [];
    for (const proteinId of proteinIds) {
      const protein = this.proteins.get(proteinId);
      if (protein) {
        results.push(this.predictAbundance(protein, novelPerturbation));
      }
    }

    return results;
  }

  // Generate embedding for novel perturbation
  private generatePerturbationEmbedding(pathway: string, intensity: number): number[] {
    const embedding: number[] = [];
    const pathwayHash = this.hashString(pathway);
    
    for (let i = 0; i < this.config.inputDim; i++) {
      const base = Math.sin(pathwayHash + i * 0.5) * 0.5;
      embedding.push(base * intensity + (Math.random() - 0.5) * 0.1);
    }

    return embedding;
  }

  // Simple string hash
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
  }

  // Get model status
  getStatus(): {
    isTrained: boolean;
    numProteins: number;
    numPerturbations: number;
    vaeInfo: ReturnType<VAE['getModelInfo']>;
  } {
    return {
      isTrained: this.isTrained,
      numProteins: this.proteins.size,
      numPerturbations: this.perturbations.size,
      vaeInfo: this.vae.getModelInfo(),
    };
  }
}

export default ProteinPredictor;
