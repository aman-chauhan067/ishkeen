import { useState, useEffect } from 'react';
import { Search, User, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Fade } from '../../components/motion';

export const AdminGlobalSearch = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{users: any[], analyses: any[]}>({ users: [], analyses: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search modal (logic handled in Shell)
        }
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (query.length < 2) {
      setResults({ users: [], analyses: [] });
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const userRes = await api.get<any[]>(`/admin/users?search=${query}&limit=3`);
        // We could also search analyses but MVP just search users
        setResults({ users: userRes, analyses: [] });
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(search, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  if (!isOpen) return null;

  return (
    <Fade>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-32 px-4 bg-[#26384B]/20 backdrop-blur-sm" onClick={onClose}>
        <div 
          className="bg-[#F6F4EF] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#26384B]/5 overflow-hidden" 
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center px-4 py-4 border-b border-[#26384B]/5">
            <Search className="w-5 h-5 text-[#4C6072] mr-3" />
            <input 
              autoFocus
              type="text" 
              placeholder="Search users by email..." 
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-sans text-[#26384B] placeholder:text-[#4C6072]/50 text-lg"
            />
            <div className="flex items-center gap-1 bg-[#F7F7F5] border border-[#26384B]/10 rounded px-2 py-1 text-[10px] font-sans font-bold text-[#4C6072]">
              ESC
            </div>
            <button onClick={onClose} className="ml-4 text-[#4C6072] hover:text-[#26384B] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && query.length >= 2 ? (
              <div className="p-8 text-center text-[#4C6072] font-sans text-sm">Searching...</div>
            ) : query.length >= 2 && results.users.length === 0 ? (
              <div className="p-8 text-center text-[#4C6072] font-sans text-sm">No results found for "{query}"</div>
            ) : query.length >= 2 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-[10px] font-bold text-[#4C6072] uppercase tracking-widest">Users</div>
                {results.users.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => {
                      navigate(`/admin/users/${u.id}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#F7F7F5] rounded-xl transition-colors group text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#26384B]/5 flex items-center justify-center">
                        <User className="w-4 h-4 text-[#26384B]" />
                      </div>
                      <div>
                        <div className="font-sans font-medium text-[#26384B]">{u.email}</div>
                        <div className="font-sans text-[10px] text-[#4C6072] uppercase tracking-widest">{u.role}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#4C6072] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#4C6072]/50 font-sans text-sm">Type at least 2 characters to search...</div>
            )}
          </div>
          
          <div className="bg-[#F7F7F5] px-4 py-3 border-t border-[#26384B]/5 flex justify-between items-center text-[10px] font-sans text-[#4C6072]">
            <div>Search across the entire Ishkeen platform</div>
            <div className="flex gap-4">
              <span className="flex items-center gap-1">Use <kbd className="bg-white border border-[#26384B]/10 rounded px-1.5 py-0.5">↑↓</kbd> to navigate</span>
              <span className="flex items-center gap-1">Press <kbd className="bg-white border border-[#26384B]/10 rounded px-1.5 py-0.5">Enter</kbd> to select</span>
            </div>
          </div>
        </div>
      </div>
    </Fade>
  );
};
