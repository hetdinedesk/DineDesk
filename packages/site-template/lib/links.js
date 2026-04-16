import { useRouter } from 'next/router';

/**
 * Get the site ID from the current URL or environment
 */
export const getSiteId = (router) => {
  return router.query.site || process.env.SITE_ID || '';
};

/**
 * Append site ID query parameter to internal URLs
 * @param {string} url - The URL to modify
 * @param {string} siteId - The site ID to append
 * @returns {string} The URL with site ID appended
 */
export const withSiteParam = (url, siteId) => {
  if (!url || url === '#') return url;
  if (!siteId) return url;
  
  // Skip external links
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }
  
  // If URL already has query params, append with &
  if (url.includes('?')) {
    return url.includes('site=') ? url : `${url}&site=${siteId}`;
  }
  
  return `${url}?site=${siteId}`;
};

/**
 * Custom Link component that preserves site ID
 */
import Link from 'next/link';
import { useCMS } from '../contexts/CMSContext';

export const SiteLink = ({ href, children, ...props }) => {
  const router = useRouter();
  const { rawData } = useCMS();
  const siteId = getSiteId(router) || rawData?.client?.id || '';
  
  const finalHref = withSiteParam(href, siteId);
  
  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  );
};
