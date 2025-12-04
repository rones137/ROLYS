import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Vote, Plus, Trash2, Clock, Users, TrendingUp, Image as ImageIcon, X, Check, BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PollOption {
  text: string;
  imageUrl?: string;
}

interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  options: PollOption[];
  poll_type: "single" | "multiple";
  visibility: "public" | "private" | "results_after_close";
  ends_at: string | null;
  is_closed: boolean;
  created_at: string;
  votes?: { option_index: number; count: number }[];
  userVotes?: number[];
  creator?: { username: string; avatar_url: string | null };
}

const Votes = () => {
  const { user } = useAuth();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("trending");

  // New poll form
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    options: [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }],
    poll_type: "single" as "single" | "multiple",
    visibility: "public" as "public" | "private" | "results_after_close",
    ends_at: "",
  });

  useEffect(() => {
    loadPolls();
  }, [activeTab]);

  const loadPolls = async () => {
    setLoading(true);
    let query = supabase
      .from("polls")
      .select("*")
      .eq("visibility", "public")
      .order("created_at", { ascending: false });

    const { data: pollsData, error } = await query;

    if (pollsData) {
      // Get vote counts and user votes
      const pollsWithVotes = await Promise.all(
        pollsData.map(async (poll) => {
          // Get vote counts per option
          const { data: votes } = await supabase
            .from("poll_votes")
            .select("option_index")
            .eq("poll_id", poll.id);

          const voteCounts: Record<number, number> = {};
          votes?.forEach(v => {
            voteCounts[v.option_index] = (voteCounts[v.option_index] || 0) + 1;
          });

          // Get user's votes if logged in
          let userVotes: number[] = [];
          if (user) {
            const { data: userVoteData } = await supabase
              .from("poll_votes")
              .select("option_index")
              .eq("poll_id", poll.id)
              .eq("user_id", user.id);
            userVotes = userVoteData?.map(v => v.option_index) || [];
          }

          // Get creator profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("user_id", poll.creator_id)
            .single();

          return {
            ...poll,
            options: poll.options as unknown as PollOption[],
            votes: Object.entries(voteCounts).map(([index, count]) => ({
              option_index: parseInt(index),
              count,
            })),
            userVotes,
            creator: profile,
          };
        })
      );

      // Sort based on tab
      if (activeTab === "trending") {
        pollsWithVotes.sort((a, b) => {
          const aTotal = a.votes?.reduce((sum, v) => sum + v.count, 0) || 0;
          const bTotal = b.votes?.reduce((sum, v) => sum + v.count, 0) || 0;
          return bTotal - aTotal;
        });
      }

      setPolls(pollsWithVotes as Poll[]);
    }
    setLoading(false);
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) {
      toast.error("Please sign in to vote");
      return;
    }

    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    const hasVoted = poll.userVotes?.includes(optionIndex);

    if (hasVoted) {
      // Remove vote
      await supabase
        .from("poll_votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("user_id", user.id)
        .eq("option_index", optionIndex);
      toast.success("Vote removed");
    } else {
      // For single choice, remove existing vote first
      if (poll.poll_type === "single" && poll.userVotes && poll.userVotes.length > 0) {
        await supabase
          .from("poll_votes")
          .delete()
          .eq("poll_id", pollId)
          .eq("user_id", user.id);
      }

      // Add vote
      await supabase.from("poll_votes").insert({
        poll_id: pollId,
        user_id: user.id,
        option_index: optionIndex,
      });
      toast.success("Vote recorded!");
    }

    loadPolls();
  };

  const createPoll = async () => {
    if (!user) {
      toast.error("Please sign in to create a poll");
      return;
    }

    if (!newPoll.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    const validOptions = newPoll.options.filter(o => o.text.trim());
    if (validOptions.length < 2) {
      toast.error("Please add at least 2 options");
      return;
    }

    const { error } = await supabase.from("polls").insert({
      creator_id: user.id,
      title: newPoll.title,
      description: newPoll.description || null,
      options: validOptions,
      poll_type: newPoll.poll_type,
      visibility: newPoll.visibility,
      ends_at: newPoll.ends_at || null,
    });

    if (error) {
      toast.error("Failed to create poll");
      return;
    }

    toast.success("Poll created!");
    setShowCreateDialog(false);
    setNewPoll({
      title: "",
      description: "",
      options: [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }],
      poll_type: "single",
      visibility: "public",
      ends_at: "",
    });
    loadPolls();
  };

  const addOption = () => {
    if (newPoll.options.length < 10) {
      setNewPoll(prev => ({
        ...prev,
        options: [...prev.options, { text: "", imageUrl: "" }],
      }));
    }
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const updateOption = (index: number, field: "text" | "imageUrl", value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const getTotalVotes = (poll: Poll) => {
    return poll.votes?.reduce((sum, v) => sum + v.count, 0) || 0;
  };

  const getOptionVotes = (poll: Poll, index: number) => {
    return poll.votes?.find(v => v.option_index === index)?.count || 0;
  };

  const getVotePercentage = (poll: Poll, index: number) => {
    const total = getTotalVotes(poll);
    if (total === 0) return 0;
    return (getOptionVotes(poll, index) / total) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Vote className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-4xl font-black text-foreground">Votes & Polls</h1>
            <p className="text-muted-foreground">Create polls and vote on community topics</p>
          </div>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Poll</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newPoll.title}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="What do you want to ask?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Textarea
                  value={newPoll.description}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Add more context..."
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Options</label>
                <div className="space-y-2">
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(index, "text", e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      <Input
                        value={option.imageUrl}
                        onChange={(e) => updateOption(index, "imageUrl", e.target.value)}
                        placeholder="Image URL (optional)"
                        className="w-40"
                      />
                      {newPoll.options.length > 2 && (
                        <Button variant="ghost" size="sm" onClick={() => removeOption(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {newPoll.options.length < 10 && (
                  <Button variant="outline" size="sm" onClick={addOption} className="mt-2">
                    <Plus className="w-4 h-4 mr-2" /> Add Option
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={newPoll.poll_type}
                    onValueChange={(v) => setNewPoll(prev => ({ ...prev, poll_type: v as "single" | "multiple" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Choice</SelectItem>
                      <SelectItem value="multiple">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Visibility</label>
                  <Select
                    value={newPoll.visibility}
                    onValueChange={(v) => setNewPoll(prev => ({ ...prev, visibility: v as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="results_after_close">Results After Close</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">End Date (optional)</label>
                <Input
                  type="datetime-local"
                  value={newPoll.ends_at}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, ends_at: e.target.value }))}
                />
              </div>

              <Button onClick={createPoll} className="w-full">
                Create Poll
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="trending">
            <TrendingUp className="w-4 h-4 mr-2" /> Trending
          </TabsTrigger>
          <TabsTrigger value="latest">
            <Clock className="w-4 h-4 mr-2" /> Latest
          </TabsTrigger>
          <TabsTrigger value="my-polls">
            <BarChart3 className="w-4 h-4 mr-2" /> My Polls
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Polls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {polls.map(poll => (
          <Card key={poll.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={poll.creator?.avatar_url || undefined} />
                  <AvatarFallback>{poll.creator?.username?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{poll.creator?.username}</span>
                {poll.poll_type === "multiple" && (
                  <Badge variant="secondary" className="text-xs">Multi-select</Badge>
                )}
              </div>
              <CardTitle className="text-lg">{poll.title}</CardTitle>
              {poll.description && (
                <CardDescription>{poll.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {poll.options.map((option, index) => {
                const hasVoted = poll.userVotes?.includes(index);
                const percentage = getVotePercentage(poll, index);
                const votes = getOptionVotes(poll, index);

                return (
                  <div
                    key={index}
                    onClick={() => handleVote(poll.id, index)}
                    className={cn(
                      "relative p-3 rounded-lg border cursor-pointer transition-all overflow-hidden",
                      hasVoted ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                    )}
                  >
                    {/* Progress bar background */}
                    <div
                      className="absolute inset-0 bg-primary/20 transition-all"
                      style={{ width: `${percentage}%` }}
                    />

                    <div className="relative flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {option.imageUrl && (
                          <img
                            src={option.imageUrl}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <span className="font-medium">{option.text}</span>
                        {hasVoted && <Check className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {votes} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {getTotalVotes(poll)} votes
              </div>
              {poll.ends_at && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Ends {new Date(poll.ends_at).toLocaleDateString()}
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {polls.length === 0 && (
        <div className="text-center py-16">
          <Vote className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">No Polls Yet</h3>
          <p className="text-muted-foreground mb-4">Be the first to create a poll!</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Poll
          </Button>
        </div>
      )}
    </div>
  );
};

export default Votes;