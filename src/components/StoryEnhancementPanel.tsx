
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Music, Smile, Search, Type, Download } from "lucide-react";
import { toast } from "sonner";

interface StoryEnhancementPanelProps {
  onStickerSelect: (sticker: string) => void;
  onTextAdd: (text: string, style: any) => void;
  onGifSelect: (gif: string) => void;
  onMusicSelect: (music: string) => void;
  onDrawingToggle: () => void;
}

interface Sticker {
  id: string;
  url: string;
  name: string;
  category: 'emoji' | 'custom' | 'bitmoji';
}

interface GifData {
  id: string;
  url: string;
  title: string;
}

const StoryEnhancementPanel = ({
  onStickerSelect,
  onTextAdd,
  onGifSelect,
  onMusicSelect,
  onDrawingToggle
}: StoryEnhancementPanelProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [textContent, setTextContent] = useState("");
  const [textStyle, setTextStyle] = useState({
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'normal',
    backgroundColor: 'transparent'
  });

  // Preloaded emoji stickers
  const emojiStickers: Sticker[] = [
    { id: '1', url: '😀', name: 'Happy', category: 'emoji' },
    { id: '2', url: '😍', name: 'Love', category: 'emoji' },
    { id: '3', url: '🥳', name: 'Party', category: 'emoji' },
    { id: '4', url: '😎', name: 'Cool', category: 'emoji' },
    { id: '5', url: '🔥', name: 'Fire', category: 'emoji' },
    { id: '6', url: '💯', name: 'Hundred', category: 'emoji' },
    { id: '7', url: '❤️', name: 'Heart', category: 'emoji' },
    { id: '8', url: '✨', name: 'Sparkles', category: 'emoji' },
    { id: '9', url: '🎉', name: 'Celebration', category: 'emoji' },
    { id: '10', url: '😂', name: 'Laugh', category: 'emoji' },
  ];

  // Custom stickers (placeholder URLs)
  const customStickers: Sticker[] = [
    { id: 'c1', url: '/api/placeholder/60/60', name: 'Custom 1', category: 'custom' },
    { id: 'c2', url: '/api/placeholder/60/60', name: 'Custom 2', category: 'custom' },
    { id: 'c3', url: '/api/placeholder/60/60', name: 'Custom 3', category: 'custom' },
    { id: 'c4', url: '/api/placeholder/60/60', name: 'Custom 4', category: 'custom' },
  ];

  // Mock Bitmoji stickers
  const bitmojiStickers: Sticker[] = [
    { id: 'b1', url: '/api/placeholder/60/60', name: 'Bitmoji 1', category: 'bitmoji' },
    { id: 'b2', url: '/api/placeholder/60/60', name: 'Bitmoji 2', category: 'bitmoji' },
    { id: 'b3', url: '/api/placeholder/60/60', name: 'Bitmoji 3', category: 'bitmoji' },
    { id: 'b4', url: '/api/placeholder/60/60', name: 'Bitmoji 4', category: 'bitmoji' },
  ];

  // Popular songs (mock data)
  const popularSongs = [
    { id: 's1', title: 'Trending Song 1', artist: 'Artist 1', duration: '0:30' },
    { id: 's2', title: 'Trending Song 2', artist: 'Artist 2', duration: '0:30' },
    { id: 's3', title: 'Trending Song 3', artist: 'Artist 3', duration: '0:30' },
    { id: 's4', title: 'Trending Song 4', artist: 'Artist 4', duration: '0:30' },
  ];

  const searchGifs = async (query: string) => {
    // Mock Giphy integration - in real app, you'd use Giphy API
    const mockGifs: GifData[] = [
      { id: 'g1', url: 'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif', title: `${query} 1` },
      { id: 'g2', url: 'https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif', title: `${query} 2` },
      { id: 'g3', url: 'https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif', title: `${query} 3` },
      { id: 'g4', url: 'https://media.giphy.com/media/l1ughbsd9qXz2s9SE/giphy.gif', title: `${query} 4` },
    ];
    setGifs(mockGifs);
  };

  const handleAddText = () => {
    if (textContent.trim()) {
      onTextAdd(textContent, textStyle);
      setTextContent("");
      toast.success("Text added to story!");
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-4">
      <Tabs defaultValue="stickers" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stickers">
            <Smile className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="text">
            <Type className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="gifs">GIF</TabsTrigger>
          <TabsTrigger value="music">
            <Music className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger value="draw">
            <Palette className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stickers" className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium">Emoji Stickers</h3>
            <div className="grid grid-cols-5 gap-2">
              {emojiStickers.map(sticker => (
                <Button
                  key={sticker.id}
                  variant="ghost"
                  size="sm"
                  className="text-2xl p-2 h-12"
                  onClick={() => onStickerSelect(sticker.url)}
                >
                  {sticker.url}
                </Button>
              ))}
            </div>

            <h3 className="font-medium">Custom Stickers</h3>
            <div className="grid grid-cols-4 gap-2">
              {customStickers.map(sticker => (
                <Button
                  key={sticker.id}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-16"
                  onClick={() => onStickerSelect(sticker.url)}
                >
                  <img src={sticker.url} alt={sticker.name} className="w-full h-full object-cover rounded" />
                </Button>
              ))}
            </div>

            <h3 className="font-medium">Bitmoji</h3>
            <div className="grid grid-cols-4 gap-2">
              {bitmojiStickers.map(sticker => (
                <Button
                  key={sticker.id}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-16"
                  onClick={() => onStickerSelect(sticker.url)}
                >
                  <img src={sticker.url} alt={sticker.name} className="w-full h-full object-cover rounded" />
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Add text to your story..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className="min-h-[80px]"
            />
            
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={textStyle.color}
                onChange={(e) => setTextStyle(prev => ({ ...prev, color: e.target.value }))}
                className="w-8 h-8 rounded border"
              />
              <select
                value={textStyle.fontSize}
                onChange={(e) => setTextStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className="px-2 py-1 border rounded"
              >
                <option value="14">Small</option>
                <option value="16">Normal</option>
                <option value="20">Large</option>
                <option value="24">Extra Large</option>
              </select>
              <select
                value={textStyle.fontWeight}
                onChange={(e) => setTextStyle(prev => ({ ...prev, fontWeight: e.target.value }))}
                className="px-2 py-1 border rounded"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <Button onClick={handleAddText} disabled={!textContent.trim()} className="w-full">
              Add Text
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="gifs" className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchGifs(searchTerm)}
              />
              <Button size="sm" onClick={() => searchGifs(searchTerm)}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {gifs.map(gif => (
                <Button
                  key={gif.id}
                  variant="ghost"
                  size="sm"
                  className="p-1 h-20"
                  onClick={() => onGifSelect(gif.url)}
                >
                  <img src={gif.url} alt={gif.title} className="w-full h-full object-cover rounded" />
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="music" className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-medium">Popular Songs</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {popularSongs.map(song => (
                <div
                  key={song.id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => onMusicSelect(song.id)}
                >
                  <div>
                    <p className="font-medium text-sm">{song.title}</p>
                    <p className="text-xs text-gray-500">{song.artist}</p>
                  </div>
                  <span className="text-xs text-gray-400">{song.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="draw" className="space-y-4">
          <div className="space-y-3">
            <Button onClick={onDrawingToggle} className="w-full">
              <Palette className="w-4 h-4 mr-2" />
              Toggle Drawing Mode
            </Button>
            <p className="text-sm text-gray-600 text-center">
              Tap the button above to enable drawing on your story. Use your finger or mouse to draw!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoryEnhancementPanel;
