import { useState, useEffect } from 'react';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { Database, Image as ImageIcon, CheckSquare, AlertTriangle, Download, RefreshCw } from 'lucide-react';

interface DatasetResponse {
  version: string;
  training_images: number;
  validation_images: number;
  test_images: number;
  annotation_status: string;
  missing_metadata: number;
  duplicate_images: number;
  dataset_health: string;
  latest_import: string;
}

const StatBox = ({ label, value, icon: Icon, colorClass = "text-[#253A4A]" }: any) => (
  <div className="bg-[#F7F7F5] p-5 rounded-xl border border-[#253A4A]/5 flex items-center gap-4">
    <div className={`p-3 bg-white rounded-lg shadow-sm ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="font-sans text-xs text-[#5C7E9A] uppercase tracking-widest mb-0.5">{label}</div>
      <div className={`font-serif text-2xl ${colorClass}`}>{value}</div>
    </div>
  </div>
);

export const AdminDataset = () => {
  const [data, setData] = useState<DatasetResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const response = await api.get<DatasetResponse>('/admin/dataset');
        setData(response);
      } catch (error) {
        console.error("Failed to fetch dataset status", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();
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
        <div className="flex justify-between items-end mb-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl text-[#253A4A] tracking-tight mb-4">Dataset Explorer</h1>
            <p className="font-sans text-[#5C7E9A] leading-relaxed">
              Manage the master computer vision dataset. Review splits, annotation coverage, and export readiness.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#253A4A]/5 hover:bg-[#253A4A]/10 text-[#253A4A] transition-colors font-sans text-xs font-medium tracking-wide">
              <RefreshCw className="w-4 h-4" /> Sync
            </button>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/admin/export/v2`, {
                    credentials: 'include'
                  });
                  if (!response.ok) throw new Error("Export failed");
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ishkeen_dataset_v2_${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch (e) {
                  alert('Export failed');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#253A4A] text-[#FCFBF8] hover:bg-[#1A2A36] transition-colors font-sans text-xs font-medium tracking-wide"
            >
              <Download className="w-4 h-4" /> Export V2
            </button>
          </div>
        </div>
      </BlurReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <Fade delay={0.1}>
          <StatBox label="Training Set" value={data.training_images.toLocaleString()} icon={ImageIcon} />
        </Fade>
        <Fade delay={0.2}>
          <StatBox label="Validation Set" value={data.validation_images.toLocaleString()} icon={CheckSquare} />
        </Fade>
        <Fade delay={0.3}>
          <StatBox label="Test Set" value={data.test_images.toLocaleString()} icon={Database} />
        </Fade>
        <Fade delay={0.4}>
          <StatBox 
            label="Anomalies" 
            value={(data.missing_metadata + data.duplicate_images).toString()} 
            icon={AlertTriangle} 
            colorClass={data.missing_metadata > 0 ? "text-amber-500" : "text-emerald-500"} 
          />
        </Fade>
      </div>

      <Fade delay={0.5}>
        <div className="bg-[#FCFBF8] p-8 rounded-3xl border border-[#253A4A]/5 mt-8">
          <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#253A4A] mb-8">Current Active Version</h3>
          
          <div className="flex items-center gap-8 border-b border-[#253A4A]/5 pb-8 mb-8">
            <div className="text-6xl text-[#253A4A] font-serif tracking-tighter">
              {data.version}
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-sans text-[#5C7E9A] mb-2 uppercase tracking-widest">
                  <span>Annotation Progress</span>
                  <span className="font-medium text-[#253A4A]">{data.annotation_status}</span>
                </div>
                <div className="w-full h-2 bg-[#253A4A]/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#253A4A] rounded-full" style={{ width: '98%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-xs font-sans text-[#5C7E9A] uppercase tracking-widest mb-1">Dataset Health</div>
              <div className="text-sm font-sans font-medium text-emerald-600 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {data.dataset_health}
              </div>
            </div>
            <div>
              <div className="text-xs font-sans text-[#5C7E9A] uppercase tracking-widest mb-1">Missing Metadata</div>
              <div className="text-sm font-sans font-medium text-[#253A4A]">{data.missing_metadata} files</div>
            </div>
            <div>
              <div className="text-xs font-sans text-[#5C7E9A] uppercase tracking-widest mb-1">Last Import</div>
              <div className="text-sm font-sans font-medium text-[#253A4A]">
                {new Date(data.latest_import).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </Fade>
    </div>
  );
};
