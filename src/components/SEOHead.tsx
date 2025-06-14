
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

    // Function to validate if URL is accessible
    const isValidImageUrl = (url: string): boolean => {
      if (!url) return false;
      if (url.includes('placeholder')) return false;
      if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) return false;
      return true;
    };

    // Determine the best image for social sharing with strict priority
    let socialImage = '';
    
    console.log('=== SEO HEAD IMAGE SELECTION DEBUG ===');
    console.log('Raw thumbnailUrl:', thumbnailUrl);
    console.log('Raw image:', image);
    console.log('Raw videoUrl:', videoUrl);
    
    // Priority 1: Use thumbnailUrl if it exists and is valid
    if (thumbnailUrl && isValidImageUrl(thumbnailUrl)) {
      socialImage = thumbnailUrl;
      console.log('✅ Selected: thumbnailUrl ->', socialImage);
    }
    // Priority 2: Use image if it's valid and not a video file
    else if (image && isValidImageUrl(image)) {
      socialImage = image;
      console.log('✅ Selected: image ->', socialImage);
    }
    // Priority 3: Use a high-quality default that social media will accept
    else {
      socialImage = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=630&fit=crop&crop=center';
      console.log('✅ Selected: fallback ->', socialImage);
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
        'meta[property="description"]',
        'meta[name="image"]',
        'meta[property="image"]'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => el.remove());
      });
    };

    // Function to create meta tag
    const createMetaTag = (property: string, content: string, isName = false) => {
      if (!content || content.trim() === '') return;
      
      const meta = document.createElement('meta');
      const attribute = isName ? 'name' : 'property';
      meta.setAttribute(attribute, property);
      meta.content = content.trim();
      document.head.appendChild(meta);
      
      console.log(`✅ Added meta tag: ${attribute}="${property}" content="${content}"`);
    };

    // Remove existing meta tags first
    removeExistingMetaTags();
    console.log('🗑️ Cleared existing meta tags');

    // Add a small delay to ensure DOM is clean
    setTimeout(() => {
      console.log('🔄 Setting new meta tags...');
      
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
        
        // Use video thumbnail if available
        if (thumbnailUrl && isValidImageUrl(thumbnailUrl)) {
          createMetaTag('og:video:thumbnail', makeAbsoluteUrl(thumbnailUrl));
        }
      }

      // Twitter Card meta tags - CRITICAL for Twitter/X
      createMetaTag('twitter:card', type === 'video' ? 'player' : 'summary_large_image', true);
      createMetaTag('twitter:title', title, true);
      createMetaTag('twitter:description', description, true);
      createMetaTag('twitter:image', finalImageUrl, true);
      createMetaTag('twitter:image:alt', title, true);
      createMetaTag('twitter:site', '@ContentCreatorPlatform', true);
      createMetaTag('twitter:creator', '@ContentCreatorPlatform', true);

      // For video tweets
      if (type === 'video' && videoUrl) {
        const absoluteVideoUrl = makeAbsoluteUrl(videoUrl);
        createMetaTag('twitter:player', absoluteVideoUrl, true);
        createMetaTag('twitter:player:width', '1280', true);
        createMetaTag('twitter:player:height', '720', true);
      }

      // Additional meta tags for better social media support
      createMetaTag('image', finalImageUrl, true);
      createMetaTag('thumbnail', finalImageUrl, true);

      // Add structured data for better SEO
      const structuredData = {
        "@context": "https://schema.org",
        "@type": type === 'video' ? 'VideoObject' : 'Article',
        "name": title,
        "description": description,
        "image": finalImageUrl,
        "url": url,
        ...(type === 'video' && videoUrl ? {
          "contentUrl": makeAbsoluteUrl(videoUrl),
          "thumbnailUrl": finalImageUrl,
          "uploadDate": new Date().toISOString()
        } : {})
      };

      // Remove existing structured data
      const existingStructuredData = document.querySelector('script[type="application/ld+json"]');
      if (existingStructuredData) {
        existingStructuredData.remove();
      }

      // Add new structured data
      const scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.textContent = JSON.stringify(structuredData);
      document.head.appendChild(scriptTag);

      console.log('📊 Added structured data:', structuredData);

      // Log final verification
      console.log('=== FINAL META TAGS VERIFICATION ===');
      console.log('og:image:', document.querySelector('meta[property="og:image"]')?.getAttribute('content'));
      console.log('og:image:secure_url:', document.querySelector('meta[property="og:image:secure_url"]')?.getAttribute('content'));
      console.log('twitter:image:', document.querySelector('meta[name="twitter:image"]')?.getAttribute('content'));
      console.log('twitter:card:', document.querySelector('meta[name="twitter:card"]')?.getAttribute('content'));
      
      // Force a refresh in development to help with testing
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('lovable')) {
        console.log('🔄 Development mode - meta tags updated. You may need to clear social media cache.');
        console.log('🔗 Test your links here:');
        console.log('   - Twitter: https://cards-dev.twitter.com/validator');
        console.log('   - Facebook: https://developers.facebook.com/tools/debug/');
        console.log('   - LinkedIn: https://www.linkedin.com/post-inspector/');
      }
    }, 100);

    // Cleanup function
    return () => {
      document.title = "Content Creator Platform";
    };
  }, [title, description, image, url, type, videoUrl, thumbnailUrl]);

  return null;
};

export default SEOHead;
