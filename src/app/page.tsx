'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Hero from '@/components/Hero'
import NeuralNetwork from '@/components/NeuralNetwork'
import PerturbationPanel from '@/components/PerturbationPanel'
import ResultsVisualization from '@/components/ResultsVisualization'
import ModelArchitecture from '@/components/ModelArchitecture'
import { Loader2, ChevronUp } from 'lucide-react'
import { useSyncExternalStore } from 'react'

// Empty subscription for client-only values
const emptySubscribe = () => () => {}

interface PredictionResult {
  proteinId: string
  proteinName: string
  baselineAbundance: number
  predictedAbundance: number
  foldChange: number
  confidence: number
  pathway: string
}

export default function Home() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [pathwayAnalysis, setPathwayAnalysis] = useState<Array<{ pathway: string; proteinCount: number; avgFoldChange: number }>>([])
  const [correlation, setCorrelation] = useState(0.78)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // Use useSyncExternalStore for client-only rendering
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  // Fetch model status on mount
  useEffect(() => {
    const fetchModelStatus = async () => {
      try {
        const res = await fetch('/api/model/status')
        const data = await res.json()
        if (data.success) {
          setCorrelation(data.correlation)
        }
      } catch (error) {
        console.error('Error fetching model status:', error)
      }
    }

    fetchModelStatus()
  }, [])

  const handleRunSimulation = useCallback(async (params: {
    perturbationId: string
    proteinIds: string[]
    intensity: number
  }) => {
    setIsLoading(true)
    setShowResults(false)

    try {
    const res = await fetch('/api/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    const data = await res.json()

    if (data.success) {
      setPredictions(data.predictions)
      setPathwayAnalysis(data.pathwayAnalysis)
      setCorrelation(data.metadata.correlation)
      
      // Animate in the results
      setTimeout(() => {
        setShowResults(true)
      }, 300)
    }
  } catch (error) {
    console.error('Error running simulation:', error)
  } finally {
    setIsLoading(false)
  }
  }, [])

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <Hero />

      {/* Neural Network Visualization Section */}
      <section id="neural-network" className="py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
              Interactive Neural Network
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Explore the VAE architecture. Click on neurons to inspect activations, hover to see connections. Watch data flow through the network in real-time.
            </p>
          </div>
          <NeuralNetwork isAnimating={true} />
        </motion.div>
      </section>

      {/* Main Interactive Section */}
      <section id="simulation" className="py-16 px-4 md:px-8 lg:px-16 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
              Run Perturbation Simulation
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Select a drug perturbation, adjust intensity, and predict protein abundance changes using our AI-powered virtualCell framework.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <PerturbationPanel 
                onRunSimulation={handleRunSimulation}
                isLoading={isLoading}
              />
            </motion.div>

            {/* Model Architecture */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <ModelArchitecture />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <AnimatePresence>
        {showResults && predictions.length > 0 && (
          <motion.section
            id="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-16 px-4 md:px-8 lg:px-16 max-w-7xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
                Simulation Results
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                AI-predicted protein abundance changes with {(correlation * 100).toFixed(0)}% correlation to experimental validation data.
              </p>
            </motion.div>

            <ResultsVisualization
              predictions={predictions}
              pathwayAnalysis={pathwayAnalysis}
              correlation={correlation}
            />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md mx-4"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Running Simulation</h3>
              <p className="text-slate-600 text-sm">
                Processing perturbation through VAE latent space...
              </p>
              <div className="mt-4 flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-teal-500 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
              VirtualCell-Simulator
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto">
              AI Framework for Cellular Perturbation Response Prediction using Variational Autoencoders, Contrastive Learning, and Multi-Task Learning.
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="px-3 py-1 bg-white/10 rounded-full">Python</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">PyTorch</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">VAE</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Next.js</span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-slate-500">
                Developed by{' '}
                <span className="font-bold text-teal-400">ANSH SHARMA</span>
              </p>
            </div>
          </motion.div>
        </div>
      </footer>

      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => scrollToSection('simulation')}
        className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-shadow z-30"
      >
        <ChevronUp className="w-6 h-6" />
      </motion.button>
    </main>
  )
}
