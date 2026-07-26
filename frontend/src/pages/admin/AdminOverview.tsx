import { useState, useEffect } from 'react';
import { BlurReveal, Fade } from '../../components/motion';
import { 
  Users, 
  Microscope, 
  Activity, 
  Database,
  Brain,
  HardDrive,
  AlertTriangle
} from 'lucide-react';
import { api, BASE_URL } from '../../lib/api';

interface OverviewStats {
  total_users: number;
  today_users: number;
  active_users: number;
  blocked_users: number;
  total_analyses: number;
  today_analyses: number;
  average_processing_time: number;
  most_common_concern: string;
  most_recommended_ingredient: string;
  storage_used_mb: number;
  failed_analyses: number;
  system_health: string;
}

const StatCard = ({ title, value, icon: Icon, subtitle, isHealthy = true }: any) => (
  <div className="bg-[#F6F4EF] p-6 rounded-2xl border border-[#26384B]/5 flex flex-col justify-between h-40 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
    <div className="flex justify-between items-start">
      <div className="p-3 bg-[#F7F7F5] rounded-xl group-hover:bg-[#26384B]/5 transition-colors">
        <Icon className="w-5 h-5 text-[#26384B]" strokeWidth={1.5} />
      </div>
      {!isHealthy && (
        <span className="flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      )}
    </div>
    <div>
      <h3 className="font-sans font-medium text-[#4C6072] text-xs uppercase tracking-widest mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-3xl text-[#26384B]">{value}</span>
        {subtitle && <span className="font-sans text-xs text-[#4C6072]">{subtitle}</span>}
      </div>
    </div>
  </div>
);

export const AdminOverview = () => {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get<OverviewStats>('/admin/overview');
        setStats(response);
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-12 pb-12">
      <BlurReveal>
        <div className="flex justify-between items-start mb-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl text-[#26384B] tracking-tight mb-4">Operations Overview</h1>
            <p className="font-sans text-[#4C6072] leading-relaxed">
              Real-time telemetry for the Ishkeen platform. Monitor user acquisition, AI inference health, and system status.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                const response = await fetch(`${BASE_URL}/admin/export/v2`, {
                  credentials: 'include'
                });
                if (!response.ok) throw new Error("Export failed");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `ishkeen_export_v2_${new Date().toISOString()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              } catch (e) {
                console.error("Export failed", e);
                alert("Failed to export database");
              }
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#26384B] text-white rounded-full text-sm font-bold tracking-widest uppercase transition-all duration-300 hover:bg-[#1A2A36] shadow-lg hover:shadow-xl"
          >
            <Database className="w-4 h-4" />
            Export DB V2
          </button>
        </div>
      </BlurReveal>

      <Fade delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <StatCard title="Total Users" value={stats.total_users} icon={Users} subtitle={`+${stats.today_users} today`} />
          <StatCard title="Total Analyses" value={stats.total_analyses} icon={Microscope} subtitle={`+${stats.today_analyses} today`} />
          <StatCard title="Avg Processing" value={`${stats.average_processing_time}ms`} icon={Activity} />
          <StatCard title="Most Common" value={stats.most_common_concern || "N/A"} icon={Brain} subtitle="Top Concern" />
          <StatCard title="Active Users" value={stats.active_users} icon={Users} />
          <StatCard title="Blocked Users" value={stats.blocked_users} icon={AlertTriangle} isHealthy={stats.blocked_users === 0} />
          <StatCard title="Failed Analyses" value={stats.failed_analyses} icon={AlertTriangle} isHealthy={stats.failed_analyses === 0} />
          <StatCard title="Storage Used" value={`${stats.storage_used_mb} MB`} icon={HardDrive} />
        </div>
      </Fade>
    </div>
  );
};
