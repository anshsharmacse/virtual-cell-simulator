'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Play, RotateCcw, Zap, Target } from 'lucide-react'

interface Protein {
  id: string
  name: string
  gene: string
  pathway: string
  baselineAbundance: number
}

interface Perturbation {
  id: string
  name: string
  type: string
  targetPathway: string
  intensity: number
}

interface PerturbationPanelProps {
  onRunSimulation: (params: {
    perturbationId: string
    proteinIds: string[]
    intensity: number
  }) => void
  isLoading?: boolean
}

export default function PerturbationPanel({ onRunSimulation, isLoading = false }: PerturbationPanelProps) {
  const [proteins, setProteins] = useState<Protein[]>([])
  const [perturbations, setPerturbations] = useState<Perturbation[]>([])
  const [selectedPerturbation, setSelectedPerturbation] = useState<string>('')
  const [selectedProteins, setSelectedProteins] = useState<string[]>([])
  const [intensity, setIntensity] = useState(0.7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [proteinsRes, perturbationsRes] = await Promise.all([
          fetch('/api/proteins'),
          fetch('/api/perturbations'),
        ])
        
        const proteinsData = await proteinsRes.json()
        const perturbationsData = await perturbationsRes.json()
        
        if (proteinsData.success) {
          setProteins(proteinsData.proteins)
        }
        if (perturbationsData.success) {
          setPerturbations(perturbationsData.perturbations)
          if (perturbationsData.perturbations.length > 0) {
            setSelectedPerturbation(perturbationsData.perturbations[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleProteinToggle = (proteinId: string) => {
    setSelectedProteins(prev => 
      prev.includes(proteinId)
        ? prev.filter(id => id !== proteinId)
        : [...prev, proteinId].slice(0, 10) // Limit to 10 proteins
    )
  }

  const handleRunSimulation = () => {
    if (!selectedPerturbation) return
    
    const proteinIds = selectedProteins.length > 0 
      ? selectedProteins 
      : proteins.slice(0, 10).map(p => p.id)
    
    onRunSimulation({
      perturbationId: selectedPerturbation,
      proteinIds,
      intensity,
    })
  }

  const handleReset = () => {
    setSelectedProteins([])
    setIntensity(0.7)
    if (perturbations.length > 0) {
      setSelectedPerturbation(perturbations[0].id)
    }
  }

  const pathways = [...new Set(proteins.map(p => p.pathway))]

  if (loading) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-teal-400" />
            Perturbation Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Drug Selection */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-600" />
              Select Drug Perturbation
            </label>
            <Select value={selectedPerturbation} onValueChange={setSelectedPerturbation}>
              <SelectTrigger className="w-full border-slate-300 focus:border-teal-500 focus:ring-teal-500">
                <SelectValue placeholder="Select a perturbation" />
              </SelectTrigger>
              <SelectContent>
                {perturbations.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {p.targetPathway}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPerturbation && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-slate-500 mt-1"
              >
                Targets: {perturbations.find(p => p.id === selectedPerturbation)?.targetPathway}
              </motion.p>
            )}
          </div>

          {/* Intensity Slider */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800">
              Perturbation Intensity: <span className="text-teal-600">{intensity.toFixed(2)}</span>
            </label>
            <Slider
              value={[intensity]}
              onValueChange={([value]) => setIntensity(value)}
              min={0.1}
              max={1}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-400">
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </div>

          {/* Protein Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-800">
              Target Proteins ({selectedProteins.length}/10 selected)
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-lg">
              {proteins.slice(0, 20).map(protein => (
                <motion.button
                  key={protein.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleProteinToggle(protein.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedProteins.includes(protein.id)
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-400'
                  }`}
                >
                  {protein.name}
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              {selectedProteins.length === 0 
                ? 'No proteins selected. Top 10 will be used for simulation.' 
                : `${selectedProteins.length} proteins selected for analysis.`}
            </p>
          </div>

          {/* Pathway Legend */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600">Pathway Categories</label>
            <div className="flex flex-wrap gap-1">
              {pathways.slice(0, 6).map(pathway => (
                <Badge key={pathway} variant="secondary" className="text-xs">
                  {pathway}
                </Badge>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={handleRunSimulation}
                disabled={isLoading || !selectedPerturbation}
                className="w-full bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold py-6 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleReset}
                variant="outline"
                className="px-4 border-slate-300 hover:bg-slate-100"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
