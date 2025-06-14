
import { useEffect } from 'react';

interface ThumbnailServiceProps {
  postId?: string;
  trailerId?: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  title: string;
  description: string;
  contentType?: string;
}

const ThumbnailService = ({ 
  postId, 
  trailerId, 
  thumbnailUrl, 
  mediaUrl, 
  title, 
  description, 
  contentType 
}: ThumbnailServiceProps) => {
  useEffect(() => {
    // Create a robust image URL with multiple fallbacks
    const createImageUrl = (): string => {
      const baseUrl = window.location.origin;
      
      // Priority 1: Use thumbnailUrl if available and valid
      if (thumbnailUrl && !thumbnailUrl.includes('placeholder')) {
        return thumbnailUrl.startsWith('http') ? thumbnailUrl : `${baseUrl}${thumbnailUrl}`;
      }
      
      // Priority 2: Use mediaUrl if it's an image
      if (mediaUrl && !mediaUrl.includes('.mp4') && !mediaUrl.includes('.webm')) {
        return mediaUrl.startsWith('http') ? mediaUrl : `${baseUrl}${mediaUrl}`;
      }
      
      // Priority 3: Use a high-quality stock image
      return 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=630&fit=crop&crop=center&auto=format&q=80';
    };

    const imageUrl = createImageUrl();
    const pageUrl = postId 
      ? `${window.location.origin}/posts/${postId}`
      : trailerId 
      ? `${window.location.origin}/trailer/${trailerId}`
      : window.location.href;

    // Force refresh all social media crawlers
    const refreshSocialCrawlers = async () => {
      const urls = [
        `https://graph.facebook.com/?id=${encodeURIComponent(pageUrl)}&scrape=true`,
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`
      ];

      // Attempt to ping these URLs to refresh cache
      urls.forEach(url => {
        fetch(url, { mode: 'no-cors' }).catch(() => {
          // Ignore errors as these are cross-origin requests
        });
      });
    };

    // Add a unique timestamp to force cache busting
    const timestamp = Date.now();
    const imageUrlWithCache = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${timestamp}`;

    // Clear ALL existing meta tags
    document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"], meta[name="description"], link[rel="image_src"]').forEach(el => el.remove());

    // Create meta tags with enhanced data
    const metaTags = [
      // Basic meta
      { type: 'name', name: 'description', content: description },
      
      // Open Graph
      { type: 'property', name: 'og:type', content: contentType === 'video' ? 'video.other' : 'article' },
      { type: 'property', name: 'og:title', content: title },
      { type: 'property', name: 'og:description', content: description },
      { type: 'property', name: 'og:url', content: pageUrl },
      { type: 'property', name: 'og:site_name', content: 'Content Creator Platform' },
      { type: 'property', name: 'og:image', content: imageUrlWithCache },
      { type: 'property', name: 'og:image:secure_url', content: imageUrlWithCache },
      { type: 'property', name: 'og:image:type', content: 'image/jpeg' },
      { type: 'property', name: 'og:image:width', content: '1200' },
      { type: 'property', name: 'og:image:height', content: '630' },
      { type: 'property', name: 'og:image:alt', content: title },
      
      // Twitter
      { type: 'name', name: 'twitter:card', content: 'summary_large_image' },
      { type: 'name', name: 'twitter:site', content: '@ContentCreator' },
      { type: 'name', name: 'twitter:creator', content: '@ContentCreator' },
      { type: 'name', name: 'twitter:title', content: title },
      { type: 'name', name: 'twitter:description', content: description },
      { type: 'name', name: 'twitter:image', content: imageUrlWithCache },
      { type: 'name', name: 'twitter:image:alt', content: title },
      
      // Additional
      { type: 'name', name: 'image', content: imageUrlWithCache },
      { type: 'property', name: 'image', content: imageUrlWithCache }
    ];

    // Add all meta tags
    metaTags.forEach(({ type, name, content }) => {
      const meta = document.createElement('meta');
      meta.setAttribute(type as 'name' | 'property', name);
      meta.content = content;
      document.head.appendChild(meta);
    });

    // Add link tag for image_src
    const linkTag = document.createElement('link');
    linkTag.rel = 'image_src';
    linkTag.href = imageUrlWithCache;
    document.head.appendChild(linkTag);

    // Add structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": contentType === 'video' ? 'VideoObject' : 'Article',
      "headline": title,
      "description": description,
      "image": [imageUrlWithCache],
      "url": pageUrl,
      "thumbnailUrl": imageUrlWithCache,
      "publisher": {
        "@type": "Organization",
        "name": "Content Creator Platform"
      }
    };

    // Remove existing structured data
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    console.log('🚀 ThumbnailService - Final image URL:', imageUrlWithCache);
    console.log('📄 Page URL:', pageUrl);
    
    // Refresh social crawlers after a delay
    setTimeout(refreshSocialCrawlers, 1000);

  }, [postId, trailerId, thumbnailUrl, mediaUrl, title, description, contentType]);

  return null;
};

export default ThumbnailService;
