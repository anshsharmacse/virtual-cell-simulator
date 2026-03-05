'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Sector, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, PieChart as PieChartIcon, Radar as RadarIcon, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PredictionResult {
  proteinId: string
  proteinName: string
  baselineAbundance: number
  predictedAbundance: number
  foldChange: number
  confidence: number
  pathway: string
}

interface PathwayAnalysis {
  pathway: string
  proteinCount: number
  avgFoldChange: number
}

interface ResultsVisualizationProps {
  predictions: PredictionResult[]
  pathwayAnalysis: PathwayAnalysis[]
  correlation: number
}

const COLORS = {
  upregulated: '#10b981',
  downregulated: '#ef4444',
  neutral: '#6b7280',
  teal: '#14b8a6',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  orange: '#f97316',
}

const PATHWAY_COLORS = [
  '#14b8a6', '#3b82f6', '#8b5cf6', '#f97316', '#ef4444', 
  '#10b981', '#6366f1', '#ec4899', '#f59e0b', '#06b6d4'
]

export default function ResultsVisualization({ 
  predictions, 
  pathwayAnalysis, 
  correlation 
}: ResultsVisualizationProps) {
  if (predictions.length === 0) {
    return null
  }

  // Prepare data for bar chart
  const barChartData = predictions.map(p => ({
    name: p.proteinName,
    foldChange: parseFloat(p.foldChange.toFixed(3)),
    confidence: parseFloat((p.confidence * 100).toFixed(1)),
    pathway: p.pathway,
    fill: p.foldChange > 0.2 ? COLORS.upregulated : p.foldChange < -0.2 ? COLORS.downregulated : COLORS.neutral
  }))

  // Prepare data for scatter plot
  const scatterData = predictions.map(p => ({
    name: p.proteinName,
    x: p.baselineAbundance,
    y: p.predictedAbundance,
    z: p.confidence * 100,
    foldChange: p.foldChange,
    pathway: p.pathway
  }))

  // Prepare data for pie chart (pathway distribution)
  const pieData = pathwayAnalysis.map((p, i) => ({
    name: p.pathway,
    value: p.proteinCount,
    avgFoldChange: p.avgFoldChange,
    fill: PATHWAY_COLORS[i % PATHWAY_COLORS.length]
  }))

  // Prepare data for radar chart
  const radarData = pathwayAnalysis.slice(0, 8).map(p => ({
    pathway: p.pathway.length > 15 ? p.pathway.substring(0, 15) + '...' : p.pathway,
    foldChange: Math.abs(p.avgFoldChange),
    fullMark: 2
  }))

  // Calculate summary stats
  const upregulated = predictions.filter(p => p.foldChange > 0.2).length
  const downregulated = predictions.filter(p => p.foldChange < -0.2).length
  const neutral = predictions.filter(p => Math.abs(p.foldChange) <= 0.2).length
  const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length

  const handleDownload = () => {
    const csvContent = [
      ['Protein', 'Gene', 'Pathway', 'Baseline', 'Predicted', 'Fold Change', 'Confidence'].join(','),
      ...predictions.map(p => [
        p.proteinName,
        predictions.find(pr => pr.proteinId === p.proteinId)?.proteinId || '',
        p.pathway,
        p.baselineAbundance.toFixed(2),
        p.predictedAbundance.toFixed(2),
        p.foldChange.toFixed(3),
        (p.confidence * 100).toFixed(1) + '%'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'virtualcell_predictions.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-xs font-medium">Correlation</p>
                  <p className="text-2xl font-bold">{(correlation * 100).toFixed(0)}%</p>
                </div>
                <Activity className="w-8 h-8 text-teal-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs font-medium">Upregulated</p>
                  <p className="text-2xl font-bold">{upregulated}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-xs font-medium">Downregulated</p>
                  <p className="text-2xl font-bold">{downregulated}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs font-medium">Avg Confidence</p>
                  <p className="text-2xl font-bold">{(avgConfidence * 100).toFixed(0)}%</p>
                </div>
                <Target className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Charts */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-400" />
            Prediction Results
          </CardTitle>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="bar" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6 bg-slate-100">
              <TabsTrigger value="bar" className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden md:inline">Fold Change</span>
              </TabsTrigger>
              <TabsTrigger value="scatter" className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                <span className="hidden md:inline">Abundance</span>
              </TabsTrigger>
              <TabsTrigger value="pie" className="flex items-center gap-1">
                <PieChartIcon className="w-4 h-4" />
                <span className="hidden md:inline">Pathways</span>
              </TabsTrigger>
              <TabsTrigger value="radar" className="flex items-center gap-1">
                <RadarIcon className="w-4 h-4" />
                <span className="hidden md:inline">Radar</span>
              </TabsTrigger>
            </TabsList>

            {/* Bar Chart */}
            <TabsContent value="bar">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 11, fill: '#475569' }}
                    />
                    <YAxis 
                      tick={{ fill: '#475569' }}
                      label={{ value: 'Log2 Fold Change', angle: -90, position: 'insideLeft', fill: '#475569' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value: number, name: string) => [
                        name === 'foldChange' ? value.toFixed(3) : value,
                        name === 'foldChange' ? 'Fold Change' : 'Confidence %'
                      ]}
                    />
                    <Bar dataKey="foldChange" radius={[4, 4, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Scatter Plot */}
            <TabsContent value="scatter">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Baseline" 
                      tick={{ fill: '#475569' }}
                      label={{ value: 'Baseline Abundance', position: 'bottom', fill: '#475569' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Predicted"
                      tick={{ fill: '#475569' }}
                      label={{ value: 'Predicted Abundance', angle: -90, position: 'insideLeft', fill: '#475569' }}
                    />
                    <ZAxis type="number" dataKey="z" range={[50, 400]} name="Confidence" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      formatter={(value: number, name: string) => [
                        value.toFixed(2),
                        name
                      ]}
                    />
                    <Scatter data={scatterData} fill="#14b8a6">
                      {scatterData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.foldChange > 0 ? COLORS.upregulated : entry.foldChange < 0 ? COLORS.downregulated : COLORS.neutral} 
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Pie Chart */}
            <TabsContent value="pie">
              <div className="h-[400px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={{ stroke: '#94a3b8' }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {pieData.map((entry, index) => (
                  <Badge key={index} style={{ backgroundColor: entry.fill }} className="text-white">
                    {entry.name}: {entry.value} proteins
                  </Badge>
                ))}
              </div>
            </TabsContent>

            {/* Radar Chart */}
            <TabsContent value="radar">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="pathway" tick={{ fill: '#475569', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 2]} tick={{ fill: '#475569' }} />
                    <Radar
                      name="Fold Change Magnitude"
                      dataKey="foldChange"
                      stroke="#14b8a6"
                      fill="#14b8a6"
                      fillOpacity={0.5}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Detailed Results Table */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-t-lg">
          <CardTitle className="text-lg">Detailed Protein Predictions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-3 text-xs font-bold text-slate-600">Protein</th>
                  <th className="text-left p-3 text-xs font-bold text-slate-600">Pathway</th>
                  <th className="text-right p-3 text-xs font-bold text-slate-600">Baseline</th>
                  <th className="text-right p-3 text-xs font-bold text-slate-600">Predicted</th>
                  <th className="text-right p-3 text-xs font-bold text-slate-600">Fold Change</th>
                  <th className="text-right p-3 text-xs font-bold text-slate-600">Confidence</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {predictions.map((p, index) => (
                    <motion.tr
                      key={p.proteinId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-800">{p.proteinName}</td>
                      <td className="p-3 text-slate-600 text-sm">{p.pathway}</td>
                      <td className="p-3 text-right font-mono text-sm">{p.baselineAbundance.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-sm">{p.predictedAbundance.toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <Badge 
                          variant="outline"
                          className={`font-mono ${
                            p.foldChange > 0.2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            p.foldChange < -0.2 ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {p.foldChange > 0 ? '+' : ''}{p.foldChange.toFixed(3)}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${p.confidence * 100}%` }}
                              transition={{ duration: 0.5, delay: index * 0.02 }}
                              className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"
                            />
                          </div>
                          <span className="text-xs font-mono text-slate-600 w-12">
                            {(p.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
