import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlurReveal, Fade } from '../../components/motion';
import { api, BASE_URL } from '../../lib/api';
import { ArrowLeft, Microscope, Activity, Clock, ShieldAlert, Sparkles, CheckCircle2, FlaskConical } from 'lucide-react';
import { format } from 'date-fns';

interface AnalysisDetailsResponse {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  inference_time_ms: number;
  failure_code: string | null;
  image_url: string;
  ml_results: any;
  recommendation_run: any;
  user: {
    id: string;
    email: string;
  };
}

export const AdminAnalysisDetails = () => {
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalysisDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await api.get<AnalysisDetailsResponse>(`/admin/analyses/${analysisId}`);
        setData(response);
      } catch (error) {
        console.error("Failed to fetch analysis details", error);
      } finally {
        setLoading(false);
      }
    };
    if (analysisId) fetchAnalysis();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#253A4A]/20 border-t-[#253A4A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return (
    <div className="text-center mt-20 font-sans text-[#5C7E9A]">Analysis not found.</div>
  );

  return (
    <div className="space-y-8 pb-12">
      <BlurReveal>
        <button 
          onClick={() => navigate('/admin/analyses')}
          className="flex items-center gap-2 text-[#5C7E9A] hover:text-[#253A4A] transition-colors mb-6 font-sans text-xs font-medium tracking-widest uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Analyses
        </button>
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-[#253A4A]/5 flex items-center justify-center shrink-0 border border-[#253A4A]/10 overflow-hidden">
            {data.image_url ? (
              <img src={`${BASE_URL.replace('/api', '')}${data.image_url}`} alt="Skin Scan" className="w-full h-full object-cover" />
            ) : (
              <Microscope className="w-8 h-8 text-[#253A4A]" />
            )}
          </div>
          <div className="pt-2">
            <h1 className="font-serif text-4xl text-[#253A4A] tracking-tight mb-2 uppercase">Scan {data.id.slice(0, 8)}</h1>
            <div className="flex items-center gap-4 text-[#5C7E9A] font-sans text-sm">
              <span>{data.user.email}</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {format(new Date(data.created_at), 'MMM d, yyyy HH:mm')}</span>
              {data.status === 'completed' || data.status === 'ready' ? (
                <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Success</span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-600 capitalize"><Activity className="w-4 h-4" /> {data.status}</span>
              )}
            </div>
          </div>
        </div>
      </BlurReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <Fade delay={0.1} className="lg:col-span-1 space-y-8">
          <div className="bg-[#FCFBF8] p-8 rounded-3xl border border-[#253A4A]/5">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#253A4A] mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#5C7E9A]" /> ML Inference
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-[#253A4A]/5">
                <span className="font-sans text-sm text-[#5C7E9A]">Inference Time</span>
                <span className="font-sans text-sm font-medium text-[#253A4A]">{data.inference_time_ms}ms</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[#253A4A]/5">
                <span className="font-sans text-sm text-[#5C7E9A]">Error Code</span>
                <span className="font-sans text-sm font-medium text-[#253A4A]">{data.failure_code || 'None'}</span>
              </div>
            </div>
            
            {data.ml_results && (
              <div className="mt-6 pt-6 border-t border-[#253A4A]/5">
                <div className="font-sans text-[10px] text-[#5C7E9A] uppercase tracking-widest mb-3">Raw Payload</div>
                <pre className="bg-[#F7F7F5] p-4 rounded-xl text-[10px] text-[#253A4A] font-mono overflow-x-auto border border-[#253A4A]/5">
                  {JSON.stringify(data.ml_results, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Fade>

        <Fade delay={0.2} className="lg:col-span-2">
          <div className="bg-[#FCFBF8] p-8 rounded-3xl border border-[#253A4A]/5 min-h-full">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#253A4A] mb-8 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#5C7E9A]" /> Recommendation Trace
            </h3>
            
            {!data.recommendation_run ? (
              <div className="text-sm text-[#5C7E9A] font-sans h-32 flex items-center justify-center bg-[#F7F7F5] rounded-xl border border-dashed border-[#253A4A]/20">
                No recommendation trace available for this analysis.
              </div>
            ) : (
              <div className="space-y-8">
                {/* Engine Info */}
                <div className="flex gap-4 p-4 rounded-xl bg-[#F7F7F5] border border-[#253A4A]/5">
                  <div>
                    <div className="text-[10px] font-bold text-[#5C7E9A] uppercase tracking-widest">Engine</div>
                    <div className="text-sm text-[#253A4A] font-medium">{data.recommendation_run.engine_version}</div>
                  </div>
                  <div className="border-l border-[#253A4A]/10 pl-4">
                    <div className="text-[10px] font-bold text-[#5C7E9A] uppercase tracking-widest">Knowledge Base</div>
                    <div className="text-sm text-[#253A4A] font-medium">{data.recommendation_run.knowledge_version}</div>
                  </div>
                  <div className="border-l border-[#253A4A]/10 pl-4">
                    <div className="text-[10px] font-bold text-[#5C7E9A] uppercase tracking-widest">Safety Policy</div>
                    <div className="text-sm text-[#253A4A] font-medium">{data.recommendation_run.policy_version}</div>
                  </div>
                </div>

                {/* Safety Adjustments */}
                {data.recommendation_run.safety_adjustments?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-[#5C7E9A] uppercase tracking-widest flex items-center gap-1.5 mb-3">
                      <ShieldAlert className="w-3 h-3 text-amber-500" /> Safety Triggers
                    </h4>
                    <div className="space-y-2">
                      {data.recommendation_run.safety_adjustments.map((adj: any, i: number) => (
                        <div key={i} className="p-3 bg-amber-50 text-amber-900 text-xs font-sans rounded-lg border border-amber-200">
                          <strong>{adj.trigger}:</strong> {adj.action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                <div>
                  <h4 className="text-[10px] font-bold text-[#5C7E9A] uppercase tracking-widest flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-3 h-3" /> Selected Products
                  </h4>
                  <div className="space-y-3">
                    {data.recommendation_run.items?.map((item: any) => (
                      <div key={item.id} className="p-4 bg-white rounded-xl border border-[#253A4A]/10 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-[#253A4A] text-white text-[10px] font-bold uppercase tracking-widest rounded mb-1">
                              Step {item.priority}: {item.routine_step}
                            </span>
                            <div className="text-sm font-medium text-[#253A4A] capitalize">{item.category.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                        <div className="mt-3 bg-[#F7F7F5] p-3 rounded-lg">
                          <div className="text-[10px] font-bold text-[#5C7E9A] uppercase tracking-widest mb-1.5">Evidence Graph</div>
                          <ul className="text-xs font-sans text-[#253A4A] space-y-1">
                            {item.explanation_codes?.map((code: string, j: number) => (
                              <li key={j} className="flex gap-2">
                                <span className="text-[#5C7E9A]">•</span>
                                {code}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </Fade>
      </div>
    </div>
  );
};
