
import { useEffect } from 'react';

interface MetaTagInjectorProps {
  title: string;
  description: string;
  imageUrl: string;
  pageUrl: string;
  contentType?: string;
}

const MetaTagInjector = ({ 
  title, 
  description, 
  imageUrl, 
  pageUrl, 
  contentType = 'website' 
}: MetaTagInjectorProps) => {
  useEffect(() => {
    // Ensure we have absolute URLs
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : `${window.location.origin}${imageUrl}`;
    
    const absolutePageUrl = pageUrl.startsWith('http') 
      ? pageUrl 
      : `${window.location.origin}${pageUrl}`;

    // Add cache busting parameter
    const finalImageUrl = `${absoluteImageUrl}${absoluteImageUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;

    console.log('MetaTagInjector - Setting image URL:', finalImageUrl);

    // Update document title
    document.title = title;

    // Clear existing meta tags
    const existingMetas = document.querySelectorAll(
      'meta[property^="og:"], meta[name^="twitter:"], meta[name="description"]'
    );
    existingMetas.forEach(meta => meta.remove());

    // Create meta tags array
    const metaTags = [
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: finalImageUrl },
      { property: 'og:image:secure_url', content: finalImageUrl },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:url', content: absolutePageUrl },
      { property: 'og:type', content: contentType === 'video' ? 'video.other' : 'article' },
      { property: 'og:site_name', content: 'Content Creator Platform' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: finalImageUrl },
      { name: 'twitter:site', content: '@ContentCreator' },
      { name: 'description', content: description }
    ];

    // Add meta tags to head
    metaTags.forEach(({ property, name, content }) => {
      const meta = document.createElement('meta');
      if (property) meta.setAttribute('property', property);
      if (name) meta.setAttribute('name', name);
      meta.content = content;
      document.head.appendChild(meta);
    });

    // Add structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) existingScript.remove();

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

    // Force social media crawler refresh
    setTimeout(() => {
      const urls = [
        `https://graph.facebook.com/?id=${encodeURIComponent(absolutePageUrl)}&scrape=true`,
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absolutePageUrl)}`
      ];

      urls.forEach(url => {
        fetch(url, { mode: 'no-cors' }).catch(() => {});
      });
    }, 1000);

    console.log('MetaTagInjector - Meta tags set successfully');
  }, [title, description, imageUrl, pageUrl, contentType]);

  return null;
};

export default MetaTagInjector;
