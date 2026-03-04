import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Activity, AlertTriangle, CheckCircle, BrainCircuit, Network, ArrowRight, Loader2, Search, Database } from 'lucide-react';
import { portalApi } from '../services/portalApi';
import { CampaignAnalysisResult } from '../portalTypes';

const CampaignAnalysis: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [result, setResult] = useState<CampaignAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown', 'text/plain'];
    // Note: MIME types for markdown can vary, so we check extension too
    const isMarkdown = selectedFile.name.endsWith('.md') || selectedFile.name.endsWith('.markdown');
    
    if (validTypes.includes(selectedFile.type) || isMarkdown) {
      setFile(selectedFile);
      setStatus('idle');
      setResult(null);
    } else {
      alert("Invalid file type. Please upload PDF, DOCX, or Markdown.");
    }
  };

  const startAnalysis = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(10);

    try {
      // 1. Upload
      const uploadRes = await portalApi.uploadCampaignFile(file);
      
      setStatus('processing');
      
      // Simulate progressive updates
      setProcessingStage('Chunking Document...');
      setProgress(30);
      await new Promise(r => setTimeout(r, 1000));
      
      setProcessingStage('Querying Knowledge Graph...');
      setProgress(50);
      await new Promise(r => setTimeout(r, 1500));
      
      setProcessingStage('Analyzing OSINT Correlation...');
      setProgress(75);
      await new Promise(r => setTimeout(r, 1500));
      
      setProcessingStage('Generating Predictive Summation...');
      setProgress(90);

      // 2. Process
      const analysisRes = await portalApi.processCampaignAnalysis(uploadRes.data.analysis_id);
      
      setResult(analysisRes.data);
      setStatus('complete');
      setProgress(100);

    } catch (error) {
      console.error("Analysis failed:", error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-charcoal text-white font-sans flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-white/10 bg-neutral-900/90 backdrop-blur flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <ArrowRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <h1 className="font-display text-lg tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-purpose-gold" />
            Campaign Impact Analysis
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
           <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
              <Database className="w-3 h-3 text-cyan-400" />
              <span className="text-cyan-400">KG INTEGRATION ACTIVE</span>
           </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Panel: Upload & Status */}
        <div className="w-full lg:w-1/3 border-r border-white/10 bg-neutral-900 p-8 flex flex-col gap-8 z-20 shadow-xl overflow-y-auto">
          
          <div>
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Document Ingestion</h3>
            
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-purpose-gold bg-purpose-gold/10' 
                  : file 
                    ? 'border-green-500/50 bg-green-500/5' 
                    : 'border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.docx,.md,.txt" 
                onChange={handleFileSelect} 
              />
              
              {file ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-sm font-medium text-white">{file.name}</div>
                  <div className="text-xs text-gray-500 font-mono">{(file.size / 1024).toFixed(1)} KB</div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setFile(null); setStatus('idle'); }}
                    className="text-xs text-red-400 hover:text-red-300 mt-2 underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <UploadCloud className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">Drag & Drop or Click to Upload</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-60">PDF, DOCX, Markdown</p>
                </div>
              )}
            </div>
          </div>

          {/* Processing Status */}
          <AnimatePresence>
            {(status === 'uploading' || status === 'processing') && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="flex justify-between text-xs font-mono text-gray-400">
                  <span>STATUS</span>
                  <span className="text-purpose-gold animate-pulse">{status === 'uploading' ? 'UPLOADING...' : processingStage.toUpperCase()}</span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-purpose-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                   <div className={`p-2 rounded border text-[10px] font-mono flex items-center gap-2 ${progress > 20 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-neutral-800 border-white/5 text-gray-600'}`}>
                      <FileText className="w-3 h-3" /> Chunking
                   </div>
                   <div className={`p-2 rounded border text-[10px] font-mono flex items-center gap-2 ${progress > 40 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-neutral-800 border-white/5 text-gray-600'}`}>
                      <Database className="w-3 h-3" /> KG Query
                   </div>
                   <div className={`p-2 rounded border text-[10px] font-mono flex items-center gap-2 ${progress > 60 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-neutral-800 border-white/5 text-gray-600'}`}>
                      <Search className="w-3 h-3" /> OSINT
                   </div>
                   <div className={`p-2 rounded border text-[10px] font-mono flex items-center gap-2 ${progress > 80 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-neutral-800 border-white/5 text-gray-600'}`}>
                      <BrainCircuit className="w-3 h-3" /> Prediction
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-auto">
            <button
              onClick={startAnalysis}
              disabled={!file || status === 'uploading' || status === 'processing'}
              className="w-full py-4 bg-purpose-gold text-black font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'processing' || status === 'uploading' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" /> Run Impact Analysis
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="flex-1 bg-neutral-950 p-8 overflow-y-auto relative">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            
            {!result && status !== 'processing' && status !== 'uploading' && (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4 mt-20 opacity-50">
                <BrainCircuit className="w-16 h-16" />
                <p className="font-mono text-sm">Awaiting Campaign Data for Predictive Modeling</p>
              </div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* High Level Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Adversarial Alignment</div>
                    <div className={`text-3xl font-mono font-bold ${result.adversarial_alignment_score > 70 ? 'text-red-500' : 'text-yellow-500'}`}>
                      {result.adversarial_alignment_score}%
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2">Correlation with known threat actor TTPs</div>
                  </div>
                  
                  <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Competitive Impact</div>
                    <div className={`text-3xl font-mono font-bold ${result.competitive_impact_score > 70 ? 'text-red-500' : 'text-yellow-500'}`}>
                      {result.competitive_impact_score}%
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2">Projected market sentiment shift</div>
                  </div>

                  <div className="bg-neutral-900 border border-white/10 p-6 rounded-xl">
                    <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">KG Enrichment</div>
                    <div className="text-3xl font-mono font-bold text-cyan-400">
                      +{result.knowledge_graph_nodes_matched}
                    </div>
                    <div className="text-[10px] text-gray-600 mt-2">New nodes/edges integrated into core graph</div>
                  </div>
                </div>

                {/* Predictive Summation */}
                <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purpose-gold" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Predictive Summation</h3>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-xs font-mono text-gray-500 uppercase mb-2">Executive Summary</h4>
                      <p className="text-gray-300 leading-relaxed text-sm border-l-2 border-purpose-gold pl-4">
                        {result.predictive_summation.summary}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-mono text-gray-500 uppercase mb-3">Identified Risks</h4>
                        <ul className="space-y-2">
                          {result.predictive_summation.key_risks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-mono text-gray-500 uppercase mb-3">Adversarial Actors</h4>
                        <div className="flex flex-wrap gap-2">
                          {result.predictive_summation.adversarial_actors.map((actor, i) => (
                            <span key={i} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-mono">
                              {actor}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                       <h4 className="text-xs font-mono text-gray-500 uppercase mb-2">Market Reaction Prediction</h4>
                       <div className="bg-neutral-950 p-4 rounded border border-white/5 text-sm text-cyan-300 font-mono">
                          {result.predictive_summation.market_reaction_prediction}
                       </div>
                    </div>
                  </div>
                </div>

                {/* Continuous Learning Badge */}
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-gray-500 opacity-70">
                   <Network className="w-3 h-3" />
                   <span>System learning from {result.chunks_processed} document chunks. Knowledge Graph updated.</span>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalysis;
