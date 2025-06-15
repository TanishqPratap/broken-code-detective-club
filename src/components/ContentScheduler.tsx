import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Clock, Calendar as CalendarIcon, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type ScheduledPost = Tables<"scheduled_posts">;

const ContentScheduler = () => {
  const { user } = useAuth();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchScheduledPosts();
  }, [user]);

  const fetchScheduledPosts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .eq('creator_id', user.id)
        .order('scheduled_for', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Fetched scheduled posts:', data);
      setScheduledPosts(data || []);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      toast.error("Failed to load scheduled posts");
    } finally {
      setLoading(false);
    }
  };

  const schedulePost = async () => {
    if (!user || !title || !content || !selectedDate || !selectedTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSaving(true);

      // Combine date and time
      const [hours, minutes] = selectedTime.split(':');
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes));

      // Check if the scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        toast.error("Scheduled time must be in the future");
        return;
      }

      let mediaUrl = null;

      // Upload media if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('post-media')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
      }

      // Save scheduled post
      const { error } = await supabase
        .from('scheduled_posts')
        .insert({
          creator_id: user.id,
          title,
          content,
          media_url: mediaUrl,
          scheduled_for: scheduledDateTime.toISOString(),
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success("Post scheduled successfully!");
      setIsOpen(false);
      resetForm();
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error scheduling post:', error);
      toast.error("Failed to schedule post");
    } finally {
      setSaving(false);
    }
  };

  const deleteScheduledPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast.success("Scheduled post deleted");
      fetchScheduledPosts();
    } catch (error) {
      console.error('Error deleting scheduled post:', error);
      toast.error("Failed to delete scheduled post");
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setFile(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'published':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">Loading scheduled posts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Content Scheduler
              </CardTitle>
              <CardDescription>
                Schedule your posts to be published automatically
              </CardDescription>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Schedule New Post</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="post-title">Title</Label>
                    <Input
                      id="post-title"
                      placeholder="Enter post title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="post-content">Content</Label>
                    <Textarea
                      id="post-content"
                      placeholder="What would you like to share?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="post-media">Media (Optional)</Label>
                    <Input
                      id="post-media"
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="post-time">Time</Label>
                      <Input
                        id="post-time"
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
                      Cancel
                    </Button>
                    <Button onClick={schedulePost} disabled={saving} className="flex-1">
                      {saving ? "Scheduling..." : "Schedule Post"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {scheduledPosts.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No scheduled posts</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Schedule your first post to publish automatically
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <Card key={post.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{post.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="w-4 h-4" />
                          <span>
                            {format(new Date(post.scheduled_for), "PPP 'at' p")}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteScheduledPost(post.id)}
                          disabled={post.status === 'published'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentScheduler;
