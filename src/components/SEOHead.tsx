
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

    // Function to ensure URL is absolute and accessible
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

    // Determine the best image to use for social sharing with priority order
    let shareImage = '';
    
    // Priority 1: Use thumbnail URL if available (best for social media)
    if (thumbnailUrl && thumbnailUrl !== '/placeholder.svg') {
      shareImage = thumbnailUrl;
      console.log('Using thumbnail URL for social sharing:', thumbnailUrl);
    }
    // Priority 2: For non-video content, use the provided image
    else if (image && image !== '/placeholder.svg' && !image.includes('.mp4') && !image.includes('.webm') && !image.includes('.mov')) {
      shareImage = image;
      console.log('Using image URL for social sharing:', image);
    }
    // Priority 3: Fallback to placeholder
    else {
      shareImage = '/placeholder.svg';
      console.log('Using placeholder for social sharing');
    }
    
    // Ensure the image URL is absolute for social media
    const absoluteShareImage = makeAbsoluteUrl(shareImage);
    const absoluteVideoUrl = videoUrl ? makeAbsoluteUrl(videoUrl) : '';

    console.log('SEO Head - Final absolute share image:', absoluteShareImage);
    console.log('SEO Head - Thumbnail URL provided:', thumbnailUrl);
    console.log('SEO Head - Original image provided:', image);
    console.log('SEO Head - Video URL:', absoluteVideoUrl);

    // Clear ALL existing meta tags to avoid conflicts
    const metaSelectors = [
      'meta[property^="og:"]',
      'meta[name^="twitter:"]',
      'meta[name="description"]'
    ];
    
    metaSelectors.forEach(selector => {
      const existingMetas = document.querySelectorAll(selector);
      existingMetas.forEach(meta => meta.remove());
    });

    // Wait a tiny bit for DOM cleanup
    setTimeout(() => {
      // Open Graph meta tags
      updateMetaTag('og:title', title);
      updateMetaTag('og:description', description);
      updateMetaTag('og:image', absoluteShareImage);
      updateMetaTag('og:image:secure_url', absoluteShareImage);
      updateMetaTag('og:image:width', '1200');
      updateMetaTag('og:image:height', '630');
      updateMetaTag('og:image:alt', title);
      updateMetaTag('og:image:type', 'image/jpeg');
      updateMetaTag('og:url', url);
      updateMetaTag('og:type', type);
      updateMetaTag('og:site_name', 'Content Creator Platform');

      // For video content, add video-specific tags
      if (type === 'video' && absoluteVideoUrl) {
        updateMetaTag('og:video', absoluteVideoUrl);
        updateMetaTag('og:video:secure_url', absoluteVideoUrl);
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
      console.log('=== FINAL META TAGS DEBUG ===');
      console.log('og:image:', document.querySelector('meta[property="og:image"]')?.getAttribute('content'));
      console.log('og:image:secure_url:', document.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content'));
      console.log('twitter:image:', document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'));
      console.log('twitter:card:', document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'));
      console.log('=== END DEBUG ===');
    }, 10);

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      document.title = "Content Creator Platform";
    };
  }, [title, description, image, url, type, videoUrl, thumbnailUrl]);

  return null; // This component doesn't render anything visible
};

export default SEOHead;
