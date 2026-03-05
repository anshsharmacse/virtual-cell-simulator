'use client'

import { motion } from 'framer-motion'
import { useState, useMemo, useSyncExternalStore } from 'react'

interface Neuron {
  id: string
  x: number
  y: number
  layer: number
  label?: string
  activation?: number
}

interface Connection {
  from: string
  to: string
  weight: number
}

interface NeuralNetworkProps {
  onNeuronClick?: (neuron: Neuron) => void
  onNeuronHover?: (neuron: Neuron | null) => void
  isAnimating?: boolean
}

// Seeded random number generator for consistent values
function seededRandom(seed: number): () => number {
  let s = seed
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

// Empty subscription for client-only values
const emptySubscribe = () => () => {}

export default function NeuralNetwork({ onNeuronClick, onNeuronHover, isAnimating = true }: NeuralNetworkProps) {
  const [hoveredNeuron, setHoveredNeuron] = useState<Neuron | null>(null)
  const [selectedNeuron, setSelectedNeuron] = useState<Neuron | null>(null)
  
  // Use useSyncExternalStore for client-only rendering
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  // Define network architecture
  const layers = [
    { name: 'Input', neurons: 6, label: 'Cell State' },
    { name: 'Encoder', neurons: 8, label: 'Encoder' },
    { name: 'Latent', neurons: 4, label: 'Latent μ,σ' },
    { name: 'Decoder', neurons: 8, label: 'Decoder' },
    { name: 'Output', neurons: 6, label: 'Prediction' },
  ]

  const width = 900
  const height = 400
  const paddingX = 80
  const paddingY = 50

  // Generate neurons with deterministic positions
  const neurons = useMemo(() => {
    const neuronList: Neuron[] = []
    const layerSpacing = (width - 2 * paddingX) / (layers.length - 1)

    layers.forEach((layer, layerIndex) => {
      const x = paddingX + layerIndex * layerSpacing
      const neuronSpacing = (height - 2 * paddingY) / (layer.neurons + 1)

      for (let i = 0; i < layer.neurons; i++) {
        const y = paddingY + (i + 1) * neuronSpacing
        // Use deterministic activation based on indices
        const activation = 0.5 + (Math.sin(layerIndex * 100 + i * 50) + 1) / 4
        neuronList.push({
          id: `${layerIndex}-${i}`,
          x,
          y,
          layer: layerIndex,
          label: layer.label,
          activation,
        })
      }
    })

    return neuronList
  }, [])

  // Generate connections with deterministic pattern
  const connections = useMemo(() => {
    const connectionList: Connection[] = []
    const random = seededRandom(42) // Fixed seed for consistency
    
    for (let l = 0; l < layers.length - 1; l++) {
      const currentLayerNeurons = neurons.filter(n => n.layer === l)
      const nextLayerNeurons = neurons.filter(n => n.layer === l + 1)

      currentLayerNeurons.forEach(from => {
        nextLayerNeurons.forEach(to => {
          // Use seeded random for deterministic connection pattern
          if (random() > 0.3) {
            connectionList.push({
              from: from.id,
              to: to.id,
              weight: random() * 2 - 1,
            })
          }
        })
      })
    }

    return connectionList
  }, [neurons])

  const getNeuronById = (id: string) => neurons.find(n => n.id === id)

  const handleNeuronClick = (neuron: Neuron) => {
    setSelectedNeuron(neuron)
    onNeuronClick?.(neuron)
  }

  const handleNeuronHover = (neuron: Neuron | null) => {
    setHoveredNeuron(neuron)
    onNeuronHover?.(neuron)
  }

  // Generate particle data with fixed seed
  const particleConnections = useMemo(() => {
    const random = seededRandom(123)
    return connections
      .filter(() => random() > 0.7)
      .slice(0, 15)
  }, [connections])

  if (!mounted) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
        <div className="h-[400px] flex items-center justify-center">
          <div className="text-white text-lg">Loading Neural Network...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl">
      {/* Title */}
      <div className="absolute top-4 left-6 right-6 flex justify-between items-center z-10">
        <h3 className="text-white font-bold text-lg">Neural Network Architecture</h3>
        <div className="flex gap-2">
          {layers.map((layer, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs text-white font-medium"
            >
              {layer.name}
            </motion.div>
          ))}
        </div>
      </div>

      {/* SVG Canvas */}
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mt-8">
        {/* Definitions for gradients and filters */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Connections */}
        <g className="connections">
          {connections.map((connection, index) => {
            const fromNeuron = getNeuronById(connection.from)
            const toNeuron = getNeuronById(connection.to)
            if (!fromNeuron || !toNeuron) return null

            const isHighlighted = 
              hoveredNeuron?.id === fromNeuron.id || 
              hoveredNeuron?.id === toNeuron.id ||
              selectedNeuron?.id === fromNeuron.id ||
              selectedNeuron?.id === toNeuron.id

            return (
              <motion.line
                key={index}
                x1={fromNeuron.x}
                y1={fromNeuron.y}
                x2={toNeuron.x}
                y2={toNeuron.y}
                stroke={isHighlighted ? "#14b8a6" : "#475569"}
                strokeWidth={isHighlighted ? 2 : 0.5}
                strokeOpacity={isHighlighted ? 1 : 0.3}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: index * 0.001 }}
              />
            )
          })}
        </g>

        {/* Data Flow Particles */}
        {isAnimating && particleConnections.map((connection, index) => {
          const fromNeuron = getNeuronById(connection.from)
          const toNeuron = getNeuronById(connection.to)
          if (!fromNeuron || !toNeuron) return null

          return (
            <motion.circle
              key={`particle-${index}`}
              r={3}
              fill="#14b8a6"
              filter="url(#glow)"
              initial={{ cx: fromNeuron.x, cy: fromNeuron.y, opacity: 0 }}
              animate={{
                cx: [fromNeuron.x, toNeuron.x],
                cy: [fromNeuron.y, toNeuron.y],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: index * 0.3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          )
        })}

        {/* Neurons */}
        {neurons.map((neuron, index) => {
          const isHovered = hoveredNeuron?.id === neuron.id
          const isSelected = selectedNeuron?.id === neuron.id
          const isHighlighted = isHovered || isSelected

          return (
            <g key={neuron.id}>
              {/* Neuron Glow */}
              <motion.circle
                cx={neuron.x}
                cy={neuron.y}
                r={isHighlighted ? 24 : 20}
                fill={isHighlighted ? "#14b8a6" : "transparent"}
                fillOpacity={0.2}
                filter="url(#glow)"
                animate={{
                  r: isHighlighted ? [24, 28, 24] : [20, 22, 20],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              {/* Neuron Core */}
              <motion.circle
                cx={neuron.x}
                cy={neuron.y}
                r={16}
                className={`cursor-pointer`}
                fill={`url(#gradient-${neuron.layer})`}
                stroke={isHighlighted ? "#14b8a6" : "#64748b"}
                strokeWidth={isHighlighted ? 3 : 1}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.02 }}
                whileHover={{ scale: 1.2 }}
                onMouseEnter={() => handleNeuronHover(neuron)}
                onMouseLeave={() => handleNeuronHover(null)}
                onClick={() => handleNeuronClick(neuron)}
              />

              {/* Gradient definitions per layer */}
              <defs>
                <radialGradient id={`gradient-${neuron.layer}`} cx="30%" cy="30%">
                  <stop offset="0%" stopColor={neuron.layer === 0 ? '#14b8a6' : neuron.layer === 2 ? '#8b5cf6' : '#3b82f6'} />
                  <stop offset="100%" stopColor={neuron.layer === 0 ? '#0d9488' : neuron.layer === 2 ? '#6d28d9' : '#1d4ed8'} />
                </radialGradient>
              </defs>
            </g>
          )
        })}

        {/* Layer Labels */}
        {layers.map((layer, index) => {
          const layerSpacing = (width - 2 * paddingX) / (layers.length - 1)
          const x = paddingX + index * layerSpacing
          return (
            <text
              key={index}
              x={x}
              y={height - 15}
              textAnchor="middle"
              className="fill-white text-xs font-medium"
            >
              {layer.label}
            </text>
          )
        })}
      </svg>

      {/* Tooltip */}
      {hoveredNeuron && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/80 backdrop-blur-sm rounded-lg text-white text-sm"
        >
          <span className="font-bold">{layers[hoveredNeuron.layer].label}</span>
          <span className="text-slate-400 ml-2">Layer {hoveredNeuron.layer + 1}</span>
          <span className="text-teal-400 ml-2">Activation: {(hoveredNeuron.activation || 0).toFixed(2)}</span>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-6 flex gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-teal-500" />
          <span>Input</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Hidden</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Latent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Output</span>
        </div>
      </div>
    </div>
  )
}
