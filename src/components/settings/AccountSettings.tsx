import React, { useState, useEffect } from 'react';
import { Camera, Edit2, Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { TwoFactorDialog } from '@/components/auth/TwoFactorDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AccountData {
  username: string;
  email: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  avatarUrl: string;
  bannerUrl: string;
}

const AccountSettings = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<AccountData>({
    username: '',
    email: '',
    displayName: '',
    bio: '',
    location: '',
    website: '',
    avatarUrl: '',
    bannerUrl: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AccountData, string>>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
    const user2FA = localStorage.getItem('user2FA');
    setIs2FAEnabled(!!user2FA);
  }, [user, show2FAModal]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setFormData({
        username: data.username || '',
        email: user.email || '',
        displayName: data.display_name || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        avatarUrl: data.avatar_url || '',
        bannerUrl: data.banner_url || '',
      });
    } else {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof AccountData]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // For now, convert to data URL (in production, upload to storage)
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (type === 'avatar') {
        setFormData(prev => ({ ...prev, avatarUrl: dataUrl }));
      } else {
        setFormData(prev => ({ ...prev, bannerUrl: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) return;

    const newErrors: Partial<Record<keyof AccountData, string>> = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          username: formData.username.trim(),
          display_name: formData.displayName.trim(),
          bio: formData.bio.trim() || null,
          location: formData.location.trim() || null,
          website: formData.website.trim() || null,
          avatar_url: formData.avatarUrl || null,
          banner_url: formData.bannerUrl || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Username is already taken');
      } else {
        toast.error('Failed to save profile');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-secondary/20">
          {formData.bannerUrl && (
            <img src={formData.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
          )}
          {isEditing && (
            <label className="absolute bottom-2 right-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e, 'banner')}
              />
              <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm hover:bg-background/90 transition-colors">
                <Upload className="w-4 h-4" />
                Change Banner
              </div>
            </label>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4 -mt-12">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden bg-muted">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary font-bold text-xl">
                      {formData.displayName?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, 'avatar')}
                    />
                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors">
                      <Camera size={14} className="text-primary-foreground" />
                    </div>
                  </label>
                )}
              </div>
              <div className="pt-8">
                <h4 className="font-medium text-foreground">{formData.displayName || 'No name set'}</h4>
                <p className="text-sm text-muted-foreground">@{formData.username || 'username'}</p>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="mt-2">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
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
                  placeholder="your_username"
                  className="h-9"
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
                  placeholder="Your Name"
                  className="h-9"
                />
                {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="h-9 bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed here</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                placeholder="Tell others about yourself..."
                rows={3}
                className="resize-none"
              />
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
                  className="h-9"
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
                  className="h-9"
                />
              </div>
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setIsEditing(false); loadProfile(); }}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">Change your password</p>
            </div>
            <Button variant="outline" size="sm">Change</Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium text-sm text-foreground">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">
                {is2FAEnabled ? 'Currently enabled' : 'Add extra security'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShow2FAModal(true)}>
              {is2FAEnabled ? 'Manage' : 'Enable'}
            </Button>
          </div>
        </div>
      </div>
      
      <TwoFactorDialog open={show2FAModal} onOpenChange={setShow2FAModal} />
    </div>
  );
};

export default AccountSettings;