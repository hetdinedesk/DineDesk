import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCMS } from '../../contexts/CMSContext';
import { withSiteParam, getSiteId } from '../../lib/links';
import { Leaf, Instagram, Twitter, Facebook, MapPin, Phone, Mail } from 'lucide-react';

export const Footer = () => {
  const { footerColumns, unassignedFooterLinks, siteConfig, locations, restaurant, rawData, social } = useCMS();
  const router = useRouter();
  const siteId = getSiteId(router) || rawData?.client?.id || '';

  const primaryLocation = (locations || []).find((loc) => loc.isPrimary && loc.isActive) || (locations || [])[0];
  const isDark = siteConfig?.theme?.footerStyle === 'dark';

  // Choose logo based on theme
  const logo = isDark ? restaurant?.branding?.logoDark : restaurant?.branding?.logoLight;
  const fallbackLogo = restaurant?.branding?.logo;
  const displayLogo = logo || fallbackLogo;

  // Use only CMS-configured footer columns
  const allColumns = (footerColumns || [])
    .filter(col => col.isActive !== false && (col.links || []).length > 0);

  // Get social links from CMS
  const socialLinks = {
    instagram: social?.instagram,
    twitter: social?.twitter,
    facebook: social?.facebook
  };

  return (
    <footer className="bg-[var(--color-secondary)] text-[var(--color-accent)] pt-32 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
          {/* Column 1: Brand */}
          <div className="space-y-10">
            <Link href={withSiteParam('/', siteId)} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] rounded-full">
                {displayLogo ? (
                  <img src={displayLogo} alt={restaurant?.name || 'Restaurant'} className="w-6 h-6 object-contain" />
                ) : (
                  <Leaf width={24} height={24} strokeWidth={1.5} />
                )}
              </div>
              {restaurant?.name && (
                <span className="font-serif text-3xl font-light tracking-tight">
                  {restaurant.name}
                </span>
              )}
            </Link>
            {siteConfig?.tagline && (
              <p className="text-[var(--color-accent)]/40 font-sans text-xs leading-loose tracking-[0.1em] uppercase max-w-xs">
                {siteConfig.tagline}
              </p>
            )}
            <div className="flex gap-6">
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[var(--color-accent)]/10 flex items-center justify-center rounded-full hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-700 group">
                  <Instagram width={18} height={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[var(--color-accent)]/10 flex items-center justify-center rounded-full hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-700 group">
                  <Twitter width={18} height={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-[var(--color-accent)]/10 flex items-center justify-center rounded-full hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all duration-700 group">
                  <Facebook width={18} height={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            {allColumns[0]?.title && (
              <h4 className="font-serif italic text-2xl mb-10 text-[var(--color-primary)] tracking-tight">
                {allColumns[0].title}
              </h4>
            )}
            <ul className="space-y-6 font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-accent)]/40">
              {allColumns.length > 0 && allColumns[0]?.links?.map((link, index) => (
                <li key={index}>
                  <Link href={withSiteParam(link.url || '#', siteId)} className="hover:text-[var(--color-primary)] transition-colors duration-500">
                    {link.label}
                  </Link>
                </li>
              ))}
              {unassignedFooterLinks?.map((link, index) => (
                <li key={index}>
                  <Link href={withSiteParam(link.url || '#', siteId)} className="hover:text-[var(--color-primary)] transition-colors duration-500">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Location / Contact */}
          <div>
            {primaryLocation && (
              <h4 className="font-serif italic text-2xl mb-10 text-[var(--color-primary)] tracking-tight">Contact</h4>
            )}
            <ul className="space-y-8 font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[var(--color-accent)]/40">
              {primaryLocation && (
                <>
                  <li className="flex gap-4">
                    <MapPin className="text-[var(--color-primary)] shrink-0" width={16} height={16} strokeWidth={2} />
                    <span>
                      {primaryLocation.address?.street && `${primaryLocation.address.street}, `}
                      {primaryLocation.address?.suburb && `${primaryLocation.address.suburb}, `}
                      {primaryLocation.address?.city && `${primaryLocation.address.city}`}
                    </span>
                  </li>
                  {primaryLocation.phone && (
                    <li className="flex gap-4">
                      <Phone className="text-[var(--color-primary)] shrink-0" width={16} height={16} strokeWidth={2} />
                      <a href={`tel:${primaryLocation.phone}`} className="hover:text-[var(--color-primary)] transition-colors">
                        {primaryLocation.phone}
                      </a>
                    </li>
                  )}
                  {primaryLocation.email && (
                    <li className="flex gap-4">
                      <Mail className="text-[var(--color-primary)] shrink-0" width={16} height={16} strokeWidth={2} />
                      <a href={`mailto:${primaryLocation.email}`} className="hover:text-[var(--color-primary)] transition-colors">
                        {primaryLocation.email}
                      </a>
                    </li>
                  )}
                </>
              )}
            </ul>
          </div>

          {/* Column 4: Additional CMS Column or Newsletter if configured */}
          {allColumns[1] && (
            <div>
              <h4 className="font-serif italic text-2xl mb-10 text-[var(--color-primary)] tracking-tight">{allColumns[1].title}</h4>
              <ul className="space-y-6 font-sans text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--color-accent)]/40">
                {allColumns[1].links?.map((link, index) => (
                  <li key={index}>
                    <Link href={withSiteParam(link.url || '#', siteId)} className="hover:text-[var(--color-primary)] transition-colors duration-500">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-16 border-t border-[var(--color-accent)]/5 flex flex-col md:flex-row justify-between items-center gap-10 text-[9px] font-sans font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]/10">
          <p>&copy; {new Date().getFullYear()} {restaurant?.name || ''}. ALL RIGHTS RESERVED.</p>
          {allColumns[2] && (
            <div className="flex gap-12">
              {allColumns[2].links?.map((link, index) => (
                <Link key={index} href={withSiteParam(link.url || '#', siteId)} className="hover:text-[var(--color-accent)] transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

