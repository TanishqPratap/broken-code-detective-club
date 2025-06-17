
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Search, Play, Pause, Plus, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  preview_url: string | null;
  external_url: string;
  duration_ms: number;
  image: string;
}

interface SpotifyMusicSelectorProps {
  onTrackSelect: (track: SpotifyTrack) => void;
  selectedTrack?: SpotifyTrack | null;
}

const SpotifyMusicSelector = ({ onTrackSelect, selectedTrack }: SpotifyMusicSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const searchTracks = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('spotify-search', {
        body: { query: searchQuery, limit: 20 }
      });

      if (error) throw error;

      // Sort tracks to prioritize those with preview URLs
      const sortedTracks = (data.tracks || []).sort((a: SpotifyTrack, b: SpotifyTrack) => {
        if (a.preview_url && !b.preview_url) return -1;
        if (!a.preview_url && b.preview_url) return 1;
        return 0;
      });

      setTracks(sortedTracks);
      
      if (sortedTracks.length === 0) {
        toast.info('No tracks found. Try a different search term.');
      } else {
        const previewCount = sortedTracks.filter((t: SpotifyTrack) => t.preview_url).length;
        if (previewCount === 0) {
          toast.info(`Found ${sortedTracks.length} tracks, but none have preview audio available.`);
        } else {
          toast.success(`Found ${sortedTracks.length} tracks (${previewCount} with previews available)`);
        }
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
      toast.error('Failed to search tracks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchTracks();
    }
  };

  const playPreview = (track: SpotifyTrack) => {
    if (!track.preview_url) {
      toast.info('No preview available for this track, but you can still add it to your vibe!');
      return;
    }

    // Stop current audio if playing
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    if (playingTrack === track.id) {
      setPlayingTrack(null);
      setAudioElement(null);
      return;
    }

    // Play new audio
    const audio = new Audio(track.preview_url);
    audio.volume = 0.5;
    
    audio.addEventListener('ended', () => {
      setPlayingTrack(null);
      setAudioElement(null);
    });

    audio.addEventListener('error', () => {
      toast.error('Failed to play preview');
      setPlayingTrack(null);
      setAudioElement(null);
    });

    audio.play().catch(() => {
      toast.error('Failed to play preview');
      setPlayingTrack(null);
      setAudioElement(null);
    });

    setAudioElement(audio);
    setPlayingTrack(track.id);
  };

  const stopPreview = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setAudioElement(null);
    }
    setPlayingTrack(null);
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    onTrackSelect(track);
    if (!track.preview_url) {
      toast.success(`"${track.name}" by ${track.artist} added to your vibe! (No preview available, but will show track info)`);
    } else {
      toast.success(`"${track.name}" by ${track.artist} added to your vibe!`);
    }
  };

  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
      }
    };
  }, [audioElement]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Music className="w-5 h-5" />
        <h3 className="font-semibold">Add Music to Your Vibe</h3>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search for songs, artists, or albums..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={searchTracks} disabled={loading || !searchQuery.trim()}>
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {selectedTrack && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <img 
                src={selectedTrack.image} 
                alt={selectedTrack.album}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-sm">{selectedTrack.name}</p>
                <p className="text-xs text-gray-600">{selectedTrack.artist}</p>
                {!selectedTrack.preview_url && (
                  <div className="flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3 text-orange-500" />
                    <span className="text-xs text-orange-600">No preview available</span>
                  </div>
                )}
              </div>
              <Check className="w-5 h-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Searching Spotify...</p>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {tracks.map((track) => (
          <Card key={track.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <img 
                  src={track.image} 
                  alt={track.album}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{track.name}</p>
                  <p className="text-xs text-gray-600 truncate">{track.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">{formatDuration(track.duration_ms)}</p>
                    {!track.preview_url && (
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                        <span className="text-xs text-orange-600">No preview</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {track.preview_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playingTrack === track.id ? stopPreview() : playPreview(track)}
                      className="p-1 h-8 w-8"
                    >
                      {playingTrack === track.id ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTrackSelect(track)}
                    className="p-1 h-8 w-8"
                    disabled={selectedTrack?.id === track.id}
                  >
                    {selectedTrack?.id === track.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tracks.length === 0 && searchQuery && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No tracks found. Try a different search term.</p>
        </div>
      )}

      {tracks.length > 0 && !loading && (
        <div className="text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Tracks with preview audio are shown first. Even without previews, the track info will appear on your vibe!
          </p>
        </div>
      )}
    </div>
  );
};

export default SpotifyMusicSelector;
