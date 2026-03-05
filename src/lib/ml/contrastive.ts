/**
 * Contrastive Learning Module
 * For learning protein similarity and predicting abundance changes
 */

// Similarity metrics
export const SimilarityMetrics = {
  cosine: (a: number[], b: number[]): number => {
    const dotProduct = a.reduce((sum, x, i) => sum + x * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
    const normB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  },

  euclidean: (a: number[], b: number[]): number => {
    return Math.sqrt(a.reduce((sum, x, i) => sum + Math.pow(x - b[i], 2), 0));
  },

  manhattan: (a: number[], b: number[]): number => {
    return a.reduce((sum, x, i) => sum + Math.abs(x - b[i]), 0);
  },
};

// Protein embedding interface
export interface ProteinEmbedding {
  id: string;
  name: string;
  embedding: number[];
  abundance: number;
  pathway?: string;
}

// Contrastive learning configuration
export interface ContrastiveConfig {
  embeddingDim: number;
  temperature: number;
  margin: number;
  learningRate: number;
}

// Training sample for contrastive learning
export interface ContrastiveSample {
  anchor: number[];
  positive: number[];
  negative: number[];
}

// Training result
export interface ContrastiveTrainingResult {
  epochs: number;
  finalLoss: number;
  accuracy: number;
}

/**
 * Contrastive Learning Module
 * Implements InfoNCE loss and triplet loss for protein similarity learning
 */
export class ContrastiveLearning {
  private config: ContrastiveConfig;
  private projectionWeights: number[][];
  private isInitialized: boolean = false;

  constructor(config: ContrastiveConfig) {
    this.config = config;
    this.projectionWeights = this.initializeProjection(config.embeddingDim);
    this.isInitialized = true;
  }

  private initializeProjection(dim: number): number[][] {
    // Xavier initialization for projection matrix
    const scale = Math.sqrt(2 / dim);
    return Array(dim).fill(null).map(() =>
      Array(dim).fill(null).map(() => (Math.random() - 0.5) * 2 * scale)
    );
  }

  // Project embedding through learned projection
  project(embedding: number[]): number[] {
    return embedding.map((_, i) => {
      return embedding.reduce((sum, x, j) => sum + x * this.projectionWeights[j][i], 0);
    });
  }

  // Normalize embedding
  normalize(embedding: number[]): number[] {
    const norm = Math.sqrt(embedding.reduce((sum, x) => sum + x * x, 0));
    if (norm === 0) return embedding;
    return embedding.map(x => x / norm);
  }

  // InfoNCE Loss (Noise Contrastive Estimation)
  infoNCELoss(
    anchor: number[],
    positive: number[],
    negatives: number[][]
  ): number {
    const temperature = this.config.temperature;

    // Compute similarity with positive
    const positiveSim = SimilarityMetrics.cosine(
      this.normalize(this.project(anchor)),
      this.normalize(this.project(positive))
    ) / temperature;

    // Compute similarities with negatives
    const negativeSims = negatives.map(neg =>
      SimilarityMetrics.cosine(
        this.normalize(this.project(anchor)),
        this.normalize(this.project(neg))
      ) / temperature
    );

    // Softmax denominator
    const expPositive = Math.exp(positiveSim);
    const expNegatives = negativeSims.map(s => Math.exp(s));
    const denominator = expPositive + expNegatives.reduce((a, b) => a + b, 0);

    // Loss: -log(exp(positive) / denominator)
    return -Math.log(expPositive / denominator);
  }

  // Triplet Loss
  tripletLoss(
    anchor: number[],
    positive: number[],
    negative: number[]
  ): number {
    const { margin } = this.config;

    const posDist = SimilarityMetrics.euclidean(
      this.normalize(this.project(anchor)),
      this.normalize(this.project(positive))
    );
    const negDist = SimilarityMetrics.euclidean(
      this.normalize(this.project(anchor)),
      this.normalize(this.project(negative))
    );

    // max(0, posDist - negDist + margin)
    return Math.max(0, posDist - negDist + margin);
  }

  // Contrastive loss for pairs
  contrastiveLoss(
    embedding1: number[],
    embedding2: number[],
    isSimilar: boolean
  ): number {
    const { margin } = this.config;
    const distance = SimilarityMetrics.euclidean(
      this.normalize(this.project(embedding1)),
      this.normalize(this.project(embedding2))
    );

    if (isSimilar) {
      // Similar pairs should have small distance
      return Math.pow(distance, 2);
    } else {
      // Dissimilar pairs should have distance > margin
      return Math.pow(Math.max(0, margin - distance), 2);
    }
  }

  // Train the contrastive model
  train(
    samples: ContrastiveSample[],
    epochs: number = 100,
    onProgress?: (epoch: number, loss: number) => void
  ): ContrastiveTrainingResult {
    let finalLoss = 0;
    const lr = this.config.learningRate;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;
      let correct = 0;

      for (const sample of samples) {
        // Compute triplet loss
        const loss = this.tripletLoss(sample.anchor, sample.positive, sample.negative);
        epochLoss += loss;

        // Check if prediction is correct
        const posSim = SimilarityMetrics.cosine(
          this.project(sample.anchor),
          this.project(sample.positive)
        );
        const negSim = SimilarityMetrics.cosine(
          this.project(sample.anchor),
          this.project(sample.negative)
        );
        if (posSim > negSim) correct++;

        // Update projection weights (gradient descent)
        this.updateWeights(sample, lr);
      }

      finalLoss = epochLoss / samples.length;

      if (onProgress && epoch % 10 === 0) {
        onProgress(epoch, finalLoss);
      }
    }

    return {
      epochs,
      finalLoss,
      accuracy: correct / samples.length,
    };
  }

  // Update weights using gradient approximation
  private updateWeights(sample: ContrastiveSample, lr: number): void {
    const grad = this.computeGradient(sample);
    
    // Apply gradients to projection weights
    for (let i = 0; i < this.projectionWeights.length; i++) {
      for (let j = 0; j < this.projectionWeights[i].length; j++) {
        this.projectionWeights[i][j] -= lr * grad[i][j];
      }
    }
  }

  // Compute gradient for triplet loss
  private computeGradient(sample: ContrastiveSample): number[][] {
    const dim = this.config.embeddingDim;
    const gradient = Array(dim).fill(null).map(() => Array(dim).fill(0));

    // Compute gradient using finite differences (simplified)
    const epsilon = 0.001;
    const baseLoss = this.tripletLoss(sample.anchor, sample.positive, sample.negative);

    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        this.projectionWeights[i][j] += epsilon;
        const newLoss = this.tripletLoss(sample.anchor, sample.positive, sample.negative);
        this.projectionWeights[i][j] -= epsilon;
        gradient[i][j] = (newLoss - baseLoss) / epsilon;
      }
    }

    return gradient;
  }

  // Find similar proteins
  findSimilar(
    query: number[],
    database: ProteinEmbedding[],
    topK: number = 5
  ): Array<{ protein: ProteinEmbedding; similarity: number }> {
    const projectedQuery = this.normalize(this.project(query));
    
    const similarities = database.map(protein => ({
      protein,
      similarity: SimilarityMetrics.cosine(
        projectedQuery,
        this.normalize(this.project(protein.embedding))
      ),
    }));

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, topK);
  }

  // Get embedding similarity matrix
  getSimilarityMatrix(embeddings: number[][]): number[][] {
    const n = embeddings.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        matrix[i][j] = SimilarityMetrics.cosine(
          this.normalize(this.project(embeddings[i])),
          this.normalize(this.project(embeddings[j]))
        );
      }
    }

    return matrix;
  }

  // Predict protein interaction
  predictInteraction(protein1: number[], protein2: number[]): {
    similarity: number;
    interaction: 'strong' | 'moderate' | 'weak' | 'none';
    confidence: number;
  } {
    const similarity = SimilarityMetrics.cosine(
      this.normalize(this.project(protein1)),
      this.normalize(this.project(protein2))
    );

    let interaction: 'strong' | 'moderate' | 'weak' | 'none';
    let confidence: number;

    if (similarity > 0.8) {
      interaction = 'strong';
      confidence = similarity * 0.95;
    } else if (similarity > 0.5) {
      interaction = 'moderate';
      confidence = similarity * 0.8;
    } else if (similarity > 0.2) {
      interaction = 'weak';
      confidence = similarity * 0.6;
    } else {
      interaction = 'none';
      confidence = (1 - similarity) * 0.7;
    }

    return { similarity, interaction, confidence };
  }
}

export default ContrastiveLearning;
