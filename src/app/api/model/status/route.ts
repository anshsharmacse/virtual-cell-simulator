import { NextResponse } from 'next/server';
import { getPipeline } from '@/lib/ml/inference';

export async function GET() {
  try {
    const pipeline = getPipeline();
    const status = pipeline.getStatus();

    return NextResponse.json({
      success: true,
      status: {
        isInitialized: status.isInitialized,
        isTrained: status.isTrained,
        numProteins: status.numProteins,
        numPerturbations: status.numPerturbations,
      },
      metrics: status.metrics,
      modelInfo: {
        type: 'Variational Autoencoder with Contrastive Learning',
        features: [
          'VAE for latent representation learning',
          'Contrastive learning for protein similarity',
          'Multi-task perturbation prediction',
          'Novel perturbation simulation',
        ],
      },
      correlation: status.metrics.correlation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching model status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch model status' },
      { status: 500 }
    );
  }
}
