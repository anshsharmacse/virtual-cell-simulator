'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useSyncExternalStore, useCallback } from 'react'

// Empty subscription for client-only values
const emptySubscribe = () => () => {}

export default function Hero() {
  // Use useSyncExternalStore for client-only rendering
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/40" />
      
      {/* Floating Orbs - Only render on client to avoid hydration issues */}
      {mounted && (
        <>
          <motion.div
            className="absolute top-20 left-10 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute top-1/2 left-1/3 w-48 h-48 bg-purple-400/15 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 40, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <Image
              src="/logo.png"
              alt="VirtualCell-Simulator Logo"
              fill
              className="object-contain drop-shadow-2xl"
              priority
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-teal-400/20 blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-teal-800 to-blue-900 mb-4 tracking-tight"
        >
          VirtualCell-Simulator
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-700 mb-6"
        >
          AI Framework for Cellular Perturbation Response Prediction
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-base md:text-lg text-slate-600 max-w-3xl mb-8 leading-relaxed"
        >
          Leveraging Variational Autoencoders, Contrastive Learning, and Multi-Task Learning 
          to predict protein abundance changes under drug perturbations with{' '}
          <span className="font-bold text-teal-600">78% correlation</span> to experimental validation data.
        </motion.p>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-3 mb-8"
        >
          {['Python', 'PyTorch', 'VAE', 'Contrastive Learning', 'Multi-Task Learning'].map((tech, index) => (
            <motion.span
              key={tech}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
              className="px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-semibold rounded-full text-sm shadow-lg hover:shadow-xl transition-shadow"
            >
              {tech}
            </motion.span>
          ))}
        </motion.div>

        {/* Author */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-slate-200"
        >
          <div className="w-3 h-3 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-slate-800 font-bold">Developed by</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 font-extrabold text-lg">
            ANSH SHARMA
          </span>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-slate-500"
          >
            <span className="text-sm font-medium">Explore the Model</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
