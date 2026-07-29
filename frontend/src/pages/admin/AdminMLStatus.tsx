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
  <div className="bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 p-6 rounded-[24px] flex flex-col justify-between h-32 hover:shadow-lg transition-all group">
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-[#4C6072]" />
      <span className="font-sans text-xs font-medium text-[#4C6072] uppercase tracking-widest">{label}</span>
    </div>
    <div className="app-heading-3 text-[#26384B]">
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
        <div className="w-6 h-6 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-12">
      <BlurReveal>
        <div className="max-w-2xl">
          <h1 className="text-left text-[#26384B] mb-4 flex flex-wrap items-baseline gap-3 sm:gap-4">
            <span className="text-2xl sm:text-4xl font-semibold tracking-normal">ML Engine</span>
            <span className="text-5xl sm:text-7xl text-[#4C6072] font-medium tracking-normal opacity-80">Status</span>
          </h1>
          <p className="font-sans text-[#4C6072] leading-relaxed">
            Telemetry and performance metrics for the active computer vision model.
          </p>
        </div>
      </BlurReveal>

      <Fade delay={0.1}>
        <div className="bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 p-8 rounded-[32px] mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#26384B] flex items-center justify-center text-[#F6F4EF] shadow-[0_8px_30px_rgba(37,58,74,0.2)]">
              <Brain className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-sans text-[#4C6072] uppercase tracking-widest mb-1 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active Model
              </div>
              <h2 className="app-heading-3 text-[#26384B] mt-2">{data.current_model}</h2>
              <div className="text-sm font-sans text-[#4C6072] mt-1">Version {data.model_version} • Trained on {data.dataset_version}</div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-xs font-sans text-[#4C6072] uppercase tracking-widest mb-1">Inference Engine</div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-white/60 shadow-sm rounded-xl">
              <Cpu className="w-4 h-4 text-[#26384B]" />
              <span className="font-sans text-sm font-medium text-[#26384B]">{data.inference_engine}</span>
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
          <div className="bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 p-8 rounded-[32px]">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-8 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Performance
            </h3>
            <div className="flex items-end gap-4 mb-4">
              <div className="app-heading-1 text-[#26384B]">{data.avg_inference_time_ms}</div>
              <div className="font-sans text-[#4C6072] pb-2">ms / inference</div>
            </div>
            <div className="w-full h-1 bg-[#26384B]/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#26384B] rounded-full w-[30%]" />
            </div>
          </div>
        </Fade>

        <Fade delay={0.7}>
          <div className="bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 p-8 rounded-[32px]">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-8 flex items-center gap-2">
              <Server className="w-4 h-4" /> Reliability
            </h3>
            <div className="flex justify-between items-end mb-4">
              <div>
                <div className="app-heading-1 text-emerald-600">
                  {data.failed_inferences === 0 ? "100" : (99.9).toFixed(1)}
                  <span className="app-heading-3">%</span>
                </div>
                <div className="font-sans text-[#4C6072] mt-2">Success Rate</div>
              </div>
              <div className="text-right pb-2">
                <div className="font-sans font-medium text-[#26384B]">{data.failed_inferences}</div>
                <div className="font-sans text-xs text-[#4C6072]">Failed Inferences</div>
              </div>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  );
};
