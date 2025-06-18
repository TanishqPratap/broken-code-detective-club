
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const VideoHero = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate("/creator");
    } else {
      setShowAuthModal(true);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="/hero.mp4"
          type="video/mp4"
        />
        {/* Fallback for browsers that don't support video */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600"></div>
      </video>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="text-center text-white px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            YOUR CREATIVITY
            <br />
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              YOUR COMMUNITY
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              YOUR INCOME
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed">
            The Stage is Yours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              className="text-lg px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 border-0"
              onClick={handleGetStarted}
            >
              <Play className="w-5 h-5 mr-2" />
              Start Creating Today
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-black"
              onClick={() => navigate("/discover")}
            >
              Explore Creators
            </Button>
          </div>

          <div className="text-sm text-gray-300">
            Or schedule a one-time content order →
          </div>
        </div>
      </div>

      {/* Audio control */}
      <button
        onClick={toggleMute}
        className="absolute top-6 right-6 z-20 p-3 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-colors"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex flex-col items-center text-white/70">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-bounce"></div>
          </div>
          <span className="text-xs mt-2">Scroll to explore</span>
        </div>
      </div>
    </div>
  );
};

export default VideoHero;
