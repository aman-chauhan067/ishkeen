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
import { Doodle } from '../../components/illustrations/Doodle';

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
          <h2 className="mb-12 text-center text-[#253A4A]">Consultation History.</h2>
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
          <Section className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-16 border-b border-[#253A4A]/10 pb-12">
            <StaggerItem>
              <BlurReveal>
                <h2 className="text-left text-[#253A4A]">Your Skin Journey.</h2>
                <Typography variant="caption" className="opacity-80 mt-6 tracking-wide text-[#5C7E9A]">
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
                <Fade className="py-32 text-center flex flex-col items-center gap-8 relative overflow-hidden rounded-[32px] bg-white/50 border border-[#253A4A]/5">
                  <div className="absolute inset-0 z-0">
                    <Doodle type="blob" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 text-[#5C7E9A] opacity-5" delay={0.2} />
                    <Doodle type="sparkles" className="absolute top-[20%] right-[30%] w-10 h-10 text-[#5C7E9A] opacity-20" delay={0.4} />
                    <Doodle type="stars" className="absolute bottom-[20%] left-[30%] w-8 h-8 text-[#5C7E9A] opacity-20" delay={0.6} />
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    <Typography variant="h3" className="text-[#253A4A] mb-4">
                      No Clinical Records Found
                    </Typography>
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
                  <div className="absolute left-6 md:left-[50px] top-10 bottom-10 w-[2px] bg-[#253A4A]/10" />
                  
                  <ul className="space-y-24 relative" aria-label="Analysis history">
                    {items.map((analysis) => (
                      <li key={analysis.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute left-6 md:left-[50px] top-16 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-[4px] border-[#253A4A]" />
                        
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
