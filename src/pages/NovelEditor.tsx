import { useState, useEffect, useCallback, useRef } from "react";
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
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Image, Link, Undo, Redo, Save, Eye, Download, Upload,
  Plus, Trash2, GripVertical, FileText, BookOpen, ChevronLeft, ChevronRight,
  Heading1, Heading2, Heading3, Subscript, Superscript,
  Maximize2, ZoomIn, ZoomOut, ImagePlus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

interface Novel {
  id?: string;
  title: string;
  description: string;
  cover_url: string;
  chapters: Chapter[];
  category: string;
  tags: string[];
  status: "draft" | "published" | "archived";
  is_nsfw: boolean;
}

const CATEGORIES = [
  { value: "fantasy", label: "Fantasy" },
  { value: "romance", label: "Romance" },
  { value: "action", label: "Action" },
  { value: "scifi", label: "Sci-Fi" },
  { value: "mystery", label: "Mystery" },
  { value: "horror", label: "Horror" },
  { value: "comedy", label: "Comedy" },
  { value: "slice-of-life", label: "Slice of Life" },
  { value: "isekai", label: "Isekai" },
  { value: "adventure", label: "Adventure" },
  { value: "drama", label: "Drama" },
  { value: "psychological", label: "Psychological" },
];

const NovelEditor = () => {
  const { user } = useAuth();
  const editorRef = useRef<HTMLDivElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [novel, setNovel] = useState<Novel>({
    title: "Untitled Novel",
    description: "",
    cover_url: "",
    chapters: [{ id: crypto.randomUUID(), title: "Chapter 1", content: "", order: 0 }],
    category: "",
    tags: [],
    status: "draft",
    is_nsfw: false,
  });
  const [activeChapter, setActiveChapter] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOutline, setShowOutline] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [fontSize, setFontSize] = useState(16);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [novels, setNovels] = useState<any[]>([]);
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Load user's novels
  useEffect(() => {
    if (user) {
      loadNovels();
    }
  }, [user]);

  const loadNovels = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("novels")
      .select("*")
      .eq("author_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setNovels(data);
  };

  const loadNovel = async (id: string) => {
    const { data, error } = await supabase
      .from("novels")
      .select("*")
      .eq("id", id)
      .single();

    if (data) {
      const chapters = (data.chapters as unknown as Chapter[]) || [
        { id: crypto.randomUUID(), title: "Chapter 1", content: "", order: 0 }
      ];
      
      setNovel({
        id: data.id,
        title: data.title,
        description: data.description || "",
        cover_url: data.cover_url || "",
        chapters,
        category: data.category || "",
        tags: data.tags || [],
        status: data.status as "draft" | "published" | "archived",
        is_nsfw: data.is_nsfw || false,
      });
      setSelectedNovelId(id);
      setActiveChapter(0);
      
      // Set editor content after state update
      setTimeout(() => {
        if (editorRef.current && chapters[0]) {
          editorRef.current.innerHTML = chapters[0].content || "";
        }
      }, 50);
    }
  };

  // Calculate word and character count
  useEffect(() => {
    const content = novel.chapters[activeChapter]?.content || "";
    const text = content.replace(/<[^>]*>/g, "");
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
  }, [novel.chapters, activeChapter]);

  // Sync editor content when switching chapters
  useEffect(() => {
    if (editorRef.current && novel.chapters[activeChapter]) {
      editorRef.current.innerHTML = novel.chapters[activeChapter].content || "";
    }
  }, [activeChapter]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && novel.title && novel.id) {
        handleSave(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [novel, user]);

  const handleSave = async (silent = false) => {
    if (!user) {
      toast.error("Please sign in to save");
      return;
    }

    setIsSaving(true);
    try {
      const novelData = {
        author_id: user.id,
        title: novel.title,
        description: novel.description,
        cover_url: novel.cover_url,
        chapters: novel.chapters as any,
        category: novel.category,
        tags: novel.tags,
        status: novel.status,
        is_nsfw: novel.is_nsfw,
        updated_at: new Date().toISOString(),
      };

      if (novel.id) {
        const { error } = await supabase.from("novels").update(novelData).eq("id", novel.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("novels").insert(novelData).select().single();
        if (error) throw error;
        if (data) {
          setNovel(prev => ({ ...prev, id: data.id }));
          setSelectedNovelId(data.id);
        }
      }

      if (!silent) toast.success("Novel saved!");
      loadNovels();
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
      const fileName = `covers/${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("creative-assets")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("creative-assets")
        .getPublicUrl(fileName);

      setNovel(prev => ({ ...prev, cover_url: urlData.publicUrl }));
      toast.success("Cover uploaded!");
    } catch (error: any) {
      toast.error("Failed to upload cover: " + (error.message || "Unknown error"));
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleImageInsert = async (files: FileList | null) => {
    if (!files || !files[0] || !user) return;
    
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      const fileName = `novel-images/${user.id}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("creative-assets")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("creative-assets")
        .getPublicUrl(fileName);

      execCommand("insertImage", urlData.publicUrl);
      toast.success("Image inserted!");
    } catch (error: any) {
      toast.error("Failed to upload image");
    }
  };

  const addChapter = () => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapter ${novel.chapters.length + 1}`,
      content: "",
      order: novel.chapters.length,
    };
    setNovel(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
    }));
    setActiveChapter(novel.chapters.length);
  };

  const deleteChapter = (index: number) => {
    if (novel.chapters.length <= 1) {
      toast.error("Cannot delete the only chapter");
      return;
    }
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== index),
    }));
    if (activeChapter >= index && activeChapter > 0) {
      setActiveChapter(activeChapter - 1);
    }
  };

  const updateChapterContent = (content: string) => {
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, i) =>
        i === activeChapter ? { ...ch, content } : ch
      ),
    }));
  };

  const updateChapterTitle = (title: string) => {
    setNovel(prev => ({
      ...prev,
      chapters: prev.chapters.map((ch, i) =>
        i === activeChapter ? { ...ch, title } : ch
      ),
    }));
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handlePublish = async () => {
    if (!novel.description) {
      toast.error("Please add a description before publishing");
      return;
    }
    if (!novel.category) {
      toast.error("Please select a category before publishing");
      return;
    }
    
    setNovel(prev => ({ ...prev, status: "published" }));
    await handleSave();
    setShowPublishDialog(false);
    toast.success("Novel published successfully!");
  };

  const addTag = () => {
    if (tagInput.trim() && !novel.tags.includes(tagInput.trim())) {
      setNovel(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setNovel(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const exportNovel = (format: string) => {
    const content = novel.chapters.map(ch => `# ${ch.title}\n\n${ch.content.replace(/<[^>]*>/g, "")}`).join("\n\n---\n\n");
    
    if (format === "txt") {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${novel.title}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === "html") {
      const htmlContent = novel.chapters.map(ch => 
        `<h1>${ch.title}</h1>\n${ch.content}`
      ).join("\n<hr />\n");
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${novel.title}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.8; }
    h1 { border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>${novel.title}</h1>
  <p><em>${novel.description}</em></p>
  <hr />
  ${htmlContent}
</body>
</html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${novel.title}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const createNewNovel = () => {
    setNovel({
      title: "Untitled Novel",
      description: "",
      cover_url: "",
      chapters: [{ id: crypto.randomUUID(), title: "Chapter 1", content: "", order: 0 }],
      category: "",
      tags: [],
      status: "draft",
      is_nsfw: false,
    });
    setSelectedNovelId(null);
    setActiveChapter(0);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 animate-fade-in">
        <BookOpen className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Novel Editor</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Sign in to create and publish your novels with our full-featured editor!
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-[calc(100vh-120px)] gap-4 transition-all duration-300",
      isFullscreen && "fixed inset-0 z-50 bg-background p-4 h-screen"
    )}>
      {/* Hidden file inputs */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleCoverUpload(e.target.files)}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleImageInsert(e.target.files)}
      />

      {/* Sidebar - Novel List & Chapters */}
      {showOutline && (
        <div className="w-64 flex-shrink-0 bg-card rounded-xl border border-border overflow-hidden flex flex-col animate-slide-in-right">
          <div className="p-3 border-b border-border">
            <Button onClick={createNewNovel} className="w-full" size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Novel
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-4">
              {/* My Novels */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">My Novels</h4>
                <div className="space-y-1">
                  {novels.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No novels yet</p>
                  ) : (
                    novels.map(n => (
                      <button
                        key={n.id}
                        onClick={() => loadNovel(n.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          selectedNovelId === n.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        )}
                      >
                        <div className="font-medium truncate">{n.title}</div>
                        <div className="text-xs opacity-70 capitalize">{n.status}</div>
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
                  {novel.chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-colors",
                        activeChapter === index ? "bg-primary/20 text-primary" : "hover:bg-muted"
                      )}
                      onClick={() => setActiveChapter(index)}
                    >
                      <GripVertical className="w-4 h-4 opacity-50" />
                      <span className="flex-1 truncate text-sm">{chapter.title}</span>
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
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border p-2 space-y-2">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowOutline(!showOutline)}>
                {showOutline ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
              <Input
                value={novel.title}
                onChange={(e) => setNovel(prev => ({ ...prev, title: e.target.value }))}
                className="w-64 font-bold"
                placeholder="Novel Title"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {wordCount} words • {charCount} chars
              </span>
              <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs w-10 text-center">{fontSize}px</span>
              <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.min(24, fontSize + 2))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Maximize2 className="w-4 h-4" />
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
                    <DialogTitle>Publish Novel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Cover Image */}
                    <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <div className="flex gap-4 items-start">
                        {novel.cover_url ? (
                          <img src={novel.cover_url} alt="Cover" className="w-24 h-36 object-cover rounded-lg border" />
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
                        value={novel.description}
                        onChange={(e) => setNovel(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Write a compelling description for your novel..."
                        rows={4}
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={novel.category} onValueChange={(v) => setNovel(prev => ({ ...prev, category: v }))}>
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
                        {novel.tags.map((tag, i) => (
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
                        checked={novel.is_nsfw}
                        onCheckedChange={(checked) => setNovel(prev => ({ ...prev, is_nsfw: checked }))}
                      />
                    </div>

                    {/* Export Options */}
                    <div className="space-y-2">
                      <Label>Export</Label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportNovel("txt")}>
                          <Download className="w-4 h-4 mr-2" /> TXT
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportNovel("html")}>
                          <Download className="w-4 h-4 mr-2" /> HTML
                        </Button>
                      </div>
                    </div>

                    {/* Publish Button */}
                    <Button onClick={handlePublish} className="w-full" disabled={isSaving}>
                      {novel.status === "published" ? "Update Publication" : "Publish Now"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => execCommand("undo")} title="Undo"><Undo className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("redo")} title="Redo"><Redo className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("bold")} title="Bold"><Bold className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("italic")} title="Italic"><Italic className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("underline")} title="Underline"><Underline className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("strikeThrough")} title="Strikethrough"><Strikethrough className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h1")} title="Heading 1"><Heading1 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h2")} title="Heading 2"><Heading2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h3")} title="Heading 3"><Heading3 className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("justifyLeft")} title="Align Left"><AlignLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("justifyCenter")} title="Align Center"><AlignCenter className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("justifyRight")} title="Align Right"><AlignRight className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("justifyFull")} title="Justify"><AlignJustify className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("insertUnorderedList")} title="Bullet List"><List className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("insertOrderedList")} title="Numbered List"><ListOrdered className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "blockquote")} title="Quote"><Quote className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "pre")} title="Code Block"><Code className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => imageInputRef.current?.click()} title="Insert Image"><Image className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => {
              const url = prompt("Enter link URL:");
              if (url) execCommand("createLink", url);
            }} title="Insert Link"><Link className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("subscript")} title="Subscript"><Subscript className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("superscript")} title="Superscript"><Superscript className="w-4 h-4" /></Button>
          </div>
        </div>

        {/* Chapter Title */}
        <div className="px-4 py-2 border-b border-border">
          <Input
            value={novel.chapters[activeChapter]?.title || ""}
            onChange={(e) => updateChapterTitle(e.target.value)}
            className="text-xl font-bold bg-transparent border-none px-0 focus-visible:ring-0"
            placeholder="Chapter Title"
          />
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-auto p-6">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-full outline-none prose prose-invert max-w-none focus:ring-0"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
            onInput={(e) => updateChapterContent((e.target as HTMLDivElement).innerHTML)}
            suppressContentEditableWarning
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Chapter {activeChapter + 1} of {novel.chapters.length}
          </div>
          <div className="flex items-center gap-4">
            <span>~{Math.ceil(wordCount / 200)} min read</span>
            <span className="capitalize">{novel.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovelEditor;
