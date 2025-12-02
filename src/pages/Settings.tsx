import React, { useState } from 'react';
import { User, Bell, Eye, Shield, Database } from 'lucide-react';
import AccountSettings from '@/components/settings/AccountSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import DisplaySettings from '@/components/settings/DisplaySettings';
import PrivacySettings from '@/components/settings/PrivacySettings';
import DataManagement from '@/components/settings/DataManagement';
import { Toaster } from '@/components/ui/toaster';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');

  const tabs = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'display', label: 'Display', icon: Eye },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'data', label: 'Data', icon: Database },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'display':
        return <DisplaySettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'data':
        return <DataManagement />;
      default:
        return <AccountSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Anime Runch Settings
          </h1>
          <p className="text-muted-foreground">Manage your account preferences and settings</p>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-elevated">
          {/* Tabs */}
          <div className="border-b border-border bg-card/50">
            <div className="flex overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap
                      transition-all duration-300 border-b-2 hover:bg-muted/50
                      ${
                        activeTab === tab.id
                          ? 'text-primary border-primary bg-muted/30'
                          : 'text-muted-foreground border-transparent hover:text-foreground'
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
};

export default Settings;
