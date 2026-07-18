import { useState, useEffect } from 'react';
import { X, Bell, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

type NotificationType = 'info' | 'warning' | 'success';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  link?: string | null;
}

export const AdminNotifications = ({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get<Notification[]>('/admin/notifications');
      setNotifications(response);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.patch('/admin/notifications/read-all');
    } catch (e) {
      console.error(e);
    }
  };

  const markAsReadAndNavigate = async (notification: Notification) => {
    if (!notification.read) {
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      try {
        await api.patch(`/admin/notifications/${notification.id}/read`);
      } catch (e) {
        console.error(e);
      }
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await api.delete(`/admin/notifications/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#253A4A]/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-screen max-w-md transform transition ease-in-out duration-500 sm:duration-700 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col bg-[#FCFBF8] border-l border-[#253A4A]/10 shadow-2xl">
          
          {/* Header */}
          <div className="px-6 py-8 border-b border-[#253A4A]/10">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#253A4A] flex items-center gap-3">
                <Bell className="w-5 h-5" /> Notifications
              </h2>
              <button
                type="button"
                className="rounded-full p-2 text-[#5C7E9A] hover:bg-[#253A4A]/5 hover:text-[#253A4A] transition-colors outline-none"
                onClick={onClose}
              >
                <span className="sr-only">Close panel</span>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <span className="font-sans text-xs text-[#5C7E9A]">
                {notifications.filter(n => !n.read).length} unread
              </span>
              <button 
                onClick={markAllAsRead}
                className="font-sans text-[10px] uppercase tracking-widest text-[#253A4A] hover:text-[#5C7E9A] font-bold transition-colors"
              >
                Mark all as read
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-6 h-6 border-2 border-[#253A4A]/20 border-t-[#253A4A] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    onClick={() => markAsReadAndNavigate(notification)}
                    className={`p-4 rounded-2xl border transition-all ${notification.link ? 'cursor-pointer hover:border-[#253A4A]/20' : ''} ${
                      notification.read 
                        ? 'bg-[#F7F7F5] border-transparent opacity-60' 
                        : 'bg-white border-[#253A4A]/10 shadow-sm'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="shrink-0 mt-1">
                        {notification.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                        {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`font-sans text-sm font-medium ${notification.read ? 'text-[#5C7E9A]' : 'text-[#253A4A]'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-[10px] text-[#5C7E9A] whitespace-nowrap">
                              {format(new Date(notification.created_at), 'MMM d, HH:mm')}
                            </span>
                            <button
                              onClick={(e) => deleteNotification(e, notification.id)}
                              className="text-[#5C7E9A] hover:text-red-500 transition-colors focus:outline-none"
                              aria-label="Delete notification"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="font-sans text-xs text-[#5C7E9A] leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-center text-[#5C7E9A] font-sans text-sm mt-12">
                    No notifications right now.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
