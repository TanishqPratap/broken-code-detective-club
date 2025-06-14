
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

    // Clean and validate URLs
    const cleanUrl = (url: string): string => {
      if (!url) return '';
      
      // Remove any query parameters that might interfere
      const cleanedUrl = url.split('?')[0];
      
      // Ensure absolute URL
      if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
        return cleanedUrl;
      }
      
      const baseUrl = window.location.origin;
      return cleanedUrl.startsWith('/') ? `${baseUrl}${cleanedUrl}` : `${baseUrl}/${cleanedUrl}`;
    };

    // Determine the best image with strict priority
    let finalImage = '';
    
    console.log('=== SEO Image Selection Debug ===');
    console.log('thumbnailUrl:', thumbnailUrl);
    console.log('image:', image);
    console.log('videoUrl:', videoUrl);
    
    // Priority 1: thumbnailUrl (generated thumbnail)
    if (thumbnailUrl && !thumbnailUrl.includes('placeholder')) {
      finalImage = cleanUrl(thumbnailUrl);
      console.log('✅ Using thumbnailUrl:', finalImage);
    }
    // Priority 2: image (if not video and not placeholder)
    else if (image && !image.includes('placeholder') && !image.includes('.mp4') && !image.includes('.webm')) {
      finalImage = cleanUrl(image);
      console.log('✅ Using image:', finalImage);
    }
    // Priority 3: High-quality fallback
    else {
      finalImage = 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=630&fit=crop&crop=center&auto=format&q=80';
      console.log('✅ Using fallback:', finalImage);
    }

    // Remove ALL existing meta tags first
    const removeMetaTags = () => {
      const selectors = [
        'meta[property^="og:"]',
        'meta[name^="twitter:"]',
        'meta[name="description"]',
        'meta[property="description"]',
        'meta[name="image"]',
        'meta[property="image"]',
        'link[rel="image_src"]'
      ];
      
      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => el.remove());
      });
    };

    // Create meta tag helper
    const setMetaTag = (tagType: 'property' | 'name', tagName: string, content: string) => {
      if (!content?.trim()) return;
      
      const meta = document.createElement('meta');
      meta.setAttribute(tagType, tagName);
      meta.content = content.trim();
      document.head.appendChild(meta);
      console.log(`Added: ${tagType}="${tagName}" content="${content}"`);
    };

    // Clear existing tags
    removeMetaTags();
    console.log('🗑️ Cleared all existing meta tags');

    // Add canonical link
    let existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = url;
    document.head.appendChild(canonical);

    // Set new meta tags with delay to ensure clean DOM
    setTimeout(() => {
      console.log('🔄 Setting new meta tags...');
      
      // Basic meta
      setMetaTag('name', 'description', description);
      
      // Open Graph - Essential for Facebook, WhatsApp, LinkedIn
      setMetaTag('property', 'og:type', type);
      setMetaTag('property', 'og:title', title);
      setMetaTag('property', 'og:description', description);
      setMetaTag('property', 'og:url', url);
      setMetaTag('property', 'og:site_name', 'Content Creator Platform');
      
      // Image meta tags - CRITICAL
      setMetaTag('property', 'og:image', finalImage);
      setMetaTag('property', 'og:image:secure_url', finalImage);
      setMetaTag('property', 'og:image:type', 'image/jpeg');
      setMetaTag('property', 'og:image:width', '1200');
      setMetaTag('property', 'og:image:height', '630');
      setMetaTag('property', 'og:image:alt', title);
      
      // Video specific tags
      if (type === 'video' && videoUrl) {
        const cleanVideoUrl = cleanUrl(videoUrl);
        setMetaTag('property', 'og:video', cleanVideoUrl);
        setMetaTag('property', 'og:video:secure_url', cleanVideoUrl);
        setMetaTag('property', 'og:video:type', 'video/mp4');
        setMetaTag('property', 'og:video:width', '1280');
        setMetaTag('property', 'og:video:height', '720');
      }
      
      // Twitter Cards - Essential for Twitter/X
      setMetaTag('name', 'twitter:card', type === 'video' ? 'summary_large_image' : 'summary_large_image');
      setMetaTag('name', 'twitter:site', '@ContentCreator');
      setMetaTag('name', 'twitter:creator', '@ContentCreator');
      setMetaTag('name', 'twitter:title', title);
      setMetaTag('name', 'twitter:description', description);
      setMetaTag('name', 'twitter:image', finalImage);
      setMetaTag('name', 'twitter:image:alt', title);
      
      // Additional image references
      setMetaTag('name', 'image', finalImage);
      setMetaTag('property', 'image', finalImage);
      
      // Add link tag for image_src (legacy support)
      const imageSrc = document.createElement('link');
      imageSrc.rel = 'image_src';
      imageSrc.href = finalImage;
      document.head.appendChild(imageSrc);
      
      // Structured data for rich snippets
      const removeExistingLD = () => {
        document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
      };
      removeExistingLD();
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": type === 'video' ? 'VideoObject' : 'Article',
        "headline": title,
        "description": description,
        "image": [finalImage],
        "url": url,
        "publisher": {
          "@type": "Organization",
          "name": "Content Creator Platform",
          "logo": {
            "@type": "ImageObject",
            "url": `${window.location.origin}/favicon.ico`
          }
        },
        ...(type === 'video' && videoUrl ? {
          "contentUrl": cleanUrl(videoUrl),
          "thumbnailUrl": finalImage,
          "uploadDate": new Date().toISOString()
        } : {})
      };
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
      
      console.log('📊 Added structured data');
      console.log('🔍 Final image being used:', finalImage);
      
      // Force cache refresh for social media crawlers
      if (window.location.hostname.includes('lovable') || window.location.hostname === 'localhost') {
        console.log('🔄 Development environment detected');
        console.log('📋 Test URLs:');
        console.log('   Twitter: https://cards-dev.twitter.com/validator');
        console.log('   Facebook: https://developers.facebook.com/tools/debug/');
        console.log('   LinkedIn: https://www.linkedin.com/post-inspector/');
        console.log('   WhatsApp: https://developers.facebook.com/tools/debug/');
      }
      
      // Log final verification
      setTimeout(() => {
        console.log('=== Final Meta Tags Verification ===');
        const ogImage = document.querySelector('meta[property="og:image"]');
        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        const imageSrcLink = document.querySelector('link[rel="image_src"]');
        
        console.log('og:image:', ogImage?.getAttribute('content'));
        console.log('twitter:image:', twitterImage?.getAttribute('content'));
        console.log('image_src:', imageSrcLink?.getAttribute('href'));
        console.log('All meta tags count:', document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]').length);
      }, 500);
      
    }, 150);

    return () => {
      document.title = "Content Creator Platform";
    };
  }, [title, description, image, url, type, videoUrl, thumbnailUrl]);

  return null;
};

export default SEOHead;
