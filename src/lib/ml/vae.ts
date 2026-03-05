/**
 * Variational Autoencoder (VAE) Implementation
 * For learning latent representations of cellular states
 */

// Matrix utility functions
export class Matrix {
  static zeros(rows: number, cols: number): number[][] {
    return Array(rows).fill(null).map(() => Array(cols).fill(0));
  }

  static random(rows: number, cols: number, scale: number = 0.1): number[][] {
    return Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => (Math.random() - 0.5) * 2 * scale)
    );
  }

  static multiply(a: number[][], b: number[][]): number[][] {
    const rowsA = a.length;
    const colsA = a[0].length;
    const colsB = b[0].length;
    const result = Matrix.zeros(rowsA, colsB);
    
    for (let i = 0; i < rowsA; i++) {
      for (let j = 0; j < colsB; j++) {
        for (let k = 0; k < colsA; k++) {
          result[i][j] += a[i][k] * b[k][j];
        }
      }
    }
    return result;
  }

  static add(a: number[][], b: number[][]): number[][] {
    return a.map((row, i) => row.map((val, j) => val + b[i][j]));
  }

  static transpose(m: number[][]): number[][] {
    const rows = m.length;
    const cols = m[0].length;
    const result = Matrix.zeros(cols, rows);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        result[j][i] = m[i][j];
      }
    }
    return result;
  }

  static elementWise(m: number[][], fn: (x: number) => number): number[][] {
    return m.map(row => row.map(fn));
  }

  static sum(m: number[][]): number {
    return m.reduce((acc, row) => acc + row.reduce((a, b) => a + b, 0), 0);
  }

  static mean(m: number[][]): number {
    return Matrix.sum(m) / (m.length * m[0].length);
  }
}

// Activation functions
export const Activations = {
  relu: (x: number) => Math.max(0, x),
  reluDerivative: (x: number) => x > 0 ? 1 : 0,
  
  sigmoid: (x: number) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x)))),
  sigmoidDerivative: (x: number) => {
    const s = Activations.sigmoid(x);
    return s * (1 - s);
  },
  
  tanh: (x: number) => Math.tanh(x),
  tanhDerivative: (x: number) => 1 - Math.pow(Math.tanh(x), 2),
  
  leakyRelu: (x: number) => x > 0 ? x : 0.01 * x,
  leakyReluDerivative: (x: number) => x > 0 ? 1 : 0.01,
};

// Layer interface
interface Layer {
  weights: number[][];
  biases: number[];
  activation: keyof typeof Activations;
}

// VAE Configuration
export interface VAEConfig {
  inputDim: number;
  latentDim: number;
  hiddenLayers: number[];
  learningRate: number;
}

// VAE Training result
export interface VAETrainingResult {
  epochs: number;
  finalLoss: number;
  reconstructionLoss: number;
  klDivergence: number;
}

// VAE Forward pass result
export interface VAEForwardResult {
  latent: number[];
  reconstruction: number[];
  mu: number[];
  logVar: number[];
}

/**
 * Variational Autoencoder class
 * Implements encoder, decoder, and reparameterization trick
 */
export class VAE {
  private config: VAEConfig;
  private encoderLayers: Layer[] = [];
  private decoderLayers: Layer[] = [];
  private muLayer: Layer;
  private logVarLayer: Layer;
  private isInitialized: boolean = false;

  constructor(config: VAEConfig) {
    this.config = config;
    this.initializeWeights();
  }

  private initializeWeights(): void {
    const { inputDim, latentDim, hiddenLayers } = this.config;
    
    // Build encoder layers
    let prevDim = inputDim;
    for (const hiddenDim of hiddenLayers) {
      this.encoderLayers.push({
        weights: Matrix.random(hiddenDim, prevDim, Math.sqrt(2 / prevDim)),
        biases: Array(hiddenDim).fill(0),
        activation: 'leakyRelu',
      });
      prevDim = hiddenDim;
    }

    // Latent space layers (mu and logVar)
    this.muLayer = {
      weights: Matrix.random(latentDim, prevDim, Math.sqrt(2 / prevDim)),
      biases: Array(latentDim).fill(0),
      activation: 'sigmoid',
    };

    this.logVarLayer = {
      weights: Matrix.random(latentDim, prevDim, Math.sqrt(2 / prevDim)),
      biases: Array(latentDim).fill(0),
      activation: 'sigmoid',
    };

    // Build decoder layers
    prevDim = latentDim;
    const decoderHidden = [...hiddenLayers].reverse();
    for (const hiddenDim of decoderHidden) {
      this.decoderLayers.push({
        weights: Matrix.random(hiddenDim, prevDim, Math.sqrt(2 / prevDim)),
        biases: Array(hiddenDim).fill(0),
        activation: 'leakyRelu',
      });
      prevDim = hiddenDim;
    }

    // Output layer
    this.decoderLayers.push({
      weights: Matrix.random(inputDim, prevDim, Math.sqrt(2 / prevDim)),
      biases: Array(inputDim).fill(0),
      activation: 'sigmoid',
    });

    this.isInitialized = true;
  }

  // Forward pass through a single layer
  private forwardLayer(input: number[], layer: Layer): number[] {
    const inputMatrix = input.map(x => [x]);
    const weightsT = Matrix.transpose(layer.weights);
    const output = Matrix.multiply(weightsT, inputMatrix);
    
    const activationFn = Activations[layer.activation];
    return output.map((row, i) => activationFn(row[0] + layer.biases[i]));
  }

  // Encode input to latent distribution parameters
  encode(input: number[]): { mu: number[]; logVar: number[]; hidden: number[][] } {
    let current = input;
    const hidden: number[][] = [current];

    // Pass through encoder layers
    for (const layer of this.encoderLayers) {
      current = this.forwardLayer(current, layer);
      hidden.push(current);
    }

    // Get mu and logVar
    const mu = this.forwardLayer(current, this.muLayer);
    const logVar = this.forwardLayer(current, this.logVarLayer);

    return { mu, logVar, hidden };
  }

  // Reparameterization trick: z = mu + sigma * epsilon
  reparameterize(mu: number[], logVar: number[]): number[] {
    const sigma = logVar.map(lv => Math.exp(0.5 * lv));
    const epsilon = mu.map(() => Math.random() - 0.5); // Sample from N(0, 1)
    
    return mu.map((m, i) => m + sigma[i] * epsilon[i]);
  }

  // Decode latent vector to reconstruction
  decode(latent: number[]): { reconstruction: number[]; hidden: number[][] } {
    let current = latent;
    const hidden: number[][] = [current];

    // Pass through decoder layers
    for (const layer of this.decoderLayers) {
      current = this.forwardLayer(current, layer);
      hidden.push(current);
    }

    return { reconstruction: current, hidden };
  }

  // Full forward pass
  forward(input: number[]): VAEForwardResult {
    const { mu, logVar } = this.encode(input);
    const latent = this.reparameterize(mu, logVar);
    const { reconstruction } = this.decode(latent);

    return { latent, reconstruction, mu, logVar };
  }

  // Calculate VAE loss
  calculateLoss(input: number[], reconstruction: number[], mu: number[], logVar: number[]): {
    total: number;
    reconstruction: number;
    klDivergence: number;
  } {
    // Reconstruction loss (MSE)
    const reconstructionLoss = input.reduce((sum, x, i) => {
      return sum + Math.pow(x - reconstruction[i], 2);
    }, 0) / input.length;

    // KL Divergence: -0.5 * sum(1 + logVar - mu^2 - exp(logVar))
    const klDivergence = -0.5 * mu.reduce((sum, m, i) => {
      return sum + (1 + logVar[i] - Math.pow(m, 2) - Math.exp(logVar[i]));
    }, 0);

    return {
      total: reconstructionLoss + 0.1 * klDivergence,
      reconstruction: reconstructionLoss,
      klDivergence: klDivergence,
    };
  }

  // Train the VAE
  train(data: number[][], epochs: number = 100, onProgress?: (epoch: number, loss: number) => void): VAETrainingResult {
    let totalLoss = 0;
    let totalReconLoss = 0;
    let totalKL = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let epochLoss = 0;
      let epochReconLoss = 0;
      let epochKL = 0;

      for (const sample of data) {
        // Forward pass
        const { reconstruction, mu, logVar } = this.forward(sample);
        
        // Calculate loss
        const loss = this.calculateLoss(sample, reconstruction, mu, logVar);
        epochLoss += loss.total;
        epochReconLoss += loss.reconstruction;
        epochKL += loss.klDivergence;

        // Simplified gradient descent (update weights in direction of reconstruction)
        this.backpropagate(sample, reconstruction, mu, logVar);
      }

      totalLoss = epochLoss / data.length;
      totalReconLoss = epochReconLoss / data.length;
      totalKL = epochKL / data.length;

      if (onProgress && epoch % 10 === 0) {
        onProgress(epoch, totalLoss);
      }
    }

    return {
      epochs,
      finalLoss: totalLoss,
      reconstructionLoss: totalReconLoss,
      klDivergence: totalKL,
    };
  }

  // Backpropagation (simplified implementation)
  private backpropagate(
    input: number[],
    reconstruction: number[],
    mu: number[],
    logVar: number[]
  ): void {
    const lr = this.config.learningRate;

    // Calculate output gradient
    const outputGrad = input.map((x, i) => 2 * (reconstruction[i] - x) / input.length);

    // Update decoder weights (gradient descent)
    for (let layerIdx = this.decoderLayers.length - 1; layerIdx >= 0; layerIdx--) {
      const layer = this.decoderLayers[layerIdx];
      
      // Update biases
      for (let i = 0; i < layer.biases.length; i++) {
        layer.biases[i] -= lr * outputGrad[i] * 0.1;
      }
      
      // Update weights with small random perturbation (simplified)
      for (let i = 0; i < layer.weights.length; i++) {
        for (let j = 0; j < layer.weights[i].length; j++) {
          layer.weights[i][j] -= lr * outputGrad[i % outputGrad.length] * 0.01;
        }
      }
    }

    // KL divergence gradient for mu and logVar
    const muGrad = mu.map((m, i) => -m * 0.1);
    const logVarGrad = logVar.map((lv, i) => -0.5 * (1 - Math.exp(lv)) * 0.1);

    // Update mu layer
    for (let i = 0; i < this.muLayer.biases.length; i++) {
      this.muLayer.biases[i] -= lr * muGrad[i];
    }

    // Update logVar layer
    for (let i = 0; i < this.logVarLayer.biases.length; i++) {
      this.logVarLayer.biases[i] -= lr * logVarGrad[i];
    }
  }

  // Get latent representation
  getLatent(input: number[]): number[] {
    const { mu } = this.encode(input);
    return mu;
  }

  // Generate from latent
  generate(latent: number[]): number[] {
    const { reconstruction } = this.decode(latent);
    return reconstruction;
  }

  // Get model info
  getModelInfo(): {
    inputDim: number;
    latentDim: number;
    hiddenLayers: number[];
    totalParameters: number;
  } {
    let totalParams = 0;

    // Count encoder parameters
    for (const layer of this.encoderLayers) {
      totalParams += layer.weights.length * layer.weights[0].length + layer.biases.length;
    }

    // Count latent layer parameters
    totalParams += this.muLayer.weights.length * this.muLayer.weights[0].length + this.muLayer.biases.length;
    totalParams += this.logVarLayer.weights.length * this.logVarLayer.weights[0].length + this.logVarLayer.biases.length;

    // Count decoder parameters
    for (const layer of this.decoderLayers) {
      totalParams += layer.weights.length * layer.weights[0].length + layer.biases.length;
    }

    return {
      inputDim: this.config.inputDim,
      latentDim: this.config.latentDim,
      hiddenLayers: this.config.hiddenLayers,
      totalParameters: totalParams,
    };
  }
}

export default VAE;
