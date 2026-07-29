import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { PageTransition } from '../../components/motion';
import { DragonflyLogo } from '../../components/ui/DragonflyLogo';
import {
  LayoutDashboard,
  Users,
  Microscope,
  Database,
  Brain,
  Activity,
  ScrollText,
  Package,
  Bell,
  LogOut,
  ChevronLeft,
  Settings,
  Search
} from 'lucide-react';
import { AdminGlobalSearch } from './AdminGlobalSearch';
import { AdminNotifications } from './AdminNotifications';

const ADMIN_NAVIGATION = [
  { name: 'Overview', to: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Users', to: '/admin/users', icon: Users },
  { name: 'Analyses', to: '/admin/analyses', icon: Microscope },
  { name: 'Products', to: '/admin/products', icon: Package },
  { name: 'Dataset', to: '/admin/dataset', icon: Database },
  { name: 'Models', to: '/admin/models', icon: Brain },
  { name: 'Health', to: '/admin/health', icon: Activity },
  { name: 'Logs', to: '/admin/logs', icon: ScrollText },
  { name: 'Settings', to: '/admin/settings', icon: Settings },
];

export const AdminShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F7F7F5] flex overflow-hidden selection:bg-[#26384B] selection:text-[#F6F4EF] relative z-10">
        
        {/* Global Background Doodles */}
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-5">
        </div>
        
        {/* Editorial Side Navigation */}
        <nav 
          className="w-64 border-r border-white/60 bg-white/40 backdrop-blur-[40px] shadow-[1px_0_50px_rgba(59,130,246,0.05)] flex flex-col transition-all duration-500 ease-out z-20"
          
          
        >
          {/* Header */}
          <div className="h-24 px-8 flex items-center border-b border-[#26384B]/5">
            <DragonflyLogo size="sm" subtitleText="OPERATIONS // v2.4" />
          </div>

          {/* Nav Links */}
          <div className="flex-1 py-8 px-4 flex flex-col gap-1 overflow-y-auto">
            {ADMIN_NAVIGATION.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.exact}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive 
                    ? 'bg-[#26384B] text-[#F6F4EF] shadow-[0_4px_20px_-4px_rgba(37,58,74,0.3)]' 
                    : 'text-[#4C6072] hover:bg-white/50 hover:text-[#26384B]'}
                `}
              >
                <item.icon className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-sans text-xs tracking-wider font-medium">
                  {item.name}
                </span>
              </NavLink>
            ))}
          </div>

          {/* Footer actions */}
          <div className="p-4 border-t border-[#26384B]/5 flex flex-col gap-2">
            <button
              onClick={() => navigate('/app/dashboard')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#4C6072] hover:bg-white/50 hover:text-[#26384B] transition-all duration-300"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-sans text-xs tracking-wider font-medium">Exit Admin</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500/80 hover:bg-red-500/10 hover:text-red-600 transition-all duration-300"
            >
              <LogOut className="w-4 h-4" strokeWidth={1.5} />
              <span className="font-sans text-xs tracking-wider font-medium">Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
          
          {/* Top Bar for Notifications & Profile */}
          <header className="absolute top-0 right-0 left-0 h-24 px-12 flex items-center justify-between z-10 bg-gradient-to-b from-[#F7F7F5] to-transparent pointer-events-none">
            <div className="flex-1 pointer-events-auto">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-3 px-4 py-2 bg-white/50 backdrop-blur-md border border-[#26384B]/10 rounded-xl text-[#4C6072] hover:bg-white hover:text-[#26384B] transition-colors shadow-sm"
              >
                <Search className="w-4 h-4" />
                <span className="font-sans text-xs">Search...</span>
                <div className="flex items-center gap-1 ml-4 text-[10px] font-bold">
                  <kbd className="bg-[#F7F7F5] border border-[#26384B]/10 rounded px-1.5 py-0.5">⌘</kbd>
                  <kbd className="bg-[#F7F7F5] border border-[#26384B]/10 rounded px-1.5 py-0.5">K</kbd>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-6 pointer-events-auto">
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 text-[#26384B] hover:bg-[#26384B]/5 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" strokeWidth={1.5} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F6F4EF]" />
              </button>
              <div className="flex items-center gap-3 pl-6 border-l border-[#26384B]/10">
                <div className="w-8 h-8 rounded-full bg-[#26384B] flex items-center justify-center text-[#F6F4EF] font-sans text-xs font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
              </div>
            </div>
          </header>

          <div className="pt-24 pb-12 px-12 max-w-7xl mx-auto min-h-full">
            <Outlet />
          </div>
        </main>

        <AdminGlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <AdminNotifications isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
      </div>
    </PageTransition>
  );
};
