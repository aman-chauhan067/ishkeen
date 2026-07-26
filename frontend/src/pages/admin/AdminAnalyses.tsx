import { useState, useEffect } from 'react';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { ChevronRight, Microscope, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface AnalysisAdminResponse {
  id: string;
  user_email: string;
  status: string;
  created_at: string;
  inference_time_ms: number;
  error_message: string | null;
}

export const AdminAnalyses = () => {
  const [analyses, setAnalyses] = useState<AnalysisAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyses = async () => {
      try {
        const response = await api.get<AnalysisAdminResponse[]>('/admin/analyses');
        setAnalyses(response);
      } catch (error) {
        console.error("Failed to fetch analyses", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyses();
  }, []);

  return (
    <div className="space-y-8">
      <BlurReveal>
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl text-[#26384B] tracking-tight mb-4">Global Analyses</h1>
          <p className="font-sans text-[#4C6072] leading-relaxed">
            Monitor real-time AI inference operations, review failed pipelines, and track processing times.
          </p>
        </div>
      </BlurReveal>

      <Fade delay={0.1}>
        <div className="flex justify-between items-center bg-[#F6F4EF] p-4 rounded-2xl border border-[#26384B]/5">
          <div className="text-[#4C6072] font-sans text-xs font-medium tracking-widest uppercase ml-4">
            {analyses.length} Recent Scans
          </div>
        </div>
      </Fade>

      <Fade delay={0.2}>
        <div className="bg-[#F6F4EF] rounded-2xl border border-[#26384B]/5 overflow-hidden">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className="border-b border-[#26384B]/5 text-[#4C6072] text-[10px] uppercase tracking-widest bg-[#F7F7F5]/50">
                    <th className="px-6 py-4 font-medium">Pipeline ID</th>
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Inference</th>
                    <th className="px-6 py-4 font-medium">Timestamp</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26384B]/5">
                  {analyses.map((analysis) => (
                    <tr 
                      key={analysis.id} 
                      className="group hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#26384B]/5 flex items-center justify-center">
                            <Microscope className="w-4 h-4 text-[#26384B]" />
                          </div>
                          <div className="text-sm font-medium text-[#26384B]">{analysis.id.slice(0, 8)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#26384B]">{analysis.user_email}</td>
                      <td className="px-6 py-4">
                        {analysis.status === 'completed' || analysis.status === 'ready' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium tracking-wide uppercase">
                            Success
                          </span>
                        ) : analysis.status === 'failed' ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-medium tracking-wide uppercase gap-1">
                            <AlertCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium tracking-wide uppercase">
                            {analysis.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4C6072]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {analysis.inference_time_ms ? `${analysis.inference_time_ms}ms` : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4C6072]">
                        {format(new Date(analysis.created_at), 'MMM d, yyyy HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-[#4C6072] group-hover:text-[#26384B] transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                  {analyses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#4C6072] font-sans text-sm">
                        No analyses found in the pipeline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Fade>
    </div>
  );
};
