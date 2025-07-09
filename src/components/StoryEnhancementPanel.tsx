
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Music, Smile, Search, Type } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [textContent, setTextContent] = useState("");
  const [textStyle, setTextStyle] = useState({
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'normal',
    backgroundColor: 'transparent'
  });

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
    { id: '11', url: '🤔', name: 'Think', category: 'emoji' },
    { id: '12', url: '😴', name: 'Sleep', category: 'emoji' },
    { id: '13', url: '🎵', name: 'Music', category: 'emoji' },
    { id: '14', url: '📸', name: 'Camera', category: 'emoji' },
    { id: '15', url: '🌟', name: 'Star', category: 'emoji' },
  ];

  const customStickers: Sticker[] = [
    { id: 'c1', url: '/api/placeholder/60/60', name: 'Custom 1', category: 'custom' },
    { id: 'c2', url: '/api/placeholder/60/60', name: 'Custom 2', category: 'custom' },
    { id: 'c3', url: '/api/placeholder/60/60', name: 'Custom 3', category: 'custom' },
    { id: 'c4', url: '/api/placeholder/60/60', name: 'Custom 4', category: 'custom' },
  ];

  const bitmojiStickers: Sticker[] = [
    { id: 'b1', url: '/api/placeholder/60/60', name: 'Bitmoji 1', category: 'bitmoji' },
    { id: 'b2', url: '/api/placeholder/60/60', name: 'Bitmoji 2', category: 'bitmoji' },
    { id: 'b3', url: '/api/placeholder/60/60', name: 'Bitmoji 3', category: 'bitmoji' },
    { id: 'b4', url: '/api/placeholder/60/60', name: 'Bitmoji 4', category: 'bitmoji' },
  ];

  const popularSongs = [
    { id: 's1', title: 'Trending Song 1', artist: 'Artist 1', duration: '0:30' },
    { id: 's2', title: 'Trending Song 2', artist: 'Artist 2', duration: '0:30' },
    { id: 's3', title: 'Trending Song 3', artist: 'Artist 3', duration: '0:30' },
    { id: 's4', title: 'Trending Song 4', artist: 'Artist 4', duration: '0:30' },
  ];

  const searchGifs = async (query: string) => {
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
    <div className={`w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg ${isMobile ? 'p-3' : 'p-4'}`}>
      <Tabs defaultValue="stickers" className="w-full">
        <TabsList className={`grid w-full grid-cols-5 ${isMobile ? 'h-10' : ''}`}>
          <TabsTrigger value="stickers" className={isMobile ? 'p-2' : ''}>
            <Smile className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
          </TabsTrigger>
          <TabsTrigger value="text" className={isMobile ? 'p-2' : ''}>
            <Type className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
          </TabsTrigger>
          <TabsTrigger value="gifs" className={isMobile ? 'p-2 text-xs' : ''}>GIF</TabsTrigger>
          <TabsTrigger value="music" className={isMobile ? 'p-2' : ''}>
            <Music className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
          </TabsTrigger>
          <TabsTrigger value="draw" className={isMobile ? 'p-2' : ''}>
            <Palette className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stickers" className={`space-y-3 ${isMobile ? 'mt-3' : 'space-y-4'}`}>
          <div className="space-y-3">
            <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Emoji Stickers</h3>
            <div className={`grid ${isMobile ? 'grid-cols-6 gap-1' : 'grid-cols-5 gap-2'}`}>
              {emojiStickers.map(sticker => (
                <Button
                  key={sticker.id}
                  variant="ghost"
                  size="sm"
                  className={`${isMobile ? 'text-xl p-1 h-10 touch-manipulation' : 'text-2xl p-2 h-12'}`}
                  onClick={() => onStickerSelect(sticker.url)}
                >
                  {sticker.url}
                </Button>
              ))}
            </div>

            <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Custom Stickers</h3>
            <div className={`grid ${isMobile ? 'grid-cols-4 gap-1' : 'grid-cols-4 gap-2'}`}>
              {customStickers.map(sticker => (
                <Button
                  key={sticker.id}
                  variant="ghost"
                  size="sm"
                  className={`${isMobile ? 'p-1 h-12 touch-manipulation' : 'p-1 h-16'}`}
                  onClick={() => onStickerSelect(sticker.url)}
                >
                  <img src={sticker.url} alt={sticker.name} className="w-full h-full object-cover rounded" />
                </Button>
              ))}
            </div>

            <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Bitmoji</h3>
            <div className={`grid ${isMobile ? 'grid-cols-4 gap-1' : 'grid-cols-4 gap-2'}`}>
              {bitmojiStickers.map(sticker => (
                <Button
                  key={sticker.id}
                  variant="ghost"
                  size="sm"
                  className={`${isMobile ? 'p-1 h-12 touch-manipulation' : 'p-1 h-16'}`}
                  onClick={() => onStickerSelect(sticker.url)}
                >
                  <img src={sticker.url} alt={sticker.name} className="w-full h-full object-cover rounded" />
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className={`space-y-3 ${isMobile ? 'mt-3' : 'space-y-4'}`}>
          <div className="space-y-3">
            <Textarea
              placeholder="Add text to your story..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              className={`${isMobile ? 'min-h-[60px] text-sm' : 'min-h-[80px]'}`}
            />
            
            <div className={`flex gap-2 items-center ${isMobile ? 'flex-wrap' : ''}`}>
              <input
                type="color"
                value={textStyle.color}
                onChange={(e) => setTextStyle(prev => ({ ...prev, color: e.target.value }))}
                className={`${isMobile ? 'w-8 h-8' : 'w-8 h-8'} rounded border touch-manipulation`}
              />
              <select
                value={textStyle.fontSize}
                onChange={(e) => setTextStyle(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className={`${isMobile ? 'px-2 py-1 text-sm' : 'px-2 py-1'} border rounded touch-manipulation`}
              >
                <option value="12">XS</option>
                <option value="14">Small</option>
                <option value="16">Normal</option>
                <option value="20">Large</option>
                <option value="24">XL</option>
              </select>
              <select
                value={textStyle.fontWeight}
                onChange={(e) => setTextStyle(prev => ({ ...prev, fontWeight: e.target.value }))}
                className={`${isMobile ? 'px-2 py-1 text-sm' : 'px-2 py-1'} border rounded touch-manipulation`}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <Button 
              onClick={handleAddText} 
              disabled={!textContent.trim()} 
              className={`w-full touch-manipulation ${isMobile ? 'h-10' : ''}`}
            >
              Add Text
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="gifs" className={`space-y-3 ${isMobile ? 'mt-3' : 'space-y-4'}`}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search GIFs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchGifs(searchTerm)}
                className={isMobile ? 'text-sm' : ''}
              />
              <Button 
                size="sm" 
                onClick={() => searchGifs(searchTerm)}
                className="touch-manipulation"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-2 gap-1 max-h-48' : 'grid-cols-2 gap-2 max-h-60'} overflow-y-auto`}>
              {gifs.map(gif => (
                <Button
                  key={gif.id}
                  variant="ghost"
                  size="sm"
                  className={`${isMobile ? 'p-1 h-16 touch-manipulation' : 'p-1 h-20'}`}
                  onClick={() => onGifSelect(gif.url)}
                >
                  <img src={gif.url} alt={gif.title} className="w-full h-full object-cover rounded" />
                </Button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="music" className={`space-y-3 ${isMobile ? 'mt-3' : 'space-y-4'}`}>
          <div className="space-y-3">
            <h3 className={`font-medium ${isMobile ? 'text-sm' : ''}`}>Popular Songs</h3>
            <div className={`space-y-2 ${isMobile ? 'max-h-48' : 'max-h-60'} overflow-y-auto`}>
              {popularSongs.map(song => (
                <div
                  key={song.id}
                  className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-2'} border rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer touch-manipulation`}
                  onClick={() => onMusicSelect(song.id)}
                >
                  <div>
                    <p className={`font-medium ${isMobile ? 'text-sm' : 'text-sm'}`}>{song.title}</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>{song.artist}</p>
                  </div>
                  <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>{song.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="draw" className={`space-y-3 ${isMobile ? 'mt-3' : 'space-y-4'}`}>
          <div className="space-y-3">
            <Button 
              onClick={onDrawingToggle} 
              className={`w-full touch-manipulation ${isMobile ? 'h-12' : ''}`}
            >
              <Palette className="w-4 h-4 mr-2" />
              Toggle Drawing Mode
            </Button>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400 text-center`}>
              Tap the button above to enable drawing on your story. Use your finger or mouse to draw!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StoryEnhancementPanel;
