
import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video' | 'profile';
  videoUrl?: string;
  thumbnailUrl?: string;
}

const SEOHead = ({ 
  title = "Content Creator Platform", 
  description = "Discover amazing content creators and their exclusive content",
  image = "/placeholder.svg",
  url = window.location.href,
  type = "website",
  videoUrl,
  thumbnailUrl
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Function to update or create meta tag
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Determine the best image to use for social sharing
    let shareImage = image;
    
    // If we have a thumbnail URL (generated from video), use it
    if (thumbnailUrl) {
      shareImage = thumbnailUrl;
    } else if (image && (image.includes('.mp4') || image.includes('.webm') || image.includes('.mov'))) {
      // For video files without thumbnails, use a placeholder
      shareImage = "/placeholder.svg";
    }
    
    // Ensure the image URL is absolute
    if (shareImage && !shareImage.startsWith('http')) {
      shareImage = `${window.location.origin}${shareImage}`;
    }

    // Open Graph meta tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', shareImage);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:alt', title);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', type);
    updateMetaTag('og:site_name', 'Content Creator Platform');

    // For video content, add video-specific tags
    if (type === 'video' && videoUrl) {
      updateMetaTag('og:video', videoUrl);
      updateMetaTag('og:video:type', 'video/mp4');
    }

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', shareImage, true);
    updateMetaTag('twitter:image:alt', title, true);

    // General meta tags
    updateMetaTag('description', description, true);

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = "Content Creator Platform";
    };
  }, [title, description, image, url, type, videoUrl, thumbnailUrl]);

  return null; // This component doesn't render anything visible
};

export default SEOHead;
