import { useState, useEffect } from 'react';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { Activity, Database, Server, Cpu, HardDrive, Network } from 'lucide-react';

interface SystemHealthResponse {
  backend_status: string;
  database_status: string;
  storage_status: string;
  ml_service_status: string;
  memory_usage_percent: number;
  cpu_usage_percent: number;
  disk_usage_percent: number;
  active_sessions: number;
}

const ResourceGauge = ({ label, percentage, icon: Icon }: any) => (
  <div className="bg-[#F6F4EF] p-6 rounded-2xl border border-[#26384B]/5">
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2 text-[#4C6072]">
        <Icon className="w-4 h-4" />
        <span className="font-sans text-xs font-bold uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-serif text-2xl text-[#26384B]">{percentage.toFixed(1)}%</div>
    </div>
    <div className="w-full h-2 bg-[#26384B]/5 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-1000 ${
          percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  </div>
);

const ServiceStatus = ({ label, status, icon: Icon }: any) => {
  const isHealthy = status.toLowerCase() === 'healthy' || status.toLowerCase() === 'connected';
  
  return (
    <div className="flex items-center justify-between p-4 bg-[#F6F4EF] rounded-xl border border-[#26384B]/5 hover:border-[#26384B]/20 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isHealthy ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="font-sans font-medium text-[#26384B]">{label}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <span className="font-sans text-xs uppercase tracking-widest text-[#4C6072]">{status}</span>
      </div>
    </div>
  );
};

export const AdminHealth = () => {
  const [data, setData] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await api.get<SystemHealthResponse>('/admin/system/health');
      setData(response);
    } catch (error) {
      console.error("Failed to fetch system health", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
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
        <div className="flex justify-between items-end mb-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl text-[#26384B] tracking-tight mb-4">System Health</h1>
            <p className="font-sans text-[#4C6072] leading-relaxed">
              Real-time infrastructure monitoring. Tracks service availability, resource utilization, and active sessions.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-sans text-xs font-bold tracking-wide uppercase">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Telemetry
          </div>
        </div>
      </BlurReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Fade delay={0.1}>
            <ResourceGauge label="CPU Utilization" percentage={data.cpu_usage_percent} icon={Cpu} />
          </Fade>
          <Fade delay={0.2}>
            <ResourceGauge label="Memory Usage" percentage={data.memory_usage_percent} icon={Server} />
          </Fade>
          <Fade delay={0.3}>
            <ResourceGauge label="Disk Storage" percentage={data.disk_usage_percent} icon={HardDrive} />
          </Fade>
          <Fade delay={0.4}>
            <div className="bg-[#F6F4EF] p-6 rounded-2xl border border-[#26384B]/5">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-[#4C6072]">
                  <Activity className="w-4 h-4" />
                  <span className="font-sans text-xs font-bold uppercase tracking-widest">Active Sessions</span>
                </div>
              </div>
              <div className="font-serif text-5xl text-[#26384B]">{data.active_sessions}</div>
              <div className="font-sans text-xs text-[#4C6072] mt-2">Currently authenticated users</div>
            </div>
          </Fade>
        </div>

        <Fade delay={0.5} className="flex flex-col gap-4">
          <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-2 px-2">Services</h3>
          <ServiceStatus label="Core API Cluster" status={data.backend_status} icon={Network} />
          <ServiceStatus label="Primary Database" status={data.database_status} icon={Database} />
          <ServiceStatus label="Inference Engine" status={data.ml_service_status} icon={Cpu} />
          <ServiceStatus label="Object Storage" status={data.storage_status} icon={HardDrive} />
        </Fade>
      </div>
    </div>
  );
};
