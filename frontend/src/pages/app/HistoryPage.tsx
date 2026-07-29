import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnalysisCard } from '../../components/analysis/AnalysisCard';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Typography } from '../../components/ui/Typography';
import { Container } from '../../components/ui/Container';
import { Section } from '../../components/ui/Section';
import { PageTransition, Stagger, StaggerItem, Fade, BlurReveal } from '../../components/motion';
import { useAnalyses } from '../../hooks/useAnalyses';
import { Plus } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { state, load, loadMore, hasMore } = useAnalyses();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state.phase === 'loading') {
    return (
      <PageTransition>
        <Container className="py-12">
          <h2 className="mb-12 text-center text-[#26384B]">Consultation History.</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white/5 border border-white/10 rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        </Container>
      </PageTransition>
    );
  }

  if (state.phase === 'error') {
    return (
      <PageTransition>
        <Container className="py-12 text-center space-y-6">
          <Typography variant="h2">Consultation History</Typography>
          <Alert variant="error" message={state.message} />
          <Button id="history-retry-btn" onClick={load} variant="secondary" className="rounded-full px-8">
            Try Again
          </Button>
        </Container>
      </PageTransition>
    );
  }

  if (state.phase === 'idle') return null;

  const { items, total, loadingMore } = state;

  return (
    <PageTransition>
      <Container className="max-w-4xl pt-44 pb-32">
        <Stagger amount={0.1}>
          <Section className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-16 border-b border-[#26384B]/10 pb-12">
            <StaggerItem>
              <BlurReveal>
                <h1 className="text-left text-[#26384B] flex flex-col items-start gap-1 sm:gap-2">
                  <span className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter leading-none whitespace-nowrap">Your Skin</span>
                  <span className="text-5xl sm:text-7xl text-[#4C6072] font-medium tracking-normal opacity-80">Journey.</span>
                </h1>
                <Typography variant="caption" className="opacity-80 mt-2 tracking-wide text-[#4C6072] font-bold block">
                  {total === 0 ? 'No journey records found.' : `${total} journey milestone${total === 1 ? '' : 's'}`}
                </Typography>
              </BlurReveal>
            </StaggerItem>
            <StaggerItem>
              <Fade>
                <Link to="/app/upload">
                  <Button id="history-upload-btn" variant="primary" className="rounded-full px-12">
                    NEW ANALYSIS
                  </Button>
                </Link>
              </Fade>
            </StaggerItem>
          </Section>

          <Section>
            {items.length === 0 ? (
              <StaggerItem>
                <Fade className="py-32 text-center flex flex-col items-center gap-8 relative overflow-hidden bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 rounded-[32px]">
                  <div className="absolute inset-0 z-0">
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    <h3 className="app-heading-3 text-[#26384B] mb-4 font-black">
                      No Clinical Records Found
                    </h3>
                    <Typography variant="body" className="opacity-80 max-w-md">
                      You haven't provided any imagery for evaluation. Begin your consultation to establish a clinical baseline.
                    </Typography>
                    <Link to="/app/upload" className="mt-8">
                      <Button id="history-empty-upload-btn" className="rounded-full px-10 tracking-widest font-bold" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        BEGIN CONSULTATION
                      </Button>
                    </Link>
                  </div>
                </Fade>
              </StaggerItem>
            ) : (
              <StaggerItem>
                <div className="relative">
                  {/* Timeline vertical line */}
                  <div className="absolute left-6 md:left-[50px] top-10 bottom-10 w-[2px] bg-[#26384B]/10" />
                  
                  <ul className="space-y-24 relative" aria-label="Analysis history">
                    {items.map((analysis) => (
                      <li key={analysis.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute left-6 md:left-[50px] top-16 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-[4px] border-[#26384B]" />
                        
                        <div className="pl-16 md:pl-32">
                          <Link to={`/app/results/${analysis.id}`} className="block focus:outline-none">
                            <AnalysisCard analysis={analysis} />
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {hasMore && (
                  <div className="flex justify-center pt-8">
                    <Button
                      id="history-load-more-btn"
                      variant="ghost"
                      className="rounded-full px-8"
                      onClick={loadMore}
                      isLoading={loadingMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? 'Loading…' : 'Load Previous Records'}
                    </Button>
                  </div>
                )}

                {!hasMore && items.length > 0 && (
                  <Typography variant="caption" className="text-center block pt-8 opacity-40">
                    End of history
                  </Typography>
                )}
              </StaggerItem>
            )}
          </Section>
        </Stagger>
      </Container>
    </PageTransition>
  );
};
