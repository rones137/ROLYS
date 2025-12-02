import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface PrivacyPreferences {
  profileVisibility: string;
  showWatchlist: boolean;
  showActivity: boolean;
  showFavorites: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
  dataCollection: boolean;
  personalizedAds: boolean;
  analyticsTracking: boolean;
}

const PrivacySettings = () => {
  const [privacySettings, setPrivacySettings] = useState<PrivacyPreferences>({
    profileVisibility: 'public',
    showWatchlist: true,
    showActivity: true,
    showFavorites: true,
    allowMessages: true,
    showOnlineStatus: true,
    dataCollection: true,
    personalizedAds: false,
    analyticsTracking: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('privacySettings');
    if (saved) {
      setPrivacySettings(JSON.parse(saved));
    }
  }, []);

  const handleCheckboxChange = (key: keyof PrivacyPreferences) => (checked: boolean) => {
    setPrivacySettings((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = () => {
    localStorage.setItem('privacySettings', JSON.stringify(privacySettings));
    toast({
      title: 'Privacy settings saved',
      description: 'Your privacy preferences have been updated.',
    });
  };

  const handleReset = () => {
    const defaults: PrivacyPreferences = {
      profileVisibility: 'public',
      showWatchlist: true,
      showActivity: true,
      showFavorites: true,
      allowMessages: true,
      showOnlineStatus: true,
      dataCollection: true,
      personalizedAds: false,
      analyticsTracking: true,
    };
    setPrivacySettings(defaults);
    localStorage.setItem('privacySettings', JSON.stringify(defaults));
    toast({
      title: 'Settings reset',
      description: 'Privacy settings have been reset to defaults.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Profile Privacy</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profileVisibility">Profile Visibility</Label>
            <Select
              value={privacySettings.profileVisibility}
              onValueChange={(value) => setPrivacySettings((prev) => ({ ...prev, profileVisibility: value }))}
            >
              <SelectTrigger id="profileVisibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Anyone can view your profile</SelectItem>
                <SelectItem value="friends">Friends Only - Only your friends can view</SelectItem>
                <SelectItem value="private">Private - Only you can view your profile</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Control who can see your profile information</p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="showWatchlist"
                checked={privacySettings.showWatchlist}
                onCheckedChange={handleCheckboxChange('showWatchlist')}
              />
              <div className="flex-1">
                <Label htmlFor="showWatchlist" className="text-sm font-medium cursor-pointer">
                  Show My Anime List
                </Label>
                <p className="text-sm text-muted-foreground">Allow others to view your anime watchlist and ratings</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="showActivity"
                checked={privacySettings.showActivity}
                onCheckedChange={handleCheckboxChange('showActivity')}
              />
              <div className="flex-1">
                <Label htmlFor="showActivity" className="text-sm font-medium cursor-pointer">
                  Show Activity Feed
                </Label>
                <p className="text-sm text-muted-foreground">Display your recent anime activities on your profile</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="showFavorites"
                checked={privacySettings.showFavorites}
                onCheckedChange={handleCheckboxChange('showFavorites')}
              />
              <div className="flex-1">
                <Label htmlFor="showFavorites" className="text-sm font-medium cursor-pointer">
                  Show Favorites
                </Label>
                <p className="text-sm text-muted-foreground">Make your favorite anime and characters visible</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Communication</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="allowMessages"
              checked={privacySettings.allowMessages}
              onCheckedChange={handleCheckboxChange('allowMessages')}
            />
            <div className="flex-1">
              <Label htmlFor="allowMessages" className="text-sm font-medium cursor-pointer">
                Allow Direct Messages
              </Label>
              <p className="text-sm text-muted-foreground">Let other users send you private messages</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="showOnlineStatus"
              checked={privacySettings.showOnlineStatus}
              onCheckedChange={handleCheckboxChange('showOnlineStatus')}
            />
            <div className="flex-1">
              <Label htmlFor="showOnlineStatus" className="text-sm font-medium cursor-pointer">
                Show Online Status
              </Label>
              <p className="text-sm text-muted-foreground">Display when you're active on the platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data & Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="dataCollection"
              checked={privacySettings.dataCollection}
              onCheckedChange={handleCheckboxChange('dataCollection')}
            />
            <div className="flex-1">
              <Label htmlFor="dataCollection" className="text-sm font-medium cursor-pointer">
                Data Collection
              </Label>
              <p className="text-sm text-muted-foreground">Allow us to collect usage data to improve your experience</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="personalizedAds"
              checked={privacySettings.personalizedAds}
              onCheckedChange={handleCheckboxChange('personalizedAds')}
            />
            <div className="flex-1">
              <Label htmlFor="personalizedAds" className="text-sm font-medium cursor-pointer">
                Personalized Advertisements
              </Label>
              <p className="text-sm text-muted-foreground">Show ads based on your anime preferences and activity</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="analyticsTracking"
              checked={privacySettings.analyticsTracking}
              onCheckedChange={handleCheckboxChange('analyticsTracking')}
            />
            <div className="flex-1">
              <Label htmlFor="analyticsTracking" className="text-sm font-medium cursor-pointer">
                Analytics Tracking
              </Label>
              <p className="text-sm text-muted-foreground">Help us understand how you use the platform</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="default" onClick={handleSave}>
          Save Privacy Settings
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>
    </div>
  );
};

export default PrivacySettings;
