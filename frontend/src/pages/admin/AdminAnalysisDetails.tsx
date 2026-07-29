import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { ArrowLeft, Microscope, Activity, Clock, ShieldAlert, Sparkles, CheckCircle2, FlaskConical, Droplets, AlertTriangle, User as UserIcon } from 'lucide-react';
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
      <div className="w-full h-full flex flex-col items-center justify-center space-y-4 pt-20">
        <div className="w-8 h-8 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
        <p className="text-sm font-sans font-medium text-[#4C6072] uppercase tracking-widest animate-pulse">Loading Analysis...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center mt-32 space-y-6">
        <div className="w-24 h-24 rounded-[32px] bg-white border border-[#26384B]/10 flex items-center justify-center shadow-sm">
          <AlertTriangle className="w-10 h-10 text-[#4C6072]/50" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-serif text-[#26384B] mb-2 tracking-normal">Analysis Not Found</h2>
          <p className="text-[#4C6072] font-sans max-w-md mx-auto">
            The scan you're looking for doesn't exist or has been permanently deleted from our records.
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin/analyses')}
          className="px-6 py-3 bg-[#26384B] text-white rounded-xl text-sm font-medium hover:bg-[#1a2530] transition-colors flex items-center gap-2 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Analyses
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24 max-w-7xl mx-auto">
      <BlurReveal>
        <button 
          onClick={() => navigate('/admin/analyses')}
          className="flex items-center gap-2 text-[#4C6072] hover:text-[#26384B] transition-colors mb-10 font-sans text-xs font-bold tracking-widest uppercase bg-white/50 px-4 py-2 rounded-full border border-[#26384B]/10 hover:bg-white w-max shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 bg-white/40 backdrop-blur-[40px] p-8 rounded-[32px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white to-gray-50 flex items-center justify-center shrink-0 border border-[#26384B]/10 shadow-inner relative group">
              <Microscope className="w-8 h-8 text-[#26384B]" />
              <div className="absolute inset-0 bg-[#26384B]/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                <ShieldAlert className="w-4 h-4 text-white mb-1" />
                <span className="text-[8px] font-bold uppercase tracking-widest text-white">Encrypted</span>
              </div>
            </div>
            <div className="pt-2">
              <h1 className="font-serif text-4xl text-[#26384B] tracking-normal mb-3">Scan {data.id.slice(0, 8).toUpperCase()}</h1>
              <div className="flex flex-wrap items-center gap-3 text-[#4C6072] font-sans text-sm">
                <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-md border border-white/80 shadow-sm font-medium"><UserIcon className="w-3.5 h-3.5" /> {data.user.email}</span>
                <span className="flex items-center gap-1.5 bg-white/60 px-3 py-1 rounded-md border border-white/80 shadow-sm"><Clock className="w-3.5 h-3.5" /> {format(new Date(data.created_at), 'MMM d, yyyy • HH:mm')}</span>
                {data.status === 'completed' || data.status === 'ready' ? (
                  <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-md font-medium tracking-wide uppercase text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Success</span>
                ) : (
                  <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1 rounded-md font-medium tracking-wide uppercase text-xs"><Activity className="w-3.5 h-3.5" /> {data.status}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </BlurReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ML Results Panel */}
        <Fade delay={0.1} className="lg:col-span-1 space-y-8">
          <div className="bg-white/50 backdrop-blur-xl p-8 rounded-3xl border border-[#26384B]/5 shadow-sm min-h-full">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-8 flex items-center gap-2 border-b border-[#26384B]/10 pb-4">
              <Activity className="w-4 h-4 text-[#4C6072]" /> ML Analysis Details
            </h3>
            
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-[#26384B]/5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="font-sans text-xs uppercase tracking-widest font-bold text-[#4C6072] block mb-1">Inference Time</span>
                  <span className="font-sans text-2xl font-bold text-[#26384B]">{data.inference_time_ms}<span className="text-sm font-medium text-[#4C6072] ml-1">ms</span></span>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              {data.failure_code && (
                <div className="bg-red-50 rounded-2xl p-5 border border-red-100 shadow-sm">
                   <span className="font-sans text-xs uppercase tracking-widest font-bold text-red-600 block mb-1">Error Code</span>
                   <span className="font-sans text-base font-medium text-red-900">{data.failure_code}</span>
                </div>
              )}

              {data.ml_results && (
                <div className="space-y-6 pt-2">
                  <div className="space-y-2">
                    <span className="font-sans text-[10px] font-bold text-[#4C6072] uppercase tracking-widest">Skin Type</span>
                    <div className="w-full bg-white border border-[#26384B]/10 rounded-xl p-4 flex items-center justify-between shadow-sm">
                      <span className="font-medium text-[#26384B] capitalize">{data.ml_results.skin_type || 'Unknown'}</span>
                      <Droplets className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="font-sans text-[10px] font-bold text-[#4C6072] uppercase tracking-widest flex items-center justify-between">
                      <span>Acne Severity</span>
                      <span className="text-[#26384B]">{data.ml_results.acne_severity || 'Low'}</span>
                    </span>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          data.ml_results.acne_severity === 'high' || data.ml_results.acne_severity > 0.7 ? 'bg-red-500 w-[85%]' : 
                          data.ml_results.acne_severity === 'medium' || data.ml_results.acne_severity > 0.3 ? 'bg-amber-400 w-[50%]' : 
                          'bg-emerald-400 w-[15%]'
                        }`} 
                      />
                    </div>
                  </div>

                  {data.ml_results.concerns && Array.isArray(data.ml_results.concerns) && (
                    <div className="space-y-3">
                      <span className="font-sans text-[10px] font-bold text-[#4C6072] uppercase tracking-widest">Detected Concerns</span>
                      <div className="flex flex-wrap gap-2">
                        {data.ml_results.concerns.map((concern: string, idx: number) => (
                          <span key={idx} className="px-3 py-1.5 bg-white border border-[#26384B]/10 rounded-lg text-xs font-medium text-[#26384B] shadow-sm capitalize">
                            {concern.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-[#26384B]/10">
                    <details className="group">
                      <summary className="font-sans text-[10px] text-[#4C6072] uppercase tracking-widest mb-3 cursor-pointer select-none hover:text-[#26384B] transition-colors outline-none flex items-center gap-2">
                        <span>View Raw Payload</span>
                        <div className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-100 group-open:rotate-180 transition-transform">↓</div>
                      </summary>
                      <div className="bg-[#26384B] p-4 rounded-xl text-[10px] text-emerald-400 font-mono overflow-x-auto shadow-inner mt-4">
                        <pre>{JSON.stringify(data.ml_results, null, 2)}</pre>
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Fade>

        {/* Recommendation Trace Panel */}
        <Fade delay={0.2} className="lg:col-span-2">
          <div className="bg-white/50 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-[#26384B]/5 shadow-sm min-h-full">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-8 flex items-center gap-2 border-b border-[#26384B]/10 pb-4">
              <FlaskConical className="w-4 h-4 text-[#4C6072]" /> Recommendation Trace
            </h3>
            
            {!data.recommendation_run ? (
              <div className="text-sm text-[#4C6072] font-sans h-48 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-[#26384B]/20">
                <FlaskConical className="w-8 h-8 text-gray-300 mb-3" />
                No recommendation trace available for this analysis.
              </div>
            ) : (
              <div className="space-y-10">
                {/* Engine Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-[#26384B]/5 shadow-sm">
                    <div className="text-[10px] font-bold text-[#4C6072] uppercase tracking-widest mb-1">Engine Version</div>
                    <div className="text-sm text-[#26384B] font-bold font-mono">{data.recommendation_run.engine_version}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#26384B]/5 shadow-sm">
                    <div className="text-[10px] font-bold text-[#4C6072] uppercase tracking-widest mb-1">Knowledge Base</div>
                    <div className="text-sm text-[#26384B] font-bold font-mono">{data.recommendation_run.knowledge_version}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-[#26384B]/5 shadow-sm">
                    <div className="text-[10px] font-bold text-[#4C6072] uppercase tracking-widest mb-1">Safety Policy</div>
                    <div className="text-sm text-[#26384B] font-bold font-mono">{data.recommendation_run.policy_version}</div>
                  </div>
                </div>

                {/* Safety Adjustments */}
                {data.recommendation_run.safety_adjustments?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-[#4C6072] uppercase tracking-widest flex items-center gap-1.5 mb-4">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Safety Triggers Fired
                    </h4>
                    <div className="space-y-3">
                      {data.recommendation_run.safety_adjustments.map((adj: any, i: number) => (
                        <div key={i} className="px-5 py-4 bg-amber-50 text-amber-900 text-sm font-sans rounded-xl border border-amber-200 shadow-sm flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                          <div>
                            <strong className="block text-amber-950 mb-0.5">{adj.trigger}</strong> 
                            <span className="text-amber-800/80 leading-relaxed">{adj.action}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products Selected */}
                <div>
                  <h4 className="text-[10px] font-bold text-[#4C6072] uppercase tracking-widest flex items-center gap-1.5 mb-4">
                    <Sparkles className="w-3.5 h-3.5" /> Curated Routine Steps
                  </h4>
                  <div className="space-y-4">
                    {data.recommendation_run.items?.map((item: any) => (
                      <div key={item.id} className="p-6 bg-white rounded-2xl border border-[#26384B]/10 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#26384B]" />
                        
                        <div className="flex justify-between items-start mb-4 pl-3">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="flex items-center justify-center w-6 h-6 bg-[#26384B] text-white text-[10px] font-bold rounded-full">
                                {item.priority}
                              </span>
                              <span className="text-sm font-bold text-[#26384B]">{item.routine_step}</span>
                            </div>
                            <div className="text-xs font-medium text-[#4C6072] uppercase tracking-widest ml-9">{item.category.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 bg-gray-50 p-4 rounded-xl ml-3">
                          <div className="text-[10px] font-bold text-[#4C6072] uppercase tracking-widest mb-2">Evidence &amp; Reasoning</div>
                          <ul className="text-xs font-sans text-[#26384B] space-y-2">
                            {item.explanation_codes?.map((code: string, j: number) => (
                              <li key={j} className="flex gap-2.5 items-start">
                                <span className="text-blue-500 mt-0.5 font-bold">•</span>
                                <span className="leading-relaxed">{code}</span>
                              </li>
                            ))}
                            {(!item.explanation_codes || item.explanation_codes.length === 0) && (
                              <li className="text-gray-400 italic">No specific reasoning trace logged.</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    ))}
                    {(!data.recommendation_run.items || data.recommendation_run.items.length === 0) && (
                       <div className="text-center text-sm text-gray-500 py-8 bg-white rounded-xl border border-dashed border-gray-200">
                         No products were selected for this routine.
                       </div>
                    )}
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
