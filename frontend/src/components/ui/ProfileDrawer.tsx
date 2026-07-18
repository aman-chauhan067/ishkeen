import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../auth/AuthContext';
import { AmbientGlow } from '../motion/AmbientGlow';
import { Typography } from './Typography';
import { api } from '../../lib/api';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const { user, login } = useAuth();
  
  const initial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?';
  const displayYear = user?.created_at ? new Date(user.created_at).getFullYear() : '2024';

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setNameInput(user?.name || '');
      setIsEditingName(false);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, user?.name]);

  const handleSaveName = async () => {
    try {
      const updatedUser = await api.patch<typeof user>('/auth/me', { name: nameInput });
      if (updatedUser) login(updatedUser);
      setIsEditingName(false);
    } catch (e) {
      console.error('Failed to update name', e);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const updatedUser = await api.postForm<typeof user>('/auth/me/avatar', formData);
      if (updatedUser) login(updatedUser);
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const DrawerItem = ({ label, onClick }: { label: string, onClick?: () => void }) => (
    <button 
      onClick={onClick}
      className="group relative flex items-center justify-between w-full p-5 text-left bg-[#FCFBF8] border-b border-[#253A4A]/5 hover:bg-[#F8F5F1] transition-colors duration-[600ms] ease-[var(--luxury-ease)] focus:outline-none"
    >
      <AmbientGlow trigger="group-hover" blur="blur-[40px]" />
      <span className="text-[#253A4A] font-medium tracking-wide text-sm">{label}</span>
      <span className="text-[#5C7E9A] opacity-50">&rsaquo;</span>
    </button>
  );

  return (
    <>
      <input id="avatar-upload-input" type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="sr-only" />
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-0 z-50 bg-[#253A4A]/10 backdrop-blur-sm"
              onClick={onClose}
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[400px] bg-[#FCFBF8] shadow-[-20px_0_80px_rgba(37,58,74,0.05)] overflow-y-auto flex flex-col"
            >
              <div className="p-12 pb-6 flex flex-col items-center border-b border-[#253A4A]/5">
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="relative group w-32 h-32 rounded-full bg-[#F8F5F1] border border-[#253A4A]/10 flex items-center justify-center mb-6 shadow-[0_10px_40px_rgba(37,58,74,0.03)] overflow-hidden transition-transform hover:scale-105"
                  title="Update profile image"
                >
                  <AmbientGlow trigger="group-hover" blur="blur-[60px]" opacity="opacity-[0.08]" />
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover relative z-10" />
                  ) : (
                    <span className="text-[#253A4A] text-4xl font-editorial relative z-10">{initial}</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <span className="text-white text-xs tracking-widest uppercase">Upload</span>
                  </div>
                </button>

                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-2 w-full max-w-[200px]">
                    <input 
                      type="text" 
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      className="w-full px-3 py-1 bg-white border border-[#253A4A]/20 rounded text-center font-editorial text-lg text-[#253A4A] focus:outline-none"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="text-xs uppercase tracking-widest text-[#253A4A] font-bold">Save</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1 group cursor-pointer" onClick={() => setIsEditingName(true)} title="Edit name">
                    <Typography variant="h4" className="font-editorial text-center">
                      {user?.name || 'Guest User'}
                    </Typography>
                  </div>
                )}
                
                <Typography variant="caption" className="text-[#5C7E9A] tracking-wider uppercase mb-2">
                  {user?.email}
                </Typography>
                <Typography variant="caption" className="text-[#A8B5A2] mb-8">
                  Member since {displayYear}
                </Typography>
              </div>

              <div className="flex flex-col flex-1">
                <DrawerItem label="Profile" onClick={() => setIsEditingName(true)} />
                <DrawerItem label="Skin Profile" onClick={() => { onClose(); window.location.href = '/app/history'; }} />
                <DrawerItem label="Settings" onClick={() => { onClose(); window.location.href = '/app/settings'; }} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
