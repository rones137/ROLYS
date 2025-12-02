import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newAnimeReleases: boolean;
  episodeUpdates: boolean;
  communityReplies: boolean;
  pollResults: boolean;
  systemUpdates: boolean;
  weeklyDigest: boolean;
  friendActivity: boolean;
  recommendations: boolean;
  emailFrequency: string;
}

const NotificationSettings = () => {
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    newAnimeReleases: true,
    episodeUpdates: true,
    communityReplies: true,
    pollResults: true,
    systemUpdates: false,
    weeklyDigest: true,
    friendActivity: true,
    recommendations: true,
    emailFrequency: 'instant',
  });

  useEffect(() => {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const handleCheckboxChange = (key: keyof NotificationPreferences) => (checked: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notifications));
    toast({
      title: 'Notifications updated',
      description: 'Your notification preferences have been saved.',
    });
  };

  const handleDisableAll = () => {
    const allDisabled: NotificationPreferences = {
      ...notifications,
      emailNotifications: false,
      pushNotifications: false,
      newAnimeReleases: false,
      episodeUpdates: false,
      communityReplies: false,
      pollResults: false,
      systemUpdates: false,
      weeklyDigest: false,
      friendActivity: false,
      recommendations: false,
    };
    setNotifications(allDisabled);
    localStorage.setItem('notificationSettings', JSON.stringify(allDisabled));
    toast({
      title: 'All notifications disabled',
      description: 'You will not receive any notifications.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="emailNotifications"
              checked={notifications.emailNotifications}
              onCheckedChange={handleCheckboxChange('emailNotifications')}
            />
            <div className="flex-1">
              <Label htmlFor="emailNotifications" className="text-sm font-medium cursor-pointer">
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="pushNotifications"
              checked={notifications.pushNotifications}
              onCheckedChange={handleCheckboxChange('pushNotifications')}
            />
            <div className="flex-1">
              <Label htmlFor="pushNotifications" className="text-sm font-medium cursor-pointer">
                Push Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Get browser push notifications for important updates</p>
            </div>
          </div>
        </div>

        {notifications.emailNotifications && (
          <div className="mt-4 pt-4 border-t border-border">
            <Label htmlFor="emailFrequency" className="text-sm font-medium mb-2 block">
              Email Frequency
            </Label>
            <Select
              value={notifications.emailFrequency}
              onValueChange={(value) => setNotifications((prev) => ({ ...prev, emailFrequency: value }))}
            >
              <SelectTrigger id="emailFrequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant - Receive emails immediately</SelectItem>
                <SelectItem value="daily">Daily Digest - Once per day summary</SelectItem>
                <SelectItem value="weekly">Weekly Summary - Once per week roundup</SelectItem>
                <SelectItem value="never">Never - No email notifications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Anime Updates</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="newAnimeReleases"
              checked={notifications.newAnimeReleases}
              onCheckedChange={handleCheckboxChange('newAnimeReleases')}
            />
            <div className="flex-1">
              <Label htmlFor="newAnimeReleases" className="text-sm font-medium cursor-pointer">
                New Anime Releases
              </Label>
              <p className="text-sm text-muted-foreground">Get notified when new anime series are announced</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="episodeUpdates"
              checked={notifications.episodeUpdates}
              onCheckedChange={handleCheckboxChange('episodeUpdates')}
            />
            <div className="flex-1">
              <Label htmlFor="episodeUpdates" className="text-sm font-medium cursor-pointer">
                Episode Updates
              </Label>
              <p className="text-sm text-muted-foreground">Alerts when new episodes of your tracked anime are released</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="recommendations"
              checked={notifications.recommendations}
              onCheckedChange={handleCheckboxChange('recommendations')}
            />
            <div className="flex-1">
              <Label htmlFor="recommendations" className="text-sm font-medium cursor-pointer">
                Personalized Recommendations
              </Label>
              <p className="text-sm text-muted-foreground">Receive anime suggestions based on your preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Community & Social</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="communityReplies"
              checked={notifications.communityReplies}
              onCheckedChange={handleCheckboxChange('communityReplies')}
            />
            <div className="flex-1">
              <Label htmlFor="communityReplies" className="text-sm font-medium cursor-pointer">
                Community Replies
              </Label>
              <p className="text-sm text-muted-foreground">When someone replies to your comments or posts</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="pollResults"
              checked={notifications.pollResults}
              onCheckedChange={handleCheckboxChange('pollResults')}
            />
            <div className="flex-1">
              <Label htmlFor="pollResults" className="text-sm font-medium cursor-pointer">
                Poll Results
              </Label>
              <p className="text-sm text-muted-foreground">Get notified when polls you voted in are completed</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="friendActivity"
              checked={notifications.friendActivity}
              onCheckedChange={handleCheckboxChange('friendActivity')}
            />
            <div className="flex-1">
              <Label htmlFor="friendActivity" className="text-sm font-medium cursor-pointer">
                Friend Activity
              </Label>
              <p className="text-sm text-muted-foreground">Updates about your friends' anime activities</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Platform Updates</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="systemUpdates"
              checked={notifications.systemUpdates}
              onCheckedChange={handleCheckboxChange('systemUpdates')}
            />
            <div className="flex-1">
              <Label htmlFor="systemUpdates" className="text-sm font-medium cursor-pointer">
                System Updates
              </Label>
              <p className="text-sm text-muted-foreground">Important platform announcements and maintenance notices</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="weeklyDigest"
              checked={notifications.weeklyDigest}
              onCheckedChange={handleCheckboxChange('weeklyDigest')}
            />
            <div className="flex-1">
              <Label htmlFor="weeklyDigest" className="text-sm font-medium cursor-pointer">
                Weekly Digest
              </Label>
              <p className="text-sm text-muted-foreground">Summary of trending anime and community highlights</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="default" onClick={handleSave}>
          Save Notification Settings
        </Button>
        <Button variant="outline" onClick={handleDisableAll}>
          Disable All
        </Button>
      </div>
    </div>
  );
};

export default NotificationSettings;
