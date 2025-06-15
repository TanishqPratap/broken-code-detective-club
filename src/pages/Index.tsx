
import { useIsMobile } from "@/hooks/use-mobile";
import PostFeed from "@/components/PostFeed";
import MobilePostFeed from "@/components/MobilePostFeed";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? "min-h-screen bg-white dark:bg-gray-900" : "min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800"}>
      <div className={isMobile ? "" : "container mx-auto px-4 py-8"}>
        <div className={isMobile ? "" : "max-w-2xl mx-auto"}>
          {isMobile ? <MobilePostFeed /> : <PostFeed />}
        </div>
      </div>
    </div>
  );
};

export default Index;
