import React, { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface DisplayPreferences {
  theme: string;
  language: string;
  contentFilter: string;
  autoplay: boolean;
  highQualityImages: boolean;
  compactView: boolean;
  showSpoilers: boolean;
  animatedBackgrounds: boolean;
}

const DisplaySettings = () => {
  const [displaySettings, setDisplaySettings] = useState<DisplayPreferences>({
    theme: 'dark',
    language: 'en',
    contentFilter: 'all',
    autoplay: true,
    highQualityImages: true,
    compactView: false,
    showSpoilers: false,
    animatedBackgrounds: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem('displaySettings');
    if (saved) {
      setDisplaySettings(JSON.parse(saved));
    }
  }, []);

  const handleCheckboxChange = (key: keyof DisplayPreferences) => (checked: boolean) => {
    setDisplaySettings((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSave = () => {
    localStorage.setItem('displaySettings', JSON.stringify(displaySettings));
    toast({
      title: 'Display settings saved',
      description: 'Your display preferences have been updated.',
    });
  };

  const handleReset = () => {
    const defaults: DisplayPreferences = {
      theme: 'dark',
      language: 'en',
      contentFilter: 'all',
      autoplay: true,
      highQualityImages: true,
      compactView: false,
      showSpoilers: false,
      animatedBackgrounds: true,
    };
    setDisplaySettings(defaults);
    localStorage.setItem('displaySettings', JSON.stringify(defaults));
    toast({
      title: 'Settings reset',
      description: 'Display settings have been reset to defaults.',
    });
  };

  const themeOptions = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'auto', label: 'Auto', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Theme</Label>
            <p className="text-sm text-muted-foreground mb-4">Choose your preferred color scheme</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setDisplaySettings((prev) => ({ ...prev, theme: option.value }))}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    displaySettings.theme === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-full h-20 rounded mb-2 flex items-center justify-center ${
                      option.value === 'dark'
                        ? 'bg-gray-950'
                        : option.value === 'light'
                        ? 'bg-gray-50'
                        : 'bg-gradient-to-r from-gray-950 to-gray-50'
                    }`}
                  >
                    <Icon size={24} className={displaySettings.theme === option.value ? 'text-primary' : 'text-muted-foreground'} />
                  </div>
                  <p className="text-xs text-center font-medium text-foreground">{option.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Language & Region</h3>
        <div className="space-y-2">
          <Label htmlFor="language">Display Language</Label>
          <Select
            value={displaySettings.language}
            onValueChange={(value) => setDisplaySettings((prev) => ({ ...prev, language: value }))}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語 (Japanese)</SelectItem>
              <SelectItem value="es">Español (Spanish)</SelectItem>
              <SelectItem value="fr">Français (French)</SelectItem>
              <SelectItem value="de">Deutsch (German)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Choose your preferred language for the interface</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Content Preferences</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contentFilter">Content Filter</Label>
            <Select
              value={displaySettings.contentFilter}
              onValueChange={(value) => setDisplaySettings((prev) => ({ ...prev, contentFilter: value }))}
            >
              <SelectTrigger id="contentFilter">
                <SelectValue placeholder="Select filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Content - Show everything</SelectItem>
                <SelectItem value="pg13">PG-13 and Below - Family-friendly content</SelectItem>
                <SelectItem value="mature">Mature Only - Adult content only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Control what type of content you see</p>
          </div>

          <div className="flex items-start space-x-3 pt-4 border-t border-border">
            <Checkbox
              id="showSpoilers"
              checked={displaySettings.showSpoilers}
              onCheckedChange={handleCheckboxChange('showSpoilers')}
            />
            <div className="flex-1">
              <Label htmlFor="showSpoilers" className="text-sm font-medium cursor-pointer">
                Show Spoilers
              </Label>
              <p className="text-sm text-muted-foreground">Display spoiler content without warnings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Media Settings</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="autoplay"
              checked={displaySettings.autoplay}
              onCheckedChange={handleCheckboxChange('autoplay')}
            />
            <div className="flex-1">
              <Label htmlFor="autoplay" className="text-sm font-medium cursor-pointer">
                Autoplay Videos
              </Label>
              <p className="text-sm text-muted-foreground">Automatically play video previews and trailers</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="highQualityImages"
              checked={displaySettings.highQualityImages}
              onCheckedChange={handleCheckboxChange('highQualityImages')}
            />
            <div className="flex-1">
              <Label htmlFor="highQualityImages" className="text-sm font-medium cursor-pointer">
                High Quality Images
              </Label>
              <p className="text-sm text-muted-foreground">Load higher resolution images (uses more data)</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="animatedBackgrounds"
              checked={displaySettings.animatedBackgrounds}
              onCheckedChange={handleCheckboxChange('animatedBackgrounds')}
            />
            <div className="flex-1">
              <Label htmlFor="animatedBackgrounds" className="text-sm font-medium cursor-pointer">
                Animated Backgrounds
              </Label>
              <p className="text-sm text-muted-foreground">Enable animated visual effects on pages</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Layout</h3>
        <div className="flex items-start space-x-3">
          <Checkbox
            id="compactView"
            checked={displaySettings.compactView}
            onCheckedChange={handleCheckboxChange('compactView')}
          />
          <div className="flex-1">
            <Label htmlFor="compactView" className="text-sm font-medium cursor-pointer">
              Compact View
            </Label>
            <p className="text-sm text-muted-foreground">Show more content with reduced spacing</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="default" onClick={handleSave}>
          Save Display Settings
        </Button>
        <Button variant="outline" onClick={handleReset}>
          Reset to Default
        </Button>
      </div>
    </div>
  );
};

export default DisplaySettings;
