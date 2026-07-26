import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { ArrowLeft, User as UserIcon, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';

interface UserDetailsResponse {
  user: {
    id: string;
    email: string;
    username: string | null;
    role: string;
    created_at: string;
    is_active: boolean;
    is_email_verified: boolean;
    daily_analysis_limit: number;
    today_analyses: number;
  };
  profile: any;
  questionnaire: any;
  recent_analyses: any[];
}

export const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<UserDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [limitInput, setLimitInput] = useState('');

  const fetchUser = async () => {
    try {
      const response = await api.get<UserDetailsResponse>(`/admin/users/${userId}`);
      setData(response);
      setLimitInput(response.user.daily_analysis_limit.toString());
    } catch (error) {
      console.error("Failed to fetch user details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchUser();
  }, [userId]);

  const toggleStatus = async () => {
    if (!data) return;
    await api.put(`/admin/users/${userId}/status`, { is_active: !data.user.is_active });
    fetchUser();
  };

  const toggleRole = async () => {
    if (!data) return;
    const newRole = data.user.role === 'admin' ? 'user' : 'admin';
    await api.put(`/admin/users/${userId}/role`, { role: newRole });
    fetchUser();
  };

  const verifyEmail = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${userId}/verify`);
      fetchUser();
    } catch {
      alert('Failed to verify user');
    } finally {
      setActionLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${userId}/resend-verification`);
      alert('Verification email resent.');
    } catch {
      alert('Failed to resend verification');
    } finally {
      setActionLoading(false);
    }
  };

  const updateLimit = async () => {
    const limit = parseInt(limitInput);
    if (isNaN(limit)) return;
    await api.put(`/admin/users/${userId}/limit`, { limit });
    fetchUser();
  };

  const deleteAnalysis = async (analysisId: string) => {
    if (!confirm("Delete this analysis?")) return;
    await api.delete(`/admin/analyses/${analysisId}`);
    fetchUser();
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return (
    <div className="text-center mt-20 font-sans text-[#4C6072]">User not found.</div>
  );

  return (
    <div className="space-y-8 pb-12">
      <BlurReveal>
        <button 
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-[#4C6072] hover:text-[#26384B] transition-colors mb-6 font-sans text-xs font-medium tracking-widest uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-[#26384B] flex items-center justify-center text-[#F6F4EF] text-2xl font-sans shrink-0">
              {data.user.email[0].toUpperCase()}
            </div>
            <div>
              <h1 className="font-serif text-4xl text-[#26384B] tracking-tight mb-2">{data.user.email}</h1>
              <div className="flex items-center gap-4 text-[#4C6072] font-sans text-sm">
                <span className="flex items-center gap-1.5"><UserIcon className="w-4 h-4" /> {data.user.role}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {format(new Date(data.user.created_at), 'MMM d, yyyy')}</span>
                {data.user.is_active ? (
                  <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Active</span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-500"><Activity className="w-4 h-4" /> Blocked</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </BlurReveal>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <Fade delay={0.1}>
          <div className="bg-[#F6F4EF] p-8 rounded-3xl border border-[#26384B]/5">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-6">User Profile & Limits</h3>
            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-[#26384B]/5">
                <span className="font-sans text-sm text-[#4C6072]">User ID</span>
                <span className="font-sans text-sm font-medium text-[#26384B] font-mono text-xs">{data.user.id}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[#26384B]/5">
                <span className="font-sans text-sm text-[#4C6072]">Today's Analyses</span>
                <span className="font-sans text-sm font-medium text-[#26384B]">{data.user.today_analyses}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[#26384B]/5">
                <span className="font-sans text-sm text-[#4C6072]">Remaining Daily Limit</span>
                <span className="font-sans text-sm font-medium text-[#26384B]">
                  {data.user.role === 'admin' ? 'Unlimited' : Math.max(0, data.user.daily_analysis_limit - data.user.today_analyses)}
                </span>
              </div>
            </div>
            
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mt-8 mb-4">Account Controls</h3>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className={data.user.is_active ? "text-red-600 border-red-200 hover:bg-red-50" : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"}
                onClick={toggleStatus}
              >
                {data.user.is_active ? "Block User" : "Unblock User"}
              </Button>
              <Button variant="outline" onClick={toggleRole}>
                {data.user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
              </Button>
              {!data.user.is_email_verified && (
                <>
                  <Button variant="outline" className="border-[#26384B]/20" onClick={verifyEmail} isLoading={actionLoading}>
                    Verify Email
                  </Button>
                  <Button variant="outline" className="border-[#26384B]/20" onClick={resendVerification} isLoading={actionLoading}>
                    Resend Verification
                  </Button>
                </>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <input 
                type="number" 
                value={limitInput} 
                onChange={(e) => setLimitInput(e.target.value)}
                className="flex-1 bg-white border border-[#26384B]/10 rounded-xl px-4 text-sm"
                placeholder="Daily Limit"
              />
              <Button onClick={updateLimit}>Update Limit</Button>
            </div>
          </div>
        </Fade>

        <Fade delay={0.2}>
          <div className="bg-[#F6F4EF] p-8 rounded-3xl border border-[#26384B]/5">
            <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-6">Skin Profile</h3>
            {data.profile ? (
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-[#26384B]/5">
                  <span className="font-sans text-sm text-[#4C6072]">Skin Type</span>
                  <span className="font-sans text-sm font-medium text-[#26384B] capitalize">{data.profile.skin_type}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-[#26384B]/5">
                  <span className="font-sans text-sm text-[#4C6072]">Sensitivity</span>
                  <span className="font-sans text-sm font-medium text-[#26384B] capitalize">{data.profile.sensitivity}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#4C6072] font-sans">No profile completed yet.</p>
            )}
          </div>
        </Fade>
      </div>

      <Fade delay={0.3} className="mt-12">
        <h3 className="font-sans text-xs font-bold uppercase tracking-widest text-[#26384B] mb-6">Analysis History</h3>
        <div className="bg-white rounded-3xl border border-[#26384B]/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-sm">
              <thead className="bg-[#F6F4EF] text-[#4C6072]">
                <tr>
                  <th className="p-6 font-medium">Date</th>
                  <th className="p-6 font-medium">Status</th>
                  <th className="p-6 font-medium">Inference Time</th>
                  <th className="p-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26384B]/5 text-[#26384B]">
                {data.recent_analyses.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-[#F6F4EF]/50 transition-colors">
                    <td className="p-6 whitespace-nowrap">
                      {format(new Date(analysis.created_at), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        analysis.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        analysis.status === 'failed' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {analysis.status}
                      </span>
                    </td>
                    <td className="p-6 text-[#4C6072]">{analysis.inference_time_ms}ms</td>
                    <td className="p-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => window.open(`/app/results/${analysis.id}`, '_blank')}
                          className="text-[#4C6072] hover:text-[#26384B] font-medium"
                        >
                          Open Report
                        </button>
                        <button 
                          onClick={() => deleteAnalysis(analysis.id)}
                          className="text-red-400 hover:text-red-600 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.recent_analyses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-[#4C6072]">No analyses found for this user.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Fade>
    </div>
  );
};
