import { useState, useEffect } from 'react';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { Brain, Cpu, Activity, Zap, Server } from 'lucide-react';

interface MLStatusResponse {
  current_model: string;
  model_version: string;
  training_date: string;
  dataset_version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  inference_engine: string;
  avg_inference_time_ms: number;
  failed_inferences: number;
}

const MetricBox = ({ label, value, icon: Icon, percentage = false }: any) => (
  <div className="bg-[#FCFBF8] p-6 rounded-2xl border border-[#253A4A]/5 flex flex-col justify-between h-32 hover:border-[#253A4A]/10 transition-colors">
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-[#5C7E9A]" />
      <span className="font-sans text-xs font-medium text-[#5C7E9A] uppercase tracking-widest">{label}</span>
    </div>
    <div className="font-serif text-3xl text-[#253A4A]">
      {percentage ? `${(value * 100).toFixed(1)}%` : value}
    </div>
  </div>
);

export const AdminMLStatus = () => {
  const [data, setData] = useState<MLStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchML = async () => {
      try {
        const response = await api.get<MLStatusResponse>('/admin/ml');
        setData(response);
      } catch (error) {
        console.error("Failed to fetch ML status", error);
      } finally {
        setLoading(false);
      }
    };
    fetchML();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#253A4A]/20 border-t-[#253A4A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-12">
      <BlurReveal>
        <div className="max-w-2xl">
          <h1 className="font-serif text-4xl text-[#253A4A] tracking-tight mb-4">ML Engine Status</h1>
          <p className="font-sans text-[#5C7E9A] leading-relaxed">
            Telemetry and performance metrics for the active computer vision model.
          </p>
        </div>
      </BlurReveal>

      <Fade delay={0.1}>
        <div className="bg-[#FCFBF8] p-8 rounded-3xl border border-[#253A4A]/5 mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#253A4A] flex items-center justify-center text-[#FCFBF8] shadow-[0_8px_30px_rgba(37,58,74,0.2)]">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-sans text-[#5C7E9A] uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active Model
              </div>
              <h2 className="font-serif text-2xl text-[#253A4A]">{data.current_model}</h2>
              <div className="text-sm font-sans text-[#5C7E9A] mt-1">Version {data.model_version} • Trained on {data.dataset_version}</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs font-sans text-[#5C7E9A] uppercase tracking-widest mb-1">Inference Engine</div>
            <div className="flex items-center gap-2 px-4 py-2 bg-[#F7F7F5] rounded-xl border border-[#253A4A]/5">
              <Cpu className="w-4 h-4 text-[#253A4A]" />
              <span className="font-sans text-sm font-medium text-[#253A4A]">{data.inference_engine}</span>
            </div>
          </div>
        </div>
      </Fade>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <Fade delay={0.2}>
          <MetricBox label="Accuracy" value={data.accuracy} icon={Activity} percentage />
        </Fade>
        <Fade delay={0.3}>
          <MetricBox label="Precision" value={data.precision} icon={Activity} percentage />
        </Fade>
        <Fade delay={0.4}>
          <MetricBox label="Recall" value={data.recall} icon={Activity} percentage />
        </Fade>
        <Fade delay={0.5}>
          <MetricBox label="F1 Score" value={data.f1_score} icon={Activity} percentage />
        </Fade>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Fade delay={0.6}>
          <div className="bg-[#FCFBF8] p-8 rounded-3xl border border-[#253A4A]/5">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#253A4A] mb-8 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Performance
            </h3>
            <div className="flex items-end gap-4 mb-4">
              <div className="font-serif text-6xl text-[#253A4A]">{data.avg_inference_time_ms}</div>
              <div className="font-sans text-[#5C7E9A] pb-2">ms / inference</div>
            </div>
            <div className="w-full h-1 bg-[#253A4A]/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#253A4A] rounded-full w-[30%]" />
            </div>
          </div>
        </Fade>

        <Fade delay={0.7}>
          <div className="bg-[#FCFBF8] p-8 rounded-3xl border border-[#253A4A]/5">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#253A4A] mb-8 flex items-center gap-2">
              <Server className="w-4 h-4" /> Reliability
            </h3>
            <div className="flex justify-between items-end mb-4">
              <div>
                <div className="font-serif text-6xl text-emerald-600">
                  {data.failed_inferences === 0 ? "100" : (99.9).toFixed(1)}
                  <span className="text-3xl">%</span>
                </div>
                <div className="font-sans text-[#5C7E9A] mt-2">Success Rate</div>
              </div>
              <div className="text-right pb-2">
                <div className="font-sans font-medium text-[#253A4A]">{data.failed_inferences}</div>
                <div className="font-sans text-xs text-[#5C7E9A]">Failed Inferences</div>
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
};
