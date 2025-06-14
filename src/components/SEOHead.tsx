
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

    // Function to ensure URL is absolute
    const makeAbsoluteUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // Handle relative URLs
      if (url.startsWith('/')) {
        return `${window.location.origin}${url}`;
      }
      return `${window.location.origin}/${url}`;
    };

    // Determine the best image to use for social sharing
    let shareImage = image;
    
    // Priority 1: Use thumbnail URL if available (best for social media)
    if (thumbnailUrl) {
      shareImage = thumbnailUrl;
    }
    // Priority 2: For video content without thumbnails, check if image is actually a video file
    else if (image && (image.includes('.mp4') || image.includes('.webm') || image.includes('.mov'))) {
      // For video files without thumbnails, use a placeholder
      shareImage = "/placeholder.svg";
    }
    // Priority 3: Use the provided image (could be image content or fallback)
    else {
      shareImage = image;
    }
    
    // Ensure the image URL is absolute for social media
    const absoluteShareImage = makeAbsoluteUrl(shareImage);
    const absoluteVideoUrl = videoUrl ? makeAbsoluteUrl(videoUrl) : '';

    console.log('SEO Head - Final share image:', absoluteShareImage);
    console.log('SEO Head - Thumbnail URL:', thumbnailUrl);
    console.log('SEO Head - Original image:', image);
    console.log('SEO Head - Video URL:', absoluteVideoUrl);

    // Clear existing meta tags to avoid conflicts
    const existingMetas = [
      'og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 
      'og:image:alt', 'og:url', 'og:type', 'og:site_name', 'og:video', 'og:video:type',
      'og:video:width', 'og:video:height', 'twitter:card', 'twitter:title', 
      'twitter:description', 'twitter:image', 'twitter:image:alt', 'description'
    ];
    
    existingMetas.forEach(property => {
      const isName = property === 'description' || property.startsWith('twitter:');
      const attribute = isName ? 'name' : 'property';
      const existing = document.querySelector(`meta[${attribute}="${property}"]`);
      if (existing) {
        existing.remove();
      }
    });

    // Open Graph meta tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', absoluteShareImage);
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:alt', title);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', type);
    updateMetaTag('og:site_name', 'Content Creator Platform');

    // For video content, add video-specific tags
    if (type === 'video' && absoluteVideoUrl) {
      updateMetaTag('og:video', absoluteVideoUrl);
      updateMetaTag('og:video:type', 'video/mp4');
      updateMetaTag('og:video:width', '1280');
      updateMetaTag('og:video:height', '720');
    }

    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image', true);
    updateMetaTag('twitter:title', title, true);
    updateMetaTag('twitter:description', description, true);
    updateMetaTag('twitter:image', absoluteShareImage, true);
    updateMetaTag('twitter:image:alt', title, true);

    // General meta tags
    updateMetaTag('description', description, true);

    // Log final meta tags for debugging
    console.log('Final meta tags set:');
    console.log('og:image:', document.querySelector('meta[property="og:image"]')?.getAttribute('content'));
    console.log('twitter:image:', document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'));

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = "Content Creator Platform";
    };
  }, [title, description, image, url, type, videoUrl, thumbnailUrl]);

  return null; // This component doesn't render anything visible
};

export default SEOHead;
