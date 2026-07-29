import { useState, useEffect } from 'react';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { Search, ChevronRight, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface UserAdminResponse {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  analysis_count: number;
  onboarding_completed: boolean;
  last_activity: string;
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserAdminResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get<UserAdminResponse[]>(`/admin/users?search=${search}`);
        setUsers(response);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Simple debounce
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-8">
      <BlurReveal>
        <div className="max-w-2xl">
          <h1 className="text-left text-[#26384B] mb-4 flex flex-wrap items-baseline gap-3 sm:gap-4">
            <span className="text-2xl sm:text-4xl font-semibold tracking-normal">User</span>
            <span className="text-5xl sm:text-7xl text-[#4C6072] font-medium tracking-normal opacity-80">Management</span>
          </h1>
          <p className="font-sans text-[#4C6072] leading-relaxed">
            Monitor and manage Ishkeen user accounts, onboarding progress, and activity.
          </p>
        </div>
      </BlurReveal>

      <Fade delay={0.1}>
        <div className="flex justify-between items-center bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 p-4 rounded-[24px]">
          <div className="w-96 relative">
            <Search className="w-4 h-4 text-[#4C6072] absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/60 shadow-sm rounded-xl font-sans text-sm text-[#26384B] placeholder:text-[#4C6072]/50 focus:outline-none focus:ring-2 focus:ring-[#26384B]/20 transition-all"
            />
          </div>
          <div className="text-[#4C6072] font-sans text-xs font-medium tracking-widest uppercase">
            {users.length} Users Found
          </div>
        </div>
      </Fade>

      <Fade delay={0.2}>
        <div className="bg-white/40 backdrop-blur-[40px] border border-white/60 shadow-[0_0_50px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-white/50 rounded-[32px] overflow-hidden">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className="border-b border-[#26384B]/5 text-[#4C6072] text-[10px] uppercase tracking-widest bg-white/30">
                    <th className="px-6 py-4 font-medium">User</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Analyses</th>
                    <th className="px-6 py-4 font-medium">Last Activity</th>
                    <th className="px-6 py-4 font-medium">Joined</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26384B]/5">
                  {users.map((user) => (
                    <tr 
                      key={user.id} 
                      onClick={() => navigate(`/admin/users/${user.id}`)}
                      className="group hover:bg-white/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#26384B]/5 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-[#26384B]" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#26384B]">{user.email}</div>
                            <div className="text-[10px] text-[#4C6072] uppercase tracking-wider">{user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.onboarding_completed ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium tracking-wide uppercase">
                            Onboarded
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium tracking-wide uppercase">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#26384B]">{user.analysis_count}</td>
                      <td className="px-6 py-4 text-xs text-[#4C6072]">
                        {user.last_activity ? format(new Date(user.last_activity), 'MMM d, yyyy HH:mm') : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#4C6072]">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-[#4C6072] group-hover:text-[#26384B] transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#4C6072] font-sans text-sm">
                        No users found.
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
