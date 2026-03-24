'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { Button } from '@/components/ui/Button';
import { getAllAgents } from '@/lib/agents/registry';
import {
  Settings,
  Users,
  Bell,
  Shield,
  Palette,
  Save,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Bot,
} from 'lucide-react';

type Section = 'general' | 'agents' | 'notifications' | 'auth' | 'appearance';

const sectionNav: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
  { id: 'agents', label: 'Agents', icon: <Bot className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'auth', label: 'Auth & Security', icon: <Shield className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="text-slate-400 hover:text-slate-200 transition-colors">
      {enabled
        ? <ToggleRight className="w-7 h-7 text-indigo-400" />
        : <ToggleLeft className="w-7 h-7" />
      }
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-800 last:border-0">
      <div className="flex-1 mr-6">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('general');
  const [saved, setSaved] = useState(false);

  // General settings state
  const [dashboardName, setDashboardName] = useState('Mission Control');
  const [timezone, setTimezone] = useState('America/New_York');

  // Agent toggles
  const allAgents = getAllAgents();
  const [agentEnabled, setAgentEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(allAgents.map(a => [a.id, true]))
  );
  const [defaultModel, setDefaultModel] = useState('claude-sonnet-4-6');

  // Notification toggles
  const [notifEmail, setNotifEmail] = useState(false);
  const [notifSlack, setNotifSlack] = useState(false);
  const [notifWorkflowComplete, setNotifWorkflowComplete] = useState(true);
  const [notifWorkflowFailed, setNotifWorkflowFailed] = useState(true);

  const handleSave = () => {
    // In a real app this would persist to backend/env
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <TopBar title="Settings" />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-slate-100">Settings</h1>
              <p className="text-slate-500 text-sm mt-1">Manage your Mission Control configuration</p>
            </div>

            <div className="flex gap-6">
              {/* Section Nav */}
              <aside className="w-48 flex-shrink-0">
                <nav className="space-y-1">
                  {sectionNav.map(({ id, label, icon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveSection(id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                        activeSection === id
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {icon}
                      {label}
                      {activeSection === id && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </button>
                  ))}
                </nav>
              </aside>

              {/* Section Content */}
              <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                {activeSection === 'general' && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-4">General</h2>
                    <SettingRow label="Dashboard Name" description="Shown in the sidebar header">
                      <input
                        type="text"
                        value={dashboardName}
                        onChange={e => setDashboardName(e.target.value)}
                        className="w-48 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                      />
                    </SettingRow>
                    <SettingRow label="Timezone" description="Used for displaying dates and scheduling">
                      <select
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className="w-48 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                      >
                        <optgroup label="North America">
                          <option value="America/New_York">Eastern (ET)</option>
                          <option value="America/Chicago">Central (CT)</option>
                          <option value="America/Denver">Mountain (MT)</option>
                          <option value="America/Los_Angeles">Pacific (PT)</option>
                        </optgroup>
                        <optgroup label="Europe">
                          <option value="Europe/London">London (GMT)</option>
                          <option value="Europe/Paris">Paris (CET)</option>
                          <option value="Europe/Berlin">Berlin (CET)</option>
                        </optgroup>
                        <optgroup label="Asia">
                          <option value="Asia/Tokyo">Tokyo (JST)</option>
                          <option value="Asia/Shanghai">Shanghai (CST)</option>
                          <option value="Asia/Singapore">Singapore (SGT)</option>
                          <option value="Asia/Dubai">Dubai (GST)</option>
                          <option value="Asia/Kolkata">India (IST)</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option value="UTC">UTC</option>
                          <option value="Australia/Sydney">Sydney (AEDT)</option>
                        </optgroup>
                      </select>
                    </SettingRow>
                  </div>
                )}

                {activeSection === 'agents' && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-1">Agents</h2>
                    <p className="text-xs text-slate-500 mb-4">Toggle agents on/off and set the default AI model</p>
                    <SettingRow label="Default Model" description="Model used for all agents unless overridden">
                      <select
                        value={defaultModel}
                        onChange={e => setDefaultModel(e.target.value)}
                        className="w-56 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50"
                      >
                        <optgroup label="Anthropic Claude">
                          <option value="claude-opus-4-6">Claude Opus 4.6 (Most capable)</option>
                          <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                          <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fastest)</option>
                        </optgroup>
                        <optgroup label="OpenAI">
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                          <option value="gpt-4">GPT-4</option>
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
                        </optgroup>
                        <optgroup label="Other">
                          <option value="gemini-pro">Google Gemini Pro</option>
                          <option value="llama-2-70b">Meta Llama 2 70B</option>
                        </optgroup>
                      </select>
                    </SettingRow>
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Agent Roster</p>
                      {allAgents.map(agent => (
                        <SettingRow
                          key={agent.id}
                          label={agent.displayName}
                          description={agent.role}
                        >
                          <Toggle
                            enabled={agentEnabled[agent.id]}
                            onToggle={() => setAgentEnabled(prev => ({ ...prev, [agent.id]: !prev[agent.id] }))}
                          />
                        </SettingRow>
                      ))}
                    </div>
                  </div>
                )}

                {activeSection === 'notifications' && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-1">Notifications</h2>
                    <p className="text-xs text-slate-500 mb-4">Control how and when you get notified</p>
                    <SettingRow label="Workflow Completed" description="Notify when any workflow finishes successfully">
                      <Toggle enabled={notifWorkflowComplete} onToggle={() => setNotifWorkflowComplete(p => !p)} />
                    </SettingRow>
                    <SettingRow label="Workflow Failed" description="Notify when a workflow errors out">
                      <Toggle enabled={notifWorkflowFailed} onToggle={() => setNotifWorkflowFailed(p => !p)} />
                    </SettingRow>
                    <SettingRow label="Email Alerts" description="Send notifications to your email (configure SMTP to enable)">
                      <Toggle enabled={notifEmail} onToggle={() => setNotifEmail(p => !p)} />
                    </SettingRow>
                    <SettingRow label="Slack Alerts" description="Post to Slack channel (configure webhook to enable)">
                      <Toggle enabled={notifSlack} onToggle={() => setNotifSlack(p => !p)} />
                    </SettingRow>
                  </div>
                )}

                {activeSection === 'auth' && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-1">Auth & Security</h2>
                    <p className="text-xs text-slate-500 mb-4">Authentication is controlled via environment variables</p>
                    <div className="space-y-3">
                      <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 text-sm space-y-2">
                        <p className="text-slate-400">
                          <span className="text-slate-200 font-medium">AUTH_ENABLED</span>
                          {' — '}set to <code className="text-indigo-400">true</code> to require login, <code className="text-indigo-400">false</code> to allow open access
                        </p>
                        <p className="text-slate-400">
                          <span className="text-slate-200 font-medium">AUTH_SECRET_KEY</span>
                          {' — '}JWT signing secret (required in production)
                        </p>
                        <p className="text-slate-400">
                          <span className="text-slate-200 font-medium">CHIEF_ARCHITECT_PASSWORD</span>
                          {' — '}password for the chief-architect account
                        </p>
                        <p className="text-slate-400">
                          <span className="text-slate-200 font-medium">AUTH_ALLOWED_USERS</span>
                          {' — '}comma-separated list of allowed usernames
                        </p>
                      </div>
                      <p className="text-xs text-slate-600">
                        Edit your <code>.env.local</code> file to change these values, then restart the dev server.
                      </p>
                    </div>
                  </div>
                )}

                {activeSection === 'appearance' && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-100 mb-1">Appearance</h2>
                    <p className="text-xs text-slate-500 mb-4">Visual preferences</p>
                    <SettingRow label="Theme" description="Color scheme for the dashboard">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white">Dark</button>
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors" disabled>
                          Light (coming soon)
                        </button>
                      </div>
                    </SettingRow>
                    <SettingRow label="Sidebar" description="Sidebar display mode">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white">Fixed</button>
                        <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors" disabled>
                          Collapsible (coming soon)
                        </button>
                      </div>
                    </SettingRow>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    {saved ? 'Saved!' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
