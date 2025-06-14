
import { useEffect } from 'react';

interface SocialMetaTagsProps {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
  contentType?: 'website' | 'article' | 'video';
}

const SocialMetaTags = ({ 
  title, 
  description, 
  imageUrl, 
  pageUrl, 
  contentType = 'website' 
}: SocialMetaTagsProps) => {
  useEffect(() => {
    // Force absolute URLs
    const baseUrl = window.location.origin;
    const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
    const absolutePageUrl = pageUrl.startsWith('http') ? pageUrl : `${baseUrl}${pageUrl}`;
    
    // Add cache buster
    const timestamp = Date.now();
    const finalImageUrl = `${absoluteImageUrl}${absoluteImageUrl.includes('?') ? '&' : '?'}t=${timestamp}`;

    console.log('SocialMetaTags - Final image URL:', finalImageUrl);

    // Update title immediately
    document.title = title;

    // Function to remove existing meta tags
    const removeExistingMetas = () => {
      const selectors = [
        'meta[property^="og:"]',
        'meta[name^="twitter:"]',
        'meta[name="description"]',
        'meta[property="description"]',
        'link[rel="canonical"]',
        'script[type="application/ld+json"]'
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
    };

    // Function to add meta tag
    const addMeta = (type: 'property' | 'name', key: string, content: string) => {
      const meta = document.createElement('meta');
      meta.setAttribute(type, key);
      meta.content = content;
      document.head.appendChild(meta);
    };

    // Clear existing and add new meta tags
    removeExistingMetas();

    // Basic meta
    addMeta('name', 'description', description);

    // Open Graph Protocol
    addMeta('property', 'og:type', contentType);
    addMeta('property', 'og:title', title);
    addMeta('property', 'og:description', description);
    addMeta('property', 'og:url', absolutePageUrl);
    addMeta('property', 'og:site_name', 'Content Creator Platform');
    addMeta('property', 'og:image', finalImageUrl);
    addMeta('property', 'og:image:secure_url', finalImageUrl);
    addMeta('property', 'og:image:type', 'image/jpeg');
    addMeta('property', 'og:image:width', '1200');
    addMeta('property', 'og:image:height', '630');
    addMeta('property', 'og:image:alt', title);

    // Twitter Card
    addMeta('name', 'twitter:card', 'summary_large_image');
    addMeta('name', 'twitter:title', title);
    addMeta('name', 'twitter:description', description);
    addMeta('name', 'twitter:image', finalImageUrl);
    addMeta('name', 'twitter:image:alt', title);

    // Canonical URL
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = absolutePageUrl;
    document.head.appendChild(canonical);

    // Structured Data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": contentType === 'video' ? 'VideoObject' : 'Article',
      "headline": title,
      "description": description,
      "image": finalImageUrl,
      "url": absolutePageUrl,
      "publisher": {
        "@type": "Organization",
        "name": "Content Creator Platform"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Force refresh social media crawlers
    const refreshCrawlers = async () => {
      const urls = [
        `https://graph.facebook.com/?id=${encodeURIComponent(absolutePageUrl)}&scrape=true`,
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absolutePageUrl)}`
      ];

      for (const url of urls) {
        try {
          await fetch(url, { mode: 'no-cors' });
        } catch (error) {
          // Ignore errors for cross-origin requests
        }
      }
    };

    // Delay crawler refresh
    setTimeout(refreshCrawlers, 2000);

    console.log('SocialMetaTags - Meta tags injected successfully');
    
    return () => {
      document.title = 'Content Creator Platform';
    };
  }, [title, description, imageUrl, pageUrl, contentType]);

  return null;
};

export default SocialMetaTags;
