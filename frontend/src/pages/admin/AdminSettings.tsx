import { useState, useEffect } from 'react';
import { BlurReveal, Fade } from '../../components/motion';
import { api } from '../../lib/api';
import { Settings, Save, Shield, Database, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface AdminSettingsResponse {
  default_daily_limit: number;
  registration_enabled: boolean;
  analysis_enabled: boolean;
  maintenance_mode: boolean;
  export_enabled: boolean;
  ai_analysis_enabled: boolean;
  recommendation_engine_enabled: boolean;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<AdminSettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get<AdminSettingsResponse>('/admin/settings');
        setSettings(response);
      } catch (error) {
        console.error("Failed to fetch admin settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    setSaveStatus('saving');
    try {
      await api.post('/admin/settings', settings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof AdminSettingsResponse) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await api.getBlob('/admin/export/v2');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ishkeen_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      console.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#26384B]/20 border-t-[#26384B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) return null;

  const ToggleRow = ({
    label,
    description,
    field,
    danger = false,
  }: {
    label: string;
    description: string;
    field: keyof AdminSettingsResponse;
    danger?: boolean;
  }) => {
    const isOn = !!settings[field];
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-sans font-bold text-[#26384B] text-base mb-1">{label}</h3>
          <p className="font-sans text-sm text-[#4C6072] leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 mt-2 sm:mt-0">
          <span className={`text-xs font-bold tracking-widest uppercase ${isOn ? 'text-emerald-600' : 'text-[#A8B5A2]'}`}>
            {isOn ? 'Active' : 'Disabled'}
          </span>
          <button
            onClick={() => handleToggle(field)}
            className={`w-14 h-8 rounded-full flex items-center transition-colors px-1 shadow-inner focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isOn ? (danger ? 'bg-red-500 focus:ring-red-500' : 'bg-[#26384B] focus:ring-[#26384B]') : 'bg-gray-200 focus:ring-gray-300'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOn ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 sm:space-y-12 pb-24 max-w-4xl mx-auto">
      <BlurReveal>
        <div className="mb-6 sm:mb-8 px-4 sm:px-0">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#26384B] tracking-tight mb-4 flex items-center gap-3">
            <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-[#4C6072]" />
            Platform Settings
          </h1>
          <p className="font-sans text-sm sm:text-base text-[#4C6072] leading-relaxed max-w-2xl">
            Global configuration for Ishkeen. Changes apply immediately to all active users.
          </p>
        </div>
      </BlurReveal>

      {/* Critical Controls */}
      <Fade delay={0.1}>
        <div className="bg-white/60 backdrop-blur-[24px] rounded-2xl sm:rounded-3xl border border-white/40 shadow-[0_8px_30px_rgba(37,58,74,0.04)] overflow-hidden mx-4 sm:mx-0">
          <div className="p-6 sm:p-8 border-b border-[#26384B]/5 flex items-center gap-3 text-[#26384B] bg-white/40">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="font-sans font-bold uppercase tracking-widest text-xs sm:text-sm">Critical Controls</h2>
          </div>
          <div className="p-6 sm:p-8 space-y-8">
            <ToggleRow
              field="maintenance_mode"
              label="Maintenance Mode"
              description="Disables API access for non-admin users. Use during major migrations."
              danger
            />
            <ToggleRow
              field="registration_enabled"
              label="Registration Open"
              description="Allow new users to sign up."
            />
          </div>
        </div>
      </Fade>

      {/* Features & Limits */}
      <Fade delay={0.2}>
        <div className="bg-white/60 backdrop-blur-[24px] rounded-2xl sm:rounded-3xl border border-white/40 shadow-[0_8px_30px_rgba(37,58,74,0.04)] overflow-hidden mx-4 sm:mx-0">
          <div className="p-6 sm:p-8 border-b border-[#26384B]/5 flex items-center gap-3 text-[#26384B] bg-white/40">
            <Database className="w-5 h-5 text-[#4C6072]" />
            <h2 className="font-sans font-bold uppercase tracking-widest text-xs sm:text-sm">Features &amp; Limits</h2>
          </div>
          <div className="p-6 sm:p-8 space-y-8">
            {/* Daily limit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-sans font-bold text-[#26384B] text-base mb-1">Default Daily Analysis Limit</h3>
                <p className="font-sans text-sm text-[#4C6072] leading-relaxed">Default number of analyses a new user can perform daily.</p>
              </div>
              <div className="mt-2 sm:mt-0 flex-shrink-0">
                <input
                  type="number"
                  value={settings.default_daily_limit}
                  onChange={(e) => setSettings({ ...settings, default_daily_limit: parseInt(e.target.value) || 0 })}
                  className="w-24 bg-white border border-[#26384B]/10 rounded-xl px-4 py-2 text-sm text-center font-bold text-[#26384B] focus:outline-none focus:border-[#26384B]/30 focus:ring-2 focus:ring-[#26384B]/10 transition-all shadow-sm"
                />
              </div>
            </div>

            <ToggleRow
              field="analysis_enabled"
              label="Image Analysis Uploads"
              description="Toggle global access to the image analysis engine."
            />

            <ToggleRow
              field="ai_analysis_enabled"
              label="AI Skin Analysis Engine"
              description="Toggle global access to the AI analysis model."
            />

            <ToggleRow
              field="recommendation_engine_enabled"
              label="AI Recommendation Engine"
              description="Toggle global access to automated routine generation."
            />

            <ToggleRow
              field="export_enabled"
              label="Data Export"
              description="Allow admins to export the database."
            />
          </div>
        </div>
      </Fade>

      {/* Database Actions */}
      <Fade delay={0.3}>
        <div className="bg-white/60 backdrop-blur-[24px] rounded-2xl sm:rounded-3xl border border-white/40 shadow-[0_8px_30px_rgba(37,58,74,0.04)] overflow-hidden mx-4 sm:mx-0">
          <div className="p-6 sm:p-8 border-b border-[#26384B]/5 flex items-center gap-3 text-[#26384B] bg-white/40">
            <Download className="w-5 h-5 text-[#4C6072]" />
            <h2 className="font-sans font-bold uppercase tracking-widest text-xs sm:text-sm">Database Actions</h2>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="font-sans font-bold text-[#26384B] text-base mb-1">Export Database V2</h3>
                <p className="font-sans text-sm text-[#4C6072] leading-relaxed">Download a full JSON snapshot of the database. Requires export to be enabled.</p>
              </div>
              <Button
                onClick={handleExport}
                disabled={exporting || !settings.export_enabled}
                variant="outline"
                className="flex items-center justify-center gap-2 flex-shrink-0 w-full sm:w-auto bg-white/50"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export Snapshot'}
              </Button>
            </div>
          </div>
        </div>
      </Fade>

      {/* Sticky Save Bar */}
      <div className="fixed sm:sticky bottom-0 left-0 right-0 sm:left-auto sm:right-auto bg-white/80 backdrop-blur-xl sm:bg-[#F6F4EF]/95 sm:backdrop-blur-sm border-t border-[#26384B]/5 py-4 px-6 sm:px-8 sm:-mx-8 flex items-center justify-between z-40 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <span className="hidden sm:inline-block">
          {saveStatus === 'saved' && <span className="text-emerald-600 text-sm font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" />Settings saved successfully</span>}
          {saveStatus === 'error' && <span className="text-red-500 text-sm font-bold">Failed to save. Try again.</span>}
          {(saveStatus === 'idle' || saveStatus === 'saving') && (
            <span className="text-[#4C6072] text-xs font-medium tracking-wide">Changes will apply globally.</span>
          )}
        </span>
        <Button onClick={saveSettings} disabled={saving} className="flex items-center justify-center gap-2 w-full sm:w-auto shadow-md hover:shadow-lg">
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
