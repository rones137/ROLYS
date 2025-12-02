import React, { useState } from 'react';
import { Download, History, Star, MessageSquare, Heart, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const DataManagement = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const dataCategories = [
    {
      id: 1,
      title: 'Watch History',
      description: 'Your complete anime viewing history and progress',
      size: '2.4 MB',
      icon: History,
    },
    {
      id: 2,
      title: 'Ratings & Reviews',
      description: 'All your anime ratings and written reviews',
      size: '856 KB',
      icon: Star,
    },
    {
      id: 3,
      title: 'Community Posts',
      description: 'Your forum posts, comments, and discussions',
      size: '1.8 MB',
      icon: MessageSquare,
    },
    {
      id: 4,
      title: 'Favorites & Lists',
      description: 'Your saved anime, characters, and custom lists',
      size: '512 KB',
      icon: Heart,
    },
  ];

  const handleExportData = (category: typeof dataCategories[0]) => {
    const data = localStorage.getItem(category.title.toLowerCase().replace(/\s+/g, '_'));
    const blob = new Blob([data || '{}'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.title.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export successful',
      description: `${category.title} has been exported.`,
    });
  };

  const handleExportAll = () => {
    const allData = {
      accountSettings: localStorage.getItem('accountSettings'),
      notificationSettings: localStorage.getItem('notificationSettings'),
      displaySettings: localStorage.getItem('displaySettings'),
      privacySettings: localStorage.getItem('privacySettings'),
      animeList: localStorage.getItem('myAnimeList'),
    };
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_data_export.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'All data exported',
      description: 'All your data has been exported successfully.',
    });
  };

  const handleBackupNow = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        accountSettings: localStorage.getItem('accountSettings'),
        notificationSettings: localStorage.getItem('notificationSettings'),
        displaySettings: localStorage.getItem('displaySettings'),
        privacySettings: localStorage.getItem('privacySettings'),
        animeList: localStorage.getItem('myAnimeList'),
      },
    };
    
    localStorage.setItem('lastBackup', JSON.stringify(backup));
    toast({
      title: 'Backup created',
      description: 'Your data has been backed up successfully.',
    });
  };

  const handleRestore = () => {
    const backup = localStorage.getItem('lastBackup');
    if (backup) {
      const { data } = JSON.parse(backup);
      Object.entries(data).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value as string);
      });
      toast({
        title: 'Restore successful',
        description: 'Your data has been restored from backup.',
      });
    } else {
      toast({
        title: 'No backup found',
        description: 'There is no backup available to restore.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmation === 'DELETE MY ACCOUNT') {
      localStorage.clear();
      setShowDeleteModal(false);
      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been deleted.',
        variant: 'destructive',
      });
    }
  };

  const getStorageUsage = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024).toFixed(2);
  };

  const getLastBackupDate = () => {
    const backup = localStorage.getItem('lastBackup');
    if (backup) {
      const { timestamp } = JSON.parse(backup);
      return new Date(timestamp).toLocaleString();
    }
    return 'Never';
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Export Your Data</h3>
            <p className="text-sm text-muted-foreground mt-1">Download a copy of your data</p>
          </div>
          <Button variant="default" onClick={handleExportAll}>
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {dataCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="p-4 bg-muted rounded-lg border border-border hover:border-muted-foreground transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{category.size}</span>
                </div>
                <h4 className="font-medium text-foreground mb-1">{category.title}</h4>
                <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => handleExportData(category)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Backup</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Automatic Backups</p>
              <p className="text-sm text-muted-foreground">Last backup: {getLastBackupDate()}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleBackupNow}>
              Backup Now
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Restore from Backup</p>
              <p className="text-sm text-muted-foreground">Recover your data from a previous backup</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleRestore}>
              Restore
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Storage Usage</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Used Storage</span>
              <span className="text-sm font-medium text-foreground">{getStorageUsage()} KB</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full" style={{ width: '15%' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Delete Account</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone. This will permanently delete your account and remove all your data.
            </p>

            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-4">
              <p className="text-sm text-destructive font-medium mb-2">You will lose:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• All your anime watch history and ratings</li>
                <li>• Your community posts and comments</li>
                <li>• Your favorites and custom lists</li>
                <li>• Your profile and account settings</li>
              </ul>
            </div>

            <div className="mb-4 space-y-2">
              <Label htmlFor="deleteConfirmation">
                Type <span className="text-destructive font-bold">DELETE MY ACCOUNT</span> to confirm
              </Label>
              <Input
                id="deleteConfirmation"
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                disabled={deleteConfirmation !== 'DELETE MY ACCOUNT'}
                onClick={handleDeleteAccount}
              >
                Delete My Account
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataManagement;
