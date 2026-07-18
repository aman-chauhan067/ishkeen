import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import { Container } from '../../components/ui/Container';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { PageTransition, Fade, Stagger, StaggerItem, BlurReveal } from '../../components/motion';
import { AmbientGlow } from '../../components/motion/AmbientGlow';
import { AnalysisImage } from '../../components/analysis/AnalysisImage';
import { Doodle } from '../../components/illustrations/Doodle';
import type { SkinAnalysisResponse } from '../../types/analysis';
import { ChevronLeft, Info } from 'lucide-react';

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

  const [analysis, setAnalysis] = useState<SkinAnalysisResponse | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showRoutine] = useState(shouldShowRoutine);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load analysis
        const analysisData = await api.get<SkinAnalysisResponse>(`/analyses/${id}`);
        setAnalysis(analysisData);

        // Load latest recommendation (which should be the one just generated)
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

  if (loading) {
    return (
      <PageTransition>
        <Container className="pt-44 pb-32">
          <div className="flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#253A4A]/20 border-t-[#253A4A] rounded-full animate-spin mb-8" />
            <Typography variant="body" className="opacity-60 uppercase tracking-widest text-xs">Retrieving Clinical Data</Typography>
          </div>
        </Container>
      </PageTransition>
    );
  }

  if (error || !analysis) {
    return (
      <PageTransition>
        <Container className="pt-44 pb-32 text-center">
          <Typography variant="h3" className="text-[#253A4A] mb-4">Unavailable</Typography>
          <Typography variant="body" className="opacity-60 mb-8">{error || "Analysis not found."}</Typography>
          <Link to="/app/history">
            <Button variant="secondary" className="rounded-full px-8">Return to Archives</Button>
          </Link>
        </Container>
      </PageTransition>
    );
  }

  const ml = analysis.ml_results;

  return (
    <PageTransition>
      <Container className="pt-32 pb-32 max-w-5xl">
        <Stagger amount={0.1}>

          {/* ── Section 1: Consultation Header ─────────────────────────────── */}
          <StaggerItem>
            {/* Back link + date row */}
            <div className="flex items-center justify-between mb-8">
              <Link
                to="/app/history"
                className="flex items-center gap-2 text-[#5C7E9A] hover:text-[#253A4A] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-bold tracking-widest uppercase">Back</span>
              </Link>
              <div className="text-right">
                <Typography variant="caption" className="opacity-60 block tracking-widest">
                  {new Date(analysis.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </div>
            </div>

            {/* Page title */}
            <BlurReveal className="relative inline-block">
              <p className="font-editorial text-5xl lg:text-7xl text-[#253A4A] font-black mb-8 relative z-10">
                Clinical Protocol.
              </p>
              <Doodle type="sparkles" className="w-16 h-16 absolute -top-8 -right-10 text-[#5C7E9A] opacity-30 z-0" delay={0.5} />
            </BlurReveal>

            {/* Separator */}
            <div className="border-b border-[#253A4A]/10 pb-8 mb-12" />
          </StaggerItem>

          {/* ── Section 2: Two-Column Split ─────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row gap-12">

            {/* LEFT 1/3 — sticky image + stats */}
            <StaggerItem className="w-full lg:w-1/3">
              <div className="sticky top-28">
                {/* Patient image */}
                <div className="rounded-[32px] overflow-hidden border border-[#253A4A]/10 shadow-[0_20px_60px_-15px_rgba(37,58,74,0.1)] relative aspect-[3/4] mb-6">
                  <AmbientGlow blur="blur-[60px]" opacity="opacity-30" />
                  <AnalysisImage
                    analysisId={analysis.id}
                    alt="Clinical Capture"
                    className="w-full h-full object-cover relative z-10"
                  />
                </div>

                {/* Quick stats strip */}
                {ml && (
                  <div className="flex gap-3">
                    {ml.concerns && ml.concerns.length > 0 && (
                      <div className="flex-1 p-4 rounded-2xl bg-[#F7F7F5] border border-[#253A4A]/5 text-center">
                        <p className="text-xl font-bold text-[#253A4A]">{ml.concerns.length}</p>
                        <p className="text-[10px] uppercase tracking-widest text-[#5C7E9A] font-bold mt-0.5">Concerns</p>
                      </div>
                    )}
                    {ml.concerns && ml.concerns.length > 0 && (
                      <div className="flex-1 p-4 rounded-2xl bg-[#F7F7F5] border border-[#253A4A]/5 text-center">
                        <p className="text-xl font-bold text-[#253A4A]">
                          {Math.round(
                            ml.concerns.reduce((acc, c) => acc + (c.confidence ?? 0), 0) /
                              ml.concerns.length
                          )}%
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-[#5C7E9A] font-bold mt-0.5">Confidence</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </StaggerItem>

            {/* RIGHT 2/3 — analysis content */}
            <StaggerItem className="w-full lg:w-2/3">
              {ml ? (
                <div className="space-y-12">

                  {/* Detected Skin Concerns */}
                  {ml.concerns && ml.concerns.length > 0 && (
                    <section>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C7E9A] mb-6 flex items-center gap-4">
                        <span className="w-8 h-[1px] bg-[#5C7E9A]/20"></span>
                        Detected Concerns
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {ml.concerns.map((concern, idx) => (
                          <Fade key={idx} delay={idx * 0.1} className="p-6 border border-[#253A4A]/5 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                              <p className="font-serif font-medium text-[#253A4A] text-xl">{concern.name}</p>
                              <div className="text-right">
                                <span className="block text-xs font-bold text-[#5C7E9A] mb-1">Confidence</span>
                                <span className="text-xs font-bold bg-[#F7F7F5] px-2 py-1 rounded border border-[#253A4A]/5 text-[#253A4A]">
                                  {concern.confidence}%
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-[#E89B87] mb-3">
                              {concern.severity} Severity
                            </p>
                            <p className="text-sm leading-relaxed opacity-70 text-[#253A4A]">{concern.explanation}</p>
                          </Fade>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Clinical Observations */}
                  {ml.observations && ml.observations.length > 0 && (
                    <section className="pt-8">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C7E9A] mb-6 flex items-center gap-4">
                        <span className="w-8 h-[1px] bg-[#5C7E9A]/20"></span>
                        Clinical Observations
                      </p>
                      <div className="space-y-4">
                        {ml.observations.map((obs, idx) => (
                          <div key={idx} className="p-6 border-l-2 border-[#253A4A]/20 pl-6 rounded-r-3xl bg-gradient-to-r from-[#F7F7F5] to-transparent">
                            <p className="font-serif font-medium text-[#253A4A] text-lg mb-3">{obs.observation}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm opacity-80">
                              <div>
                                <span className="block text-[10px] uppercase tracking-widest font-bold text-[#5C7E9A] mb-1">Reason</span>
                                <span className="text-[#253A4A]">{obs.reason}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase tracking-widest font-bold text-[#5C7E9A] mb-1">Implication</span>
                                <span className="text-[#253A4A]">{obs.implication}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] uppercase tracking-widest font-bold text-[#5C7E9A] mb-1">Expected Outcome</span>
                                <span className="text-[#253A4A]">{obs.expected_improvement}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Ingredient Protocol */}
                  {ml.ingredients && (
                    <section className="pt-8">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C7E9A] mb-6 flex items-center gap-4">
                        <span className="w-8 h-[1px] bg-[#5C7E9A]/20"></span>
                        Ingredient Protocol
                      </p>
                      <div className="space-y-8">
                        {Object.entries(ml.ingredients).map(([category, items]) => {
                          if (!items || items.length === 0) return null;
                          return (
                            <div key={category}>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-[#253A4A] border-b border-[#253A4A]/10 pb-3 mb-4 flex items-center justify-between">
                                <span>{category} Actives</span>
                                <span className="text-[#5C7E9A] font-normal">{items.length} Ingredients</span>
                              </p>
                              <div className="grid grid-cols-1 gap-4">
                                {items.map((ing, idx) => (
                                  <div
                                    key={idx}
                                    className="p-6 bg-[#FCFBF8] border border-[#253A4A]/5 rounded-3xl flex flex-col sm:flex-row gap-6 justify-between items-start transition-colors hover:bg-white"
                                  >
                                    <div className="flex-1">
                                      <p className="font-serif font-medium text-[#253A4A] text-xl mb-2">{ing.name}</p>
                                      <p className="text-sm leading-relaxed opacity-70 text-[#253A4A] mb-3">{ing.why}</p>
                                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#E89B87]">Benefit: {ing.benefit}</p>
                                    </div>
                                    <div className="text-left sm:text-right shrink-0 flex flex-row sm:flex-col gap-2">
                                      <span className="inline-block text-[10px] uppercase tracking-[0.2em] font-bold bg-white shadow-sm border border-[#253A4A]/5 px-3 py-1.5 rounded-full text-[#253A4A]">
                                        {ing.time}
                                      </span>
                                      <span className="inline-block text-[10px] uppercase tracking-widest font-bold text-[#5C7E9A] px-3 py-1.5">
                                        {ing.compatibility}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                </div>
              ) : (
                <div className="p-6 border border-[#253A4A]/10 rounded-2xl bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-4 text-[#5C7E9A]">
                    <Info className="w-5 h-5" />
                    <p className="text-sm font-medium tracking-wide">Analysis data is still processing.</p>
                  </div>
                </div>
              )}
            </StaggerItem>
          </div>

          {/* ── Section 3: Full-Width Routine (only if showRoutine) ─────────── */}
          {showRoutine && recommendation && (
            <StaggerItem>
              <div className="border-t border-[#253A4A]/10 pt-12 mt-8 space-y-12">

                {/* Morning Protocol */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5C7E9A] mb-4">
                    Morning Protocol
                  </p>
                  <div className="space-y-4">
                    {recommendation.morning_routine.map((item, i) => (
                      <div key={`am-${i}`} className="p-6 border border-[#253A4A]/10 rounded-2xl bg-white">
                        <div className="flex flex-col md:flex-row gap-5">
                          <div className="w-11 h-11 shrink-0 rounded-full bg-[#FCFBF8] border border-[#253A4A]/10 flex items-center justify-center text-xl">
                            ☀️
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-[#5C7E9A] mb-2">
                              {item.step_name} · {item.product_type}
                            </p>
                            <p className="font-bold text-[#253A4A] text-lg mb-2 capitalize">
                              {item.category.replace(/_/g, ' ')}
                            </p>
                            {item.recommended_product && (
                              <div className="mb-3 px-3 py-1.5 bg-[#F7F7F5] rounded-lg border border-[#253A4A]/5 inline-block">
                                <span className="text-xs font-bold text-[#253A4A]">
                                  Recommended: {item.recommended_product}
                                </span>
                              </div>
                            )}
                            <p className="text-sm text-[#5C7E9A] mb-4"><strong>Why:</strong> {item.why}</p>
                            <div className="grid grid-cols-2 gap-4 text-xs text-[#5C7E9A]">
                              <div><strong>Instructions:</strong><br />{item.instructions}</div>
                              <div><strong>Frequency:</strong><br />{item.frequency}</div>
                            </div>
                            {item.warnings && (
                              <div className="mt-4 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs">
                                <strong>Warning:</strong> {item.warnings}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Night Protocol */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5C7E9A] mb-4">
                    Night Protocol
                  </p>
                  <div className="space-y-4">
                    {recommendation.night_routine.map((item, i) => (
                      <div key={`pm-${i}`} className="p-6 border border-[#253A4A]/10 rounded-2xl bg-[#1a2530] text-white">
                        <div className="flex flex-col md:flex-row gap-5">
                          <div className="w-11 h-11 shrink-0 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl">
                            🌙
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">
                              {item.step_name} · {item.product_type}
                            </p>
                            <p className="font-bold text-white text-lg mb-2 capitalize">
                              {item.category.replace(/_/g, ' ')}
                            </p>
                            {item.recommended_product && (
                              <div className="mb-3 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10 inline-block">
                                <span className="text-xs font-bold text-white">
                                  Recommended: {item.recommended_product}
                                </span>
                              </div>
                            )}
                            <p className="text-sm text-white/80 mb-4"><strong>Why:</strong> {item.why}</p>
                            <div className="grid grid-cols-2 gap-4 text-xs text-white/80">
                              <div><strong>Instructions:</strong><br />{item.instructions}</div>
                              <div><strong>Frequency:</strong><br />{item.frequency}</div>
                            </div>
                            {item.warnings && (
                              <div className="mt-4 p-3 bg-red-500/20 text-red-200 rounded-lg text-xs border border-red-500/30">
                                <strong>Warning:</strong> {item.warnings}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>
          )}

          {/* ── Section 3b: No recommendation yet but routine flag is set ───── */}
          {showRoutine && !recommendation && (
            <StaggerItem>
              <div className="border-t border-[#253A4A]/10 pt-12 mt-8">
                <div className="p-6 border border-[#253A4A]/10 rounded-2xl bg-white/50 backdrop-blur-sm">
                  <div className="flex items-center gap-4 text-[#5C7E9A]">
                    <Info className="w-5 h-5" />
                    <p className="text-sm font-medium tracking-wide">No products could be mapped for this profile.</p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          )}

          {/* ── Section 4: Full-Width Timeline (only if showRoutine) ─────────── */}
          {showRoutine && recommendation && (
            <StaggerItem>
              <div className="space-y-12">
                {/* Weekly Strategy + Introduction Schedule */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 border border-[#253A4A]/10 rounded-2xl bg-white">
                    <p className="font-bold text-[#253A4A] text-lg mb-4">Weekly Strategy</p>
                    <p className="text-sm text-[#5C7E9A] leading-relaxed">{recommendation.weekly_schedule}</p>
                  </div>
                  <div className="p-6 border border-[#253A4A]/10 rounded-2xl bg-white">
                    <p className="font-bold text-[#253A4A] text-lg mb-4">Introduction Schedule</p>
                    <p className="text-sm text-[#5C7E9A] leading-relaxed whitespace-pre-line mb-4">
                      {recommendation.introduction_schedule}
                    </p>
                    <p className="text-xs font-bold text-amber-600 bg-amber-50 p-3 rounded-lg">
                      Patch Test: {recommendation.patch_test_instructions}
                    </p>
                  </div>
                </div>

                {/* Timeline phases */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#5C7E9A] mb-4">
                    Expected Timeline
                  </p>
                  <div className="grid md:grid-cols-4 gap-4">
                    {recommendation.timeline.map((phase, i) => (
                      <div key={i} className="p-5 border border-[#253A4A]/10 rounded-2xl bg-[#FCFBF8]">
                        <p className="font-bold text-[#253A4A] text-base mb-3">{phase.phase}</p>
                        <p className="text-xs text-[#5C7E9A] mb-3">{phase.expected_results}</p>
                        {phase.adjustments && (
                          <p className="text-[10px] font-bold text-[#253A4A] bg-[#253A4A]/5 p-2 rounded">
                            Adapt: {phase.adjustments}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </StaggerItem>
          )}

          {/* ── Section 5: CTA (only if no routine yet) ──────────────────────── */}
          {!showRoutine && (
            <StaggerItem>
              <div className="border-t border-[#253A4A]/10 pt-12 mt-8 text-center">
                <Fade>
                  <Link to={`/app/routine-selection/${id}`}>
                    <Button className="w-full md:w-auto rounded-full px-12 py-6 text-lg">
                      Start AI Consultation
                    </Button>
                  </Link>
                </Fade>
              </div>
            </StaggerItem>
          )}

        </Stagger>
      </Container>
    </PageTransition>
  );
};
