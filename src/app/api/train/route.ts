import { NextResponse } from 'next/server';
import { getPipeline, resetPipeline } from '@/lib/ml/inference';

export async function POST() {
  try {
    // Reset and retrain the pipeline
    resetPipeline();
    const pipeline = getPipeline();

    // Train with progress tracking
    const initResult = await pipeline.initialize((step, progress) => {
      console.log(`Training: ${step} - ${Math.round(progress * 100)}%`);
    });

    const status = pipeline.getStatus();

    return NextResponse.json({
      success: true,
      message: 'Model training completed successfully',
      metrics: status.metrics,
      modelInfo: {
        numProteins: status.numProteins,
        numPerturbations: status.numPerturbations,
        isTrained: status.isTrained,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error training model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to train model' },
      { status: 500 }
    );
  }
}
