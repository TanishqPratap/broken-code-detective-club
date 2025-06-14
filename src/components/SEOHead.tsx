
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

    // Function to ensure URL is absolute and properly formatted
    const makeAbsoluteUrl = (url: string) => {
      if (!url) return '';
      
      // If already absolute, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // Handle relative URLs
      const baseUrl = window.location.origin;
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      return `${baseUrl}/${url}`;
    };

    // Determine the best image for social sharing with strict priority
    let socialImage = '';
    
    console.log('=== SEO HEAD IMAGE SELECTION DEBUG ===');
    console.log('Raw thumbnailUrl:', thumbnailUrl);
    console.log('Raw image:', image);
    console.log('Raw videoUrl:', videoUrl);
    
    // Priority 1: Use thumbnailUrl if it exists and is not placeholder
    if (thumbnailUrl && thumbnailUrl.trim() !== '' && !thumbnailUrl.includes('placeholder')) {
      socialImage = thumbnailUrl;
      console.log('Selected: thumbnailUrl ->', socialImage);
    }
    // Priority 2: Use image if it's not a video file and not placeholder
    else if (image && 
             !image.includes('placeholder') && 
             !image.includes('.mp4') && 
             !image.includes('.webm') && 
             !image.includes('.mov')) {
      socialImage = image;
      console.log('Selected: image ->', socialImage);
    }
    // Priority 3: Use a default fallback
    else {
      // Use a proper default image instead of placeholder
      socialImage = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=630&fit=crop';
      console.log('Selected: fallback ->', socialImage);
    }

    // Ensure the final image URL is absolute
    const finalImageUrl = makeAbsoluteUrl(socialImage);
    console.log('Final absolute image URL:', finalImageUrl);

    // Function to remove all existing meta tags
    const removeExistingMetaTags = () => {
      const selectors = [
        'meta[property^="og:"]',
        'meta[name^="twitter:"]',
        'meta[name="description"]',
        'meta[property="description"]'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
    };

    // Function to create meta tag
    const createMetaTag = (property: string, content: string, isName = false) => {
      if (!content) return;
      
      const meta = document.createElement('meta');
      const attribute = isName ? 'name' : 'property';
      meta.setAttribute(attribute, property);
      meta.content = content;
      document.head.appendChild(meta);
    };

    // Remove existing meta tags first
    removeExistingMetaTags();

    // Add a small delay to ensure DOM is clean
    setTimeout(() => {
      // Basic meta tags
      createMetaTag('description', description, true);

      // Open Graph meta tags - CRITICAL for social media
      createMetaTag('og:title', title);
      createMetaTag('og:description', description);
      createMetaTag('og:image', finalImageUrl);
      createMetaTag('og:image:secure_url', finalImageUrl);
      createMetaTag('og:image:width', '1200');
      createMetaTag('og:image:height', '630');
      createMetaTag('og:image:alt', title);
      createMetaTag('og:image:type', 'image/jpeg');
      createMetaTag('og:url', url);
      createMetaTag('og:type', type);
      createMetaTag('og:site_name', 'Content Creator Platform');

      // For video content, add video-specific tags
      if (type === 'video' && videoUrl) {
        const absoluteVideoUrl = makeAbsoluteUrl(videoUrl);
        createMetaTag('og:video', absoluteVideoUrl);
        createMetaTag('og:video:secure_url', absoluteVideoUrl);
        createMetaTag('og:video:type', 'video/mp4');
        createMetaTag('og:video:width', '1280');
        createMetaTag('og:video:height', '720');
      }

      // Twitter Card meta tags - CRITICAL for Twitter/X
      createMetaTag('twitter:card', 'summary_large_image', true);
      createMetaTag('twitter:title', title, true);
      createMetaTag('twitter:description', description, true);
      createMetaTag('twitter:image', finalImageUrl, true);
      createMetaTag('twitter:image:alt', title, true);
      createMetaTag('twitter:site', '@ContentCreatorPlatform', true);
      createMetaTag('twitter:creator', '@ContentCreatorPlatform', true);

      // Additional social media meta tags
      createMetaTag('image', finalImageUrl);
      createMetaTag('thumbnail', finalImageUrl);

      // Log final verification
      console.log('=== FINAL META TAGS VERIFICATION ===');
      console.log('og:image:', document.querySelector('meta[property="og:image"]')?.getAttribute('content'));
      console.log('twitter:image:', document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'));
      console.log('twitter:card:', document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'));
      
      // Force a page refresh for meta tags (if in development)
      if (window.location.hostname === 'localhost') {
        console.log('Development mode - meta tags updated');
      }
    }, 50);

    // Cleanup function
    return () => {
      document.title = "Content Creator Platform";
    };
  }, [title, description, image, url, type, videoUrl, thumbnailUrl]);

  return null;
};

export default SEOHead;
