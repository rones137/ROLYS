import React, { useState, useEffect } from 'react';
import { Camera, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { TwoFactorDialog } from '@/components/auth/TwoFactorDialog';

interface AccountData {
  username: string;
  email: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string;
}

const AccountSettings = () => {
  const [formData, setFormData] = useState<AccountData>({
    username: '',
    email: '',
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AccountData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('accountSettings');
    if (saved) {
      setFormData(JSON.parse(saved));
    }
    
    const user2FA = localStorage.getItem('user2FA');
    setIs2FAEnabled(!!user2FA);
  }, [show2FAModal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof AccountData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSave = () => {
    const newErrors: Partial<Record<keyof AccountData, string>> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    localStorage.setItem('accountSettings', JSON.stringify(formData));
    setIsEditing(false);
    toast({
      title: 'Profile updated',
      description: 'Your account information has been saved successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Profile Information</h3>
            <p className="text-sm text-muted-foreground mt-1">Update your account details and public profile</p>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6 mb-6 pb-6 border-b border-border">
          <div className="relative">
            <img
              src={formData.avatarUrl}
              alt="Profile avatar"
              className="w-24 h-24 rounded-full object-cover border-4 border-border"
            />
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors">
              <Camera size={16} className="text-primary-foreground" />
            </button>
          </div>
          <div>
            <h4 className="font-medium text-foreground">{formData.displayName || 'No name set'}</h4>
            <p className="text-sm text-muted-foreground">@{formData.username || 'username'}</p>
            <Button variant="ghost" size="sm" className="mt-2 text-primary hover:text-primary/80">
              Change Avatar
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter username"
              />
              {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Enter display name"
              />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Enter email address"
            />
            <p className="text-xs text-muted-foreground">Your email will not be publicly visible</p>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Tell others about yourself"
            />
            <p className="text-xs text-muted-foreground">Tell others about yourself and your anime preferences</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Your location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
            <Button variant="default" onClick={handleSave}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Password</p>
              <p className="text-sm text-muted-foreground">Manage your password</p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium text-foreground">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {is2FAEnabled ? 'Currently enabled' : 'Add an extra layer of security'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShow2FAModal(true)}>
              {is2FAEnabled ? 'Manage 2FA' : 'Enable 2FA'}
            </Button>
          </div>
        </div>
      </div>
      
      <TwoFactorDialog open={show2FAModal} onOpenChange={setShow2FAModal} />
    </div>
  );
};

export default AccountSettings;
