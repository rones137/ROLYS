import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Trash2, GripVertical, Save, Eye, Download, Upload, Image as ImageIcon,
  BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Type, MessageSquare, ExternalLink, ImagePlus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Layer {
  id: string;
  type: "text" | "bubble";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: Record<string, any>;
}

interface MangaPage {
  id: string;
  imageUrl: string;
  order: number;
  layers: Layer[];
}

interface MangaChapter {
  id: string;
  title: string;
  pages: MangaPage[];
  order: number;
}

interface Manga {
  id?: string;
  title: string;
  description: string;
  cover_url: string;
  chapters: MangaChapter[];
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  is_nsfw: boolean;
}

const CATEGORIES = [
  { value: "shonen", label: "Shonen" },
  { value: "shojo", label: "Shojo" },
  { value: "seinen", label: "Seinen" },
  { value: "josei", label: "Josei" },
  { value: "isekai", label: "Isekai" },
  { value: "action", label: "Action" },
  { value: "romance", label: "Romance" },
  { value: "comedy", label: "Comedy" },
  { value: "horror", label: "Horror" },
  { value: "fantasy", label: "Fantasy" },
  { value: "slice-of-life", label: "Slice of Life" },
  { value: "manhwa", label: "Manhwa" },
  { value: "manhua", label: "Manhua" },
];

const MangaEditor = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const [manga, setManga] = useState<Manga>({
    title: "Untitled Manga",
    description: "",
    cover_url: "",
    chapters: [{ id: crypto.randomUUID(), title: "Chapter 1", pages: [], order: 0 }],
    category: "",
    tags: [],
    status: "draft",
    is_nsfw: false,
  });
  const [activeChapter, setActiveChapter] = useState(0);
  const [activePage, setActivePage] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [mangaList, setMangaList] = useState<any[]>([]);
  const [selectedMangaId, setSelectedMangaId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isAddingBubble, setIsAddingBubble] = useState(false);
  const [isAddingText, setIsAddingText] = useState(false);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (user) {
      loadMangaList();
    }
  }, [user]);

  const loadMangaList = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("manga")
      .select("*")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setMangaList(data);
  };

  const loadManga = async (id: string) => {
    const { data } = await supabase
      .from("manga")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      setManga({
        id: data.id,
        title: data.title,
        description: data.description || "",
        cover_url: data.cover_url || "",
        chapters: (data.chapters as unknown as MangaChapter[]) || [{ id: crypto.randomUUID(), title: "Chapter 1", pages: [], order: 0 }],
        category: data.category || "",
        tags: data.tags || [],
        status: data.status as "draft" | "published" | "archived",
        is_nsfw: data.is_nsfw || false,
      });
      setSelectedMangaId(id);
      setActiveChapter(0);
      setActivePage(null);
    }
  };

  const handleSave = async (silent = false) => {
    if (!user) {
      toast.error("Please sign in to save");
      return;
    }

    setIsSaving(true);
    try {
      const mangaData = {
        author_id: user.id,
        title: manga.title,
        description: manga.description,
        cover_url: manga.cover_url,
        chapters: manga.chapters as any,
        category: manga.category,
        tags: manga.tags,
        status: manga.status,
        is_nsfw: manga.is_nsfw,
        updated_at: new Date().toISOString(),
      };

      if (manga.id) {
        const { error } = await supabase.from("manga").update(mangaData).eq("id", manga.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("manga").insert(mangaData).select().single();
        if (error) throw error;
        if (data) {
          setManga(prev => ({ ...prev, id: data.id }));
          setSelectedMangaId(data.id);
        }
      }

      if (!silent) toast.success("Manga saved!");
      loadMangaList();
    } catch (error: any) {
      console.error("Save error:", error);
      if (!silent) toast.error("Failed to save: " + (error.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCoverUpload = async (files: FileList | null) => {
    if (!files || !files[0] || !user) return;
    
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploadingCover(true);
    try {
      const fileName = `manga-covers/${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("creative-assets")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("creative-assets")
        .getPublicUrl(fileName);

      setManga(prev => ({ ...prev, cover_url: urlData.publicUrl }));
      toast.success("Cover uploaded!");
    } catch (error: any) {
      toast.error("Failed to upload cover: " + (error.message || "Unknown error"));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    
    setIsUploading(true);
    const newPages: MangaPage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;

      try {
        const fileName = `manga-pages/${user.id}/${Date.now()}-${i}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("creative-assets")
          .upload(fileName, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from("creative-assets")
          .getPublicUrl(fileName);

        newPages.push({
          id: crypto.randomUUID(),
          imageUrl: urlData.publicUrl,
          order: manga.chapters[activeChapter].pages.length + i,
          layers: [],
        });
      } catch (error) {
        console.error("Upload error:", error);
      }
    }

    if (newPages.length > 0) {
      setManga(prev => ({
        ...prev,
        chapters: prev.chapters.map((ch, i) =>
          i === activeChapter ? { ...ch, pages: [...ch.pages, ...newPages] } : ch
        ),
      }));
      toast.success(`Uploaded ${newPages.length} page(s)`);
    }

    setIsUploading(false);
  };

  const deletePage = (pageIndex: number) => {
    setManga(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, i) =>
        i === activeChapter ? { ...ch, pages: ch.pages.filter((_, pi) => pi !== pageIndex) } : ch
      ),
    }));
    if (activePage === pageIndex) setActivePage(null);
  };

  const addChapter = () => {
    const newChapter: MangaChapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${manga.chapters.length + 1}`,
      pages: [],
      order: manga.chapters.length,
    };
    setManga(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
    }));
    setActiveChapter(manga.chapters.length);
  };

  const deleteChapter = (index: number) => {
    if (manga.chapters.length <= 1) {
      toast.error("Cannot delete the only chapter");
      return;
    }
    setManga(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== index),
    }));
    if (activeChapter >= index && activeChapter > 0) {
      setActiveChapter(activeChapter - 1);
    }
  };

  const updateChapterTitle = (index: number, title: string) => {
    setManga(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, i) => i === index ? { ...ch, title } : ch),
    }));
  };

  const addSpeechBubble = (pageIndex: number, x: number, y: number) => {
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      type: "bubble",
      content: "Text here...",
      x,
      y,
      width: 150,
      height: 80,
      style: { backgroundColor: "white", borderRadius: "50%", border: "2px solid black" },
    };

    setManga(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, ci) =>
        ci === activeChapter
          ? {
              ...ch,
              pages: ch.pages.map((p, pi) =>
                pi === pageIndex ? { ...p, layers: [...p.layers, newLayer] } : p
              ),
            }
          : ch
      ),
    }));
    setSelectedLayer(newLayer.id);
    setIsAddingBubble(false);
  };

  const addTextLayer = (pageIndex: number, x: number, y: number) => {
    const newLayer: Layer = {
      id: crypto.randomUUID(),
      type: "text",
      content: "Text",
      x,
      y,
      width: 100,
      height: 30,
      style: { color: "white", fontSize: "16px", fontWeight: "bold" },
    };

    setManga(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, ci) =>
        ci === activeChapter
          ? {
              ...ch,
              pages: ch.pages.map((p, pi) =>
                pi === pageIndex ? { ...p, layers: [...p.layers, newLayer] } : p
              ),
            }
          : ch
      ),
    }));
    setSelectedLayer(newLayer.id);
    setIsAddingText(false);
  };

  const updateLayerContent = (pageIndex: number, layerId: string, content: string) => {
    setManga(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, ci) =>
        ci === activeChapter
          ? {
              ...ch,
              pages: ch.pages.map((p, pi) =>
                pi === pageIndex
                  ? { ...p, layers: p.layers.map(l => l.id === layerId ? { ...l, content } : l) }
                  : p
              ),
            }
          : ch
      ),
    }));
  };

  const deleteLayer = (pageIndex: number, layerId: string) => {
    setManga(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, ci) =>
        ci === activeChapter
          ? {
              ...ch,
              pages: ch.pages.map((p, pi) =>
                pi === pageIndex
                  ? { ...p, layers: p.layers.filter(l => l.id !== layerId) }
                  : p
              ),
            }
          : ch
      ),
    }));
    setSelectedLayer(null);
  };

  const handlePublish = async () => {
    if (!manga.description) {
      toast.error("Please add a description before publishing");
      return;
    }
    if (!manga.category) {
      toast.error("Please select a category before publishing");
      return;
    }
    
    setManga(prev => ({ ...prev, status: "published" }));
    await handleSave();
    setShowPublishDialog(false);
    toast.success("Manga published successfully!");
  };

  const addTag = () => {
    if (tagInput.trim() && !manga.tags.includes(tagInput.trim())) {
      setManga(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setManga(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const exportManga = () => {
    const blob = new Blob([JSON.stringify(manga, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${manga.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Manga exported as JSON!");
  };

  const downloadCurrentPage = () => {
    if (currentPage?.imageUrl) {
      const link = document.createElement("a");
      link.href = currentPage.imageUrl;
      link.download = `${manga.title}-page-${(activePage || 0) + 1}.png`;
      link.click();
      toast.info("Image downloaded! Open it in Krita to edit, then re-upload.");
    } else {
      toast.error("Select a page first");
    }
  };

  const createNewManga = () => {
    setManga({
      title: "Untitled Manga",
      description: "",
      cover_url: "",
      chapters: [{ id: crypto.randomUUID(), title: "Chapter 1", pages: [], order: 0 }],
      category: "",
      tags: [],
      status: "draft",
      is_nsfw: false,
    });
    setSelectedMangaId(null);
    setActiveChapter(0);
    setActivePage(null);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in">
        <BookOpen className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Manga Editor</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Sign in to create and publish your manga with our visual editor!
        </p>
      </div>
    );
  }

  const currentChapter = manga.chapters[activeChapter];
  const currentPage = activePage !== null ? currentChapter?.pages[activePage] : null;

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleImageUpload(e.target.files)}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleCoverUpload(e.target.files)}
      />

      {/* Sidebar */}
      {showOutline && (
        <div className="w-64 flex-shrink-0 bg-card rounded-xl border border-border overflow-hidden flex flex-col animate-slide-in-right">
          <div className="p-3 border-b border-border">
            <Button onClick={createNewManga} className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Manga
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* My Manga */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">My Manga</h4>
                <div className="space-y-1">
                  {mangaList.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No manga yet</p>
                  ) : (
                    mangaList.map(m => (
                      <button
                        key={m.id}
                        onClick={() => loadManga(m.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          selectedMangaId === m.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <div className="font-medium truncate">{m.title}</div>
                        <div className="text-xs opacity-70 capitalize">{m.status}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chapters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Chapters</h4>
                  <Button variant="ghost" size="sm" onClick={addChapter} className="h-6 w-6 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {manga.chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors",
                        activeChapter === index ? "bg-primary/20 text-primary" : "hover:bg-muted"
                      )}
                      onClick={() => { setActiveChapter(index); setActivePage(null); }}
                    >
                      <GripVertical className="w-4 h-4 opacity-50" />
                      <span className="flex-1 truncate text-sm">{chapter.title}</span>
                      <span className="text-xs text-muted-foreground">{chapter.pages.length}p</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => { e.stopPropagation(); deleteChapter(index); }}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pages */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pages</h4>
                <div className="grid grid-cols-2 gap-2">
                  {currentChapter?.pages.map((page, index) => (
                    <div
                      key={page.id}
                      className={cn(
                        "relative aspect-[2/3] rounded-lg overflow-hidden border-2 cursor-pointer group transition-all",
                        activePage === index ? "border-primary ring-2 ring-primary/50" : "border-transparent hover:border-muted"
                      )}
                      onClick={() => setActivePage(index)}
                    >
                      <img src={page.imageUrl} alt={`Page ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white h-6 w-6 p-0"
                          onClick={(e) => { e.stopPropagation(); deletePage(index); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <span className="absolute bottom-1 left-1 text-xs bg-black/70 text-white px-1 rounded">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border p-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowOutline(!showOutline)}>
              {showOutline ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
            <Input
              value={manga.title}
              onChange={(e) => setManga(prev => ({ ...prev, title: e.target.value }))}
              className="w-64 font-bold"
              placeholder="Manga Title"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload Pages"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(50, zoom - 25))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleSave()} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Eye className="w-4 h-4 mr-2" /> Publish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Publish Manga</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <div className="flex gap-4 items-start">
                      {manga.cover_url ? (
                        <img src={manga.cover_url} alt="Cover" className="w-24 h-36 object-cover rounded-lg border" />
                      ) : (
                        <div className="w-24 h-36 bg-muted rounded-lg border flex items-center justify-center">
                          <ImagePlus className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isUploadingCover}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isUploadingCover ? "Uploading..." : "Upload Cover"}
                      </Button>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      value={manga.description}
                      onChange={(e) => setManga(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Write a description for your manga..."
                      rows={4}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={manga.category} onValueChange={(v) => setManga(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add tag..."
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addTag}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {manga.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary rounded text-xs cursor-pointer hover:bg-destructive/20 hover:text-destructive"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ×
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* NSFW Toggle */}
                  <div className="flex items-center justify-between">
                    <Label>Mark as NSFW</Label>
                    <Switch
                      checked={manga.is_nsfw}
                      onCheckedChange={(checked) => setManga(prev => ({ ...prev, is_nsfw: checked }))}
                    />
                  </div>

                  {/* Export & Krita */}
                  <div className="space-y-2">
                    <Label>Tools</Label>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={exportManga}>
                        <Download className="w-4 h-4 mr-2" /> Export JSON
                      </Button>
                      <Button variant="outline" size="sm" onClick={downloadCurrentPage}>
                        <Download className="w-4 h-4 mr-2" /> Download Page
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open("https://krita.org/en/download/", "_blank")}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" /> Get Krita
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Download a page, edit in Krita, then re-upload to replace it.
                    </p>
                  </div>

                  {/* Publish Button */}
                  <Button onClick={handlePublish} className="w-full" disabled={isSaving}>
                    {manga.status === "published" ? "Update Publication" : "Publish Now"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tools for current page */}
        {currentPage && (
          <div className="border-b border-border p-2 flex items-center gap-2">
            <Button
              variant={isAddingBubble ? "default" : "outline"}
              size="sm"
              onClick={() => { setIsAddingBubble(!isAddingBubble); setIsAddingText(false); }}
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Speech Bubble
            </Button>
            <Button
              variant={isAddingText ? "default" : "outline"}
              size="sm"
              onClick={() => { setIsAddingText(!isAddingText); setIsAddingBubble(false); }}
            >
              <Type className="w-4 h-4 mr-2" /> Text
            </Button>
            {selectedLayer && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => activePage !== null && deleteLayer(activePage, selectedLayer)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Layer
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {isAddingBubble && "Click on the image to add a speech bubble"}
              {isAddingText && "Click on the image to add text"}
            </span>
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-muted/20">
          {currentPage ? (
            <div
              className="relative mx-auto bg-white shadow-xl"
              style={{ 
                transform: `scale(${zoom / 100})`, 
                transformOrigin: "top center",
                width: "fit-content"
              }}
              onClick={(e) => {
                if (activePage === null) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (e.clientX - rect.left) / (zoom / 100);
                const y = (e.clientY - rect.top) / (zoom / 100);
                
                if (isAddingBubble) {
                  addSpeechBubble(activePage, x - 75, y - 40);
                }
                if (isAddingText) {
                  addTextLayer(activePage, x - 50, y - 15);
                }
              }}
            >
              <img
                src={currentPage.imageUrl}
                alt={`Page ${activePage! + 1}`}
                className="max-h-[80vh] w-auto"
                style={{ cursor: (isAddingBubble || isAddingText) ? "crosshair" : "default" }}
              />
              {/* Render layers */}
              {currentPage.layers.map(layer => (
                <div
                  key={layer.id}
                  className={cn(
                    "absolute cursor-move transition-all",
                    selectedLayer === layer.id && "ring-2 ring-primary"
                  )}
                  style={{
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    ...layer.style,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLayer(layer.id);
                  }}
                >
                  {layer.type === "bubble" && (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center text-sm text-black">
                      <input
                        type="text"
                        value={layer.content}
                        onChange={(e) => activePage !== null && updateLayerContent(activePage, layer.id, e.target.value)}
                        className="w-full h-full bg-transparent text-center text-sm border-none outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  {layer.type === "text" && (
                    <input
                      type="text"
                      value={layer.content}
                      onChange={(e) => activePage !== null && updateLayerContent(activePage, layer.id, e.target.value)}
                      className="w-full h-full bg-transparent text-center border-none outline-none"
                      style={layer.style}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
              <ImageIcon className="w-24 h-24 text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No Page Selected</h3>
              <p className="text-muted-foreground mb-4">
                Upload pages or select one from the sidebar to start editing
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload Pages
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Chapter {activeChapter + 1}</span>
            <Input
              value={currentChapter?.title || ""}
              onChange={(e) => updateChapterTitle(activeChapter, e.target.value)}
              className="w-32 h-6 text-xs"
            />
            <span>• {currentChapter?.pages.length || 0} pages</span>
          </div>
          <div className="flex items-center gap-4">
            {activePage !== null && <span>Page {activePage + 1}</span>}
            <span className="capitalize">{manga.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MangaEditor;
