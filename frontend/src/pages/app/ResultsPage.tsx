import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { PageTransition, BlurReveal } from '../../components/motion';
import { AnalysisImage } from '../../components/analysis/AnalysisImage';
import type { SkinAnalysisResponse } from '../../types/analysis';
import { ChevronLeft, Sun, Moon, ArrowRight, ArrowLeft } from 'lucide-react';

interface RoutineStep {
  step_name: string;
  category: string;
  product_type: string;
  ingredient: string;
  why: string;
  instructions: string;
  frequency: string;
  warnings?: string;
  recommended_product?: string;
}

interface TimelinePhase {
  phase: string;
  expected_results: string;
  adjustments?: string;
}

interface RecommendationResponse {
  engine_version: string;
  created_at: string;
  morning_routine: RoutineStep[];
  night_routine: RoutineStep[];
  weekly_schedule: string;
  introduction_schedule: string;
  patch_test_instructions: string;
  timeline: TimelinePhase[];
}

export const ResultsPage: React.FC = () => {
  const { analysisId: id } = useParams<{ analysisId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shouldShowRoutine = searchParams.get('routine') === 'ready';

  const simplifyText = (text: string) => {
    let result = text;
    const map: Record<string, string> = {
      'Erythema & Vascularity': 'Redness & Sensitivity',
      'Sebum & Barrier Regulation': 'Oiliness & Barrier',
      'Surface Texture & Follicular Tone': 'Texture & Pores',
      'Hyperpigmentation & Melanin Distribution': 'Dark Spots & Pigmentation',
      'Acne Vulgaris & Inflammatory Lesions': 'Acne & Breakouts',
      'Photoaging & Structural Integrity': 'Aging & Fine Lines',
      'Erythema': 'Redness',
      'Sebum': 'Oil',
      'Follicular': 'Pore',
      'ROIs': 'Areas'
    };
    Object.keys(map).forEach(k => {
      result = result.replace(new RegExp(k, 'g'), map[k]);
    });
    return result;
  };

  const [analysis, setAnalysis] = useState<SkinAnalysisResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const analysisData = await api.get<SkinAnalysisResponse>(`/analyses/${id}`);
        setAnalysis(analysisData);

        const recData = await api.get<RecommendationResponse | null>('/recommendations/latest');
        setRecommendation(recData);
      } catch (e) {
        setError("Failed to load clinical results.");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -window.innerWidth * 0.8, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: window.innerWidth * 0.8, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-transparent overflow-hidden">
          <div className="w-8 h-8 border-2 border-[#26384B]/20 border-t-blue-500 rounded-full animate-spin mb-8" />
          <Typography variant="body" className="text-[#4C6072] uppercase tracking-widest text-xs">Retrieving Clinical Data</Typography>
        </div>
      </PageTransition>
    );
  }

  if (error || !analysis) {
    return (
      <PageTransition>
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-transparent overflow-hidden text-center">
          <Typography variant="h3" className="text-[#26384B] mb-4">Unavailable</Typography>
          <Typography variant="body" className="text-[#4C6072] mb-8">{error || "Analysis not found."}</Typography>
          <Link to="/app/history">
            <Button variant="secondary" className="rounded-full px-8 border-none shadow-sm">Return to Archives</Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  const ml = analysis.ml_results;

  // Glassy airy card class
  const vaultCardClasses = "w-full h-full bg-white/40 backdrop-blur-[40px] border border-white/60 rounded-[32px] p-8 flex flex-col relative overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50";

  return (
    <PageTransition>
      <div className="h-screen w-screen bg-transparent overflow-hidden flex flex-col relative selection:bg-blue-500/30 selection:text-white">
        
        {/* Header / Nav */}
        <header className="absolute top-0 left-0 right-0 h-24 px-8 md:px-16 flex items-center justify-between z-50 pointer-events-none">
          <Link
            to="/app/history"
            className="pointer-events-auto flex items-center gap-2 text-[#4C6072] hover:text-[#26384B] transition-colors bg-white/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-[#26384B]/10 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-widest uppercase">Archive</span>
          </Link>
          <div className="flex gap-3 pointer-events-auto">
            <button onClick={scrollLeft} className="w-11 h-11 rounded-full bg-white/50 backdrop-blur-md border border-[#26384B]/10 flex items-center justify-center text-[#26384B] hover:bg-white transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button onClick={scrollRight} className="w-11 h-11 rounded-full bg-white/50 backdrop-blur-md border border-[#26384B]/10 flex items-center justify-center text-[#26384B] hover:bg-white transition-all shadow-sm">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Lateral Scroll Container */}
        <div 
          ref={containerRef}
          className="flex-1 w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex items-center no-scrollbar relative z-10 pt-28 pb-8"
        >
          <div className="flex gap-8 px-8 md:px-16 items-stretch h-[85vh] min-w-max">
            
            {/* Card 1: Overview & Image */}
            <div className="w-[90vw] md:w-[45vw] lg:w-[35vw] snap-center shrink-0 h-full py-4">
              <div className={vaultCardClasses}>
                <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
                <div className="shrink-0 mb-6 relative z-10">
                  <BlurReveal>
                    <h1 className="text-3xl md:text-4xl font-sans font-bold text-[#26384B] tracking-tight mb-1">
                      Analysis
                    </h1>
                    <p className="text-[10px] uppercase font-mono tracking-widest text-[#4C6072] font-bold">
                      {new Date(analysis.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </BlurReveal>
                </div>

                <div className="flex-1 w-full relative rounded-2xl overflow-hidden bg-white/50 border border-white/60 shadow-inner min-h-0 z-10">
                  <AnalysisImage
                    analysisId={analysis.id}
                    alt="Clinical Capture"
                    className="w-full h-full object-cover"
                  />
                  
                  {ml && (
                    <div className="absolute bottom-4 left-4 right-4 flex gap-3">
                      <div className="flex-1 bg-white/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/60 shadow-sm">
                        <p className="text-[10px] uppercase tracking-widest text-blue-600 font-mono font-bold mb-1">Confidence</p>
                        <p className="text-xl font-sans font-bold tracking-tight text-[#26384B]">
                          {Math.round(ml.concerns?.reduce((acc, c) => acc + (c.confidence ?? 0), 0) / (ml.concerns?.length || 1) || 0)}%
                        </p>
                      </div>
                      <div className="flex-1 bg-white/80 backdrop-blur-md px-4 py-3 rounded-xl border border-white/60 shadow-sm">
                        <p className="text-[10px] uppercase tracking-widest text-blue-600 font-mono font-bold mb-1">Issues</p>
                        <p className="text-xl font-sans font-bold tracking-tight text-[#26384B]">
                          {ml.concerns?.length || 0} Found
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: Detected Concerns */}
            {ml?.concerns && ml.concerns.length > 0 && (
              <div className="w-[90vw] md:w-[45vw] lg:w-[35vw] snap-center shrink-0 h-full py-4">
                <div className={vaultCardClasses}>
                  <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
                  <div className="shrink-0 mb-6 flex items-center justify-between relative z-10">
                    <h2 className="text-2xl font-sans font-bold tracking-tight text-[#26384B]">
                      Primary Concerns
                    </h2>
                    <span className="text-[10px] uppercase tracking-widest bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full font-mono text-blue-700 font-bold shadow-sm">
                      {ml.concerns.length} Items
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar min-h-0 pb-4 relative z-10">
                    {ml.concerns.map((concern, idx) => (
                      <div key={idx} className="p-5 bg-white/60 border border-white/60 rounded-2xl hover:border-blue-300 hover:bg-white/90 transition-colors shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-sans font-bold tracking-tight text-[#26384B] text-xl">{simplifyText(concern.name)}</h3>
                          <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-md">
                            {concern.confidence}%
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-[#4C6072] mb-3">
                          Clinical definition: {concern.name}
                        </p>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#C67C5A] mb-3">
                          {concern.severity} Severity
                        </p>
                        <p className="text-sm font-light leading-relaxed text-[#4C6072]">{simplifyText(concern.explanation)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Card 3: Clinical Observations */}
            {ml?.observations && ml.observations.length > 0 && (
              <div className="w-[90vw] md:w-[50vw] lg:w-[40vw] snap-center shrink-0 h-full py-4">
                <div className={vaultCardClasses}>
                  <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
                  <div className="shrink-0 mb-6 relative z-10">
                    <h2 className="text-2xl font-sans font-bold tracking-tight text-[#26384B]">Clinical Insights</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar min-h-0 pb-4 relative z-10">
                    {ml.observations.map((obs, idx) => (
                      <div key={idx} className="p-6 bg-gradient-to-br from-white/60 to-white/30 border border-white/60 rounded-2xl shadow-sm">
                        <p className="font-sans font-bold tracking-tight text-[#26384B] text-lg mb-4">{simplifyText(obs.observation)}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#4C6072] font-light">
                          <div>
                            <span className="block text-[10px] uppercase tracking-widest font-mono font-bold text-blue-600 mb-1">Reason</span>
                            <span className="text-[#26384B] font-light">{simplifyText(obs.reason)}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-widest font-mono font-bold text-blue-600 mb-1">Outcome</span>
                            <span className="text-[#26384B] font-light">{simplifyText(obs.expected_improvement)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Card 4: Routine (Morning) */}
            {shouldShowRoutine && recommendation && (
              <div className="w-[90vw] md:w-[60vw] lg:w-[45vw] snap-center shrink-0 h-full py-4">
                <div className={vaultCardClasses}>
                  <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
                  <div className="shrink-0 flex items-center justify-between mb-8 relative z-10">
                    <h2 className="text-2xl font-sans font-bold tracking-tight text-[#26384B]">Morning Protocol</h2>
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-sm">
                      <Sun className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar min-h-0 pb-4 relative z-10">
                    {recommendation.morning_routine.map((item, i) => (
                      <div key={`am-${i}`} className="p-6 bg-white/60 border border-white/60 rounded-2xl hover:border-amber-300 hover:bg-white/90 transition-colors shadow-sm">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#4C6072] mb-1">
                          {item.step_name} · {item.product_type}
                        </p>
                        <p className="font-sans font-bold tracking-tight text-[#26384B] text-xl mb-3 capitalize">
                          {item.category.replace(/_/g, ' ')}
                        </p>
                        {item.recommended_product && (
                          <div className="mb-4 px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 inline-block">
                            <span className="text-xs font-mono font-medium text-[#26384B]">
                              Match: {item.recommended_product}
                            </span>
                          </div>
                        )}
                        <p className="text-sm font-light text-[#4C6072] mb-4">{item.why}</p>
                        <div className="text-xs font-light text-[#26384B] bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/60 leading-relaxed shadow-inner">
                          <strong className="text-amber-600 mr-2 uppercase font-mono tracking-wider text-[10px]">Apply:</strong> 
                          {item.instructions}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Card 5: Routine (Night) */}
            {shouldShowRoutine && recommendation && (
              <div className="w-[90vw] md:w-[60vw] lg:w-[45vw] snap-center shrink-0 h-full py-4">
                <div className={vaultCardClasses}>
                  <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
                  <div className="shrink-0 flex items-center justify-between mb-8 relative z-10">
                    <h2 className="text-2xl font-sans font-bold tracking-tight text-[#26384B]">Night Protocol</h2>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-500 shadow-sm">
                      <Moon className="w-5 h-5" />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-3 space-y-4 custom-scrollbar min-h-0 pb-4 relative z-10">
                    {recommendation.night_routine.map((item, i) => (
                      <div key={`pm-${i}`} className="p-6 bg-white/60 border border-white/60 rounded-2xl hover:border-indigo-300 hover:bg-white/90 transition-colors shadow-sm">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#4C6072] mb-1">
                          {item.step_name} · {item.product_type}
                        </p>
                        <p className="font-sans font-bold tracking-tight text-[#26384B] text-xl mb-3 capitalize">
                          {item.category.replace(/_/g, ' ')}
                        </p>
                        {item.recommended_product && (
                          <div className="mb-4 px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200 inline-block">
                            <span className="text-xs font-mono font-medium text-[#26384B]">
                              Match: {item.recommended_product}
                            </span>
                          </div>
                        )}
                        <p className="text-sm font-light text-[#4C6072] mb-4">{item.why}</p>
                        <div className="text-xs font-light text-[#26384B] bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-white/60 leading-relaxed shadow-inner">
                          <strong className="text-indigo-600 mr-2 uppercase font-mono tracking-wider text-[10px]">Apply:</strong> 
                          {item.instructions}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Card 6: Strategy & Timeline */}
            {shouldShowRoutine && recommendation && (
              <div className="w-[90vw] md:w-[50vw] lg:w-[40vw] snap-center shrink-0 h-full py-4">
                <div className={vaultCardClasses}>
                  <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
                  <div className="shrink-0 mb-8 relative z-10">
                    <h2 className="text-2xl font-sans font-bold tracking-tight text-[#26384B]">Strategy & Milestones</h2>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-3 space-y-6 custom-scrollbar min-h-0 pb-4 relative z-10">
                    <div className="bg-white/60 p-6 rounded-2xl border border-white/60 shadow-sm">
                      <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-blue-600 mb-3">Introduction Phase</p>
                      <p className="text-sm font-light text-[#4C6072] leading-relaxed">{recommendation.introduction_schedule}</p>
                    </div>

                    <div className="bg-white/60 p-6 rounded-2xl border border-white/60 shadow-sm">
                      <p className="text-[10px] font-mono uppercase tracking-widest font-bold text-blue-600 mb-4">Timeline</p>
                      <div className="space-y-5">
                        {recommendation.timeline.map((phase, i) => (
                          <div key={i} className="flex gap-4">
                            <div className="w-16 shrink-0 text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1.5 rounded-lg text-center h-min">{phase.phase}</div>
                            <div className="flex-1 pb-4 border-b border-white/60">
                              <p className="text-sm font-light text-[#26384B]">{phase.expected_results}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Card (If no routine yet) */}
            {!shouldShowRoutine && (
              <div className="w-[90vw] md:w-[40vw] lg:w-[30vw] snap-center shrink-0 h-full py-4 flex items-center justify-center">
                <div className={vaultCardClasses + " items-center justify-center text-center p-8"}>
                  <div className="absolute inset-0 pointer-events-none rounded-[32px] shadow-[inset_0_0_100px_rgba(59,130,246,0.05)]" />
                  <div className="w-20 h-20 mx-auto bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)] mb-6 relative z-10">
                    <Sun className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-sans font-bold tracking-tight text-[#26384B] mb-4 relative z-10">Build Routine</h2>
                  <p className="text-[#4C6072] font-light text-sm mb-8 max-w-[250px] relative z-10">Generate a personalized skincare protocol based on these findings.</p>
                  <Link to={`/app/routine-selection/${id}`} className="relative z-10">
                    <Button className="rounded-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white border-none shadow-[0_4px_15px_rgba(59,130,246,0.3)]">
                      Start Consultation
                    </Button>
                  </Link>
                </div>
              </div>
            )}
            
            {/* End spacer to allow last card to center properly */}
            <div className="w-[5vw] shrink-0"></div>
          </div>
        </div>
      </div>
      
      {/* Global styles to hide horizontal scrollbar for the container, and style vertical scrollbars inside cards */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </PageTransition>
  );
};
