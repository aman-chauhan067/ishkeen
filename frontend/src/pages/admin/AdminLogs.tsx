import { useState, useEffect } from 'react';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { Terminal, Trash2, Search, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  user_id: string | null;
  ip_address: string | null;
  endpoint: string | null;
  method: string | null;
  status_code: number | null;
  duration_ms: number | null;
  message: string;
  exception: string | null;
}

export const AdminLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      const response = await api.get<LogEntry[]>('/admin/logs?limit=200');
      setLogs(response);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all system logs?")) return;
    await api.delete('/admin/logs');
    setLogs([]);
  };

  const filteredLogs = logs.filter(l => 
    l.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.endpoint && l.endpoint.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && logs.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 h-full flex flex-col">
      <BlurReveal>
        <div className="flex justify-between items-start mb-4">
          <div className="max-w-2xl">
            <h1 className="font-serif text-4xl text-[#26384B] tracking-tight mb-4 flex items-center gap-4">
              <Terminal className="w-8 h-8 text-[#4C6072]" />
              System Logs
            </h1>
            <p className="font-sans text-[#4C6072] leading-relaxed">
              Real-time server telemetry, API access logs, and exception tracking.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-[#4C6072] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search endpoints..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full border border-[#26384B]/10 text-sm focus:outline-none focus:border-[#26384B]/30 w-64"
              />
            </div>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={clearLogs}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Logs
            </Button>
          </div>
        </div>
      </BlurReveal>

      <Fade delay={0.1} className="flex-1 bg-[#1A2A36] rounded-2xl border border-[#26384B]/10 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[#4C6072] border-b border-white/5">
                <th className="py-2 px-4 font-normal w-32">Timestamp</th>
                <th className="py-2 px-4 font-normal w-24">Level</th>
                <th className="py-2 px-4 font-normal w-20">Method</th>
                <th className="py-2 px-4 font-normal w-20">Status</th>
                <th className="py-2 px-4 font-normal w-24">Duration</th>
                <th className="py-2 px-4 font-normal">Message / Endpoint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-gray-500">
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded ${
                      log.level === 'ERROR' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{log.method || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={log.status_code && log.status_code >= 400 ? 'text-red-400' : 'text-emerald-400'}>
                      {log.status_code || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200">{log.endpoint || log.message}</span>
                      {log.exception && (
                        <div title={log.exception} className="cursor-help flex items-center">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-sans text-sm">No system logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Fade>
    </div>
  );
};
