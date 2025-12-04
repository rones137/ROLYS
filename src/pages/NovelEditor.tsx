import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Quote, Code, Image, Link, Undo, Redo, Save, Eye, Download, Upload,
  Plus, Trash2, GripVertical, FileText, Settings, BookOpen, Users, ChevronLeft, ChevronRight,
  Type, Heading1, Heading2, Heading3, Palette, Highlighter, Subscript, Superscript, Table,
  Smile, Search, Replace, SpellCheck, FileDown, History, Maximize2, ZoomIn, ZoomOut
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

const NovelEditor = () => {
  const { user } = useAuth();
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

  // Load user's novels
  useEffect(() => {
    if (user) {
      loadNovels();
    }
  }, [user]);

  const loadNovels = async () => {
    const { data, error } = await supabase
      .from("novels")
      .select("*")
      .eq("author_id", user?.id)
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
      setNovel({
        id: data.id,
        title: data.title,
        description: data.description || "",
        cover_url: data.cover_url || "",
        chapters: (data.chapters as unknown as Chapter[]) || [{ id: crypto.randomUUID(), title: "Chapter 1", content: "", order: 0 }],
        category: data.category || "",
        tags: data.tags || [],
        status: data.status as "draft" | "published" | "archived",
        is_nsfw: data.is_nsfw || false,
      });
      setSelectedNovelId(id);
      setActiveChapter(0);
    }
  };

  // Calculate word and character count
  useEffect(() => {
    const content = novel.chapters[activeChapter]?.content || "";
    const text = content.replace(/<[^>]*>/g, "");
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
    setCharCount(text.length);
  }, [novel.chapters, activeChapter]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && novel.title) {
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
        chapters: novel.chapters,
        category: novel.category,
        tags: novel.tags,
        status: novel.status,
        is_nsfw: novel.is_nsfw,
        updated_at: new Date().toISOString(),
      };

      if (novel.id) {
        await supabase.from("novels").update(novelData as any).eq("id", novel.id);
      } else {
        const { data } = await supabase.from("novels").insert(novelData as any).select().single();
        
        if (data) {
          setNovel(prev => ({ ...prev, id: data.id }));
          setSelectedNovelId(data.id);
        }
      }

      if (!silent) toast.success("Novel saved!");
      loadNovels();
    } catch (error) {
      if (!silent) toast.error("Failed to save");
    } finally {
      setIsSaving(false);
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
  };

  const handlePublish = async () => {
    setNovel(prev => ({ ...prev, status: "published" }));
    await handleSave();
    setShowPublishDialog(false);
    toast.success("Novel published successfully!");
  };

  const exportNovel = (format: string) => {
    const content = novel.chapters.map(ch => `# ${ch.title}\n\n${ch.content}`).join("\n\n---\n\n");
    
    if (format === "txt") {
      const blob = new Blob([content.replace(/<[^>]*>/g, "")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${novel.title}.txt`;
      a.click();
    } else if (format === "html") {
      const html = `<!DOCTYPE html><html><head><title>${novel.title}</title></head><body>${content}</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${novel.title}.html`;
      a.click();
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
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <BookOpen className="w-24 h-24 text-muted-foreground mb-6" />
        <h2 className="text-3xl font-bold text-foreground mb-3">Novel Editor</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Sign in to create and publish your novels!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex h-[calc(100vh-120px)] gap-4", isFullscreen && "fixed inset-0 z-50 bg-background p-4 h-screen")}>
      {/* Sidebar - Novel List & Chapters */}
      {showOutline && (
        <div className="w-64 flex-shrink-0 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
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
                  {novels.map(n => (
                    <button
                      key={n.id}
                      onClick={() => loadNovel(n.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        selectedNovelId === n.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      )}
                    >
                      <div className="font-medium truncate">{n.title}</div>
                      <div className="text-xs opacity-70">{n.status}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Chapters</h4>
                  <Button variant="ghost" size="sm" onClick={addChapter}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {novel.chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group",
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
              <span className="text-xs">{fontSize}px</span>
              <Button variant="ghost" size="sm" onClick={() => setFontSize(Math.min(24, fontSize + 2))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleSave()}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Eye className="w-4 h-4 mr-2" /> Publish
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Publish Novel</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={novel.description}
                        onChange={(e) => setNovel(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your novel..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Select value={novel.category} onValueChange={(v) => setNovel(prev => ({ ...prev, category: v }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fantasy">Fantasy</SelectItem>
                          <SelectItem value="romance">Romance</SelectItem>
                          <SelectItem value="action">Action</SelectItem>
                          <SelectItem value="scifi">Sci-Fi</SelectItem>
                          <SelectItem value="mystery">Mystery</SelectItem>
                          <SelectItem value="horror">Horror</SelectItem>
                          <SelectItem value="comedy">Comedy</SelectItem>
                          <SelectItem value="slice-of-life">Slice of Life</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => exportNovel("txt")}>
                        <Download className="w-4 h-4 mr-2" /> Export TXT
                      </Button>
                      <Button variant="outline" onClick={() => exportNovel("html")}>
                        <Download className="w-4 h-4 mr-2" /> Export HTML
                      </Button>
                    </div>
                    <Button onClick={handlePublish} className="w-full">
                      Publish Now
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => execCommand("undo")}><Undo className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("redo")}><Redo className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("bold")}><Bold className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("italic")}><Italic className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("underline")}><Underline className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("strikeThrough")}><Strikethrough className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h1")}><Heading1 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h2")}><Heading2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "h3")}><Heading3 className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("justifyLeft")}><AlignLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("justifyCenter")}><AlignCenter className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("justifyRight")}><AlignRight className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("justifyFull")}><AlignJustify className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("insertUnorderedList")}><List className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("insertOrderedList")}><ListOrdered className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "blockquote")}><Quote className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("formatBlock", "pre")}><Code className="w-4 h-4" /></Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" onClick={() => execCommand("subscript")}><Subscript className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => execCommand("superscript")}><Superscript className="w-4 h-4" /></Button>
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
            contentEditable
            className="min-h-full outline-none prose prose-invert max-w-none"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: novel.chapters[activeChapter]?.content || "" }}
            onInput={(e) => updateChapterContent((e.target as HTMLDivElement).innerHTML)}
            onBlur={(e) => updateChapterContent((e.target as HTMLDivElement).innerHTML)}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div>
            Chapter {activeChapter + 1} of {novel.chapters.length}
          </div>
          <div className="flex items-center gap-4">
            <span>~{Math.ceil(wordCount / 200)} min read</span>
            <span>{novel.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovelEditor;