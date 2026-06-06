import { useState } from 'react'
import { generateOnboardingPDF } from './generatePDF'
import {
  Building2, User, MapPin, Palette, ShoppingCart, CreditCard,
  Calendar, FileCheck, ChevronRight, ChevronLeft, Check, Download,
  Plus, Trash2, AlertCircle, Monitor, Layout, Star, Image,
  FileSpreadsheet, BookOpen, Sparkles, Globe
} from 'lucide-react'

const STEPS = [
  { id: 1,  label: 'Business',  Icon: Building2 },
  { id: 2,  label: 'Contact',   Icon: User },
  { id: 3,  label: 'Locations', Icon: MapPin },
  { id: 4,  label: 'Branding',  Icon: Palette },
  { id: 5,  label: 'Theme',     Icon: Monitor },
  { id: 6,  label: 'Header',    Icon: Layout },
  { id: 7,  label: 'Pages',     Icon: Globe },
  { id: 8,  label: 'Homepage',  Icon: BookOpen },
  { id: 9,  label: 'Menu',      Icon: FileSpreadsheet },
  { id: 10, label: 'Specials',  Icon: Sparkles },
  { id: 11, label: 'Assets',    Icon: Image },
  { id: 12, label: 'Services',  Icon: ShoppingCart },
  { id: 13, label: 'POS',       Icon: CreditCard },
  { id: 14, label: 'Timeline',  Icon: Calendar },
  { id: 15, label: 'Sign Off',  Icon: FileCheck },
]

const INITIAL = {
  // Step 1
  businessName: '', tradingName: '', abn: '', acn: '',
  businessType: '', cuisineType: '', businessAddress: '',
  // Step 2
  contactName: '', contactRole: '', contactEmail: '', contactPhone: '',
  contactPreference: '',
  // Step 3
  locations: [{ name: '', address: '', suburb: '', state: '', phone: '' }],
  // Step 4
  currentWebsite: '', preferredDomain: '',
  brandColorPrimary: '#f97316', brandColorSecondary: '#0f172a',
  logoProvided: '', logoFormat: '', brandNotes: '',
  // Step 5 — Theme
  theme: '',
  // Step 6 — Header
  headerType: 'standard-full',
  headerTheme: 'not-set',
  utilityBelt: true,
  utilityItems: { 'contact-info': true, 'social-links': true, reviews: true, 'header-ctas': true },
  headerCtas: [],
  // Step 7 — Pages
  pages: {
    home: true, menu: true, contact: true, about: false,
    team: false, locations: false, specials: false, gallery: false,
    privacyPolicy: true, terms: true,
  },
  extraPages: [],
  // Step 8 — Homepage layout
  homepageLayout: {
    welcome: true, banners: true, promos: false, specials: false,
    featured: false, loyalty: false, reviews: true, custom: false,
  },
  reviewsPlaceId: '', reviewsSource: 'google',
  // Step 9 — Menu
  menuUploadType: '', menuNotes: '',
  menuCategoryCount: '', menuItemCount: '', menuHasSizes: '', menuHasAddons: '',
  // Step 10 — Specials
  specials: [],
  // Step 11 — Assets
  assetNotes: '',
  hasLogo: '', hasBannerImages: '', hasMenuImages: '', hasGalleryImages: '',
  assetDeliveryMethod: '',
  // Step 12
  services: {
    onlineOrdering: false, reservations: false, menuDisplay: true,
    loyalty: false, pos: false, multiLocation: false,
    specials: false, giftVouchers: false
  },
  // Step 13
  posSystem: '', posVersion: '', paymentProvider: '',
  acceptsOnlinePayment: '', posNotes: '',
  // Step 14
  goLiveDate: '', plan: '', referredBy: '', hearAboutUs: '', additionalNotes: '',
  // Step 15
  signedByName: '', signatureConsent: false, termsRead: false,
}

function Label({ children, required }) {
  return (
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Field({ label, required, children }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
    </div>
  )
}

function Inp({ label, required, value, onChange, placeholder, type = 'text', hint }) {
  return (
    <Field label={label} required={required}>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className="w-full" />
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </Field>
  )
}

function Sel({ label, required, value, onChange, options }) {
  return (
    <Field label={label} required={required}>
      <select value={value || ''} onChange={e => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  )
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <Field label={label}>
      <textarea value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows} className="w-full resize-none" />
    </Field>
  )
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-orange-500' : 'bg-slate-200'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
      <div>
        <div className="text-sm font-600 text-slate-800 font-medium">{label}</div>
        {desc && <div className="text-xs text-slate-400">{desc}</div>}
      </div>
    </label>
  )
}

// ── STEP COMPONENTS ──────────────────────────────────────────────────────────

function Step1({ d, u }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Inp label="Restaurant / Business Name" required value={d.businessName} onChange={v => u('businessName', v)} placeholder="e.g. Urban Eats" />
        <Inp label="Trading Name (if different)" value={d.tradingName} onChange={v => u('tradingName', v)} placeholder="Optional" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Inp label="ABN" value={d.abn} onChange={v => u('abn', v)} placeholder="XX XXX XXX XXX" hint="Australian Business Number" />
        <Inp label="ACN" value={d.acn} onChange={v => u('acn', v)} placeholder="XXX XXX XXX" hint="Australian Company Number (if applicable)" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sel label="Business Type" required value={d.businessType} onChange={v => u('businessType', v)}
          options={['Restaurant', 'Café', 'Bar & Grill', 'Bakery', 'Food Truck', 'Fast Casual', 'Fine Dining', 'Takeaway', 'Club / Pub', 'Other']} />
        <Inp label="Cuisine Type" value={d.cuisineType} onChange={v => u('cuisineType', v)} placeholder="e.g. Italian, Asian Fusion..." />
      </div>
      <Inp label="Registered Business Address" required value={d.businessAddress} onChange={v => u('businessAddress', v)} placeholder="Street, Suburb, State, Postcode" />
    </div>
  )
}

function Step2({ d, u }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Inp label="Full Name" required value={d.contactName} onChange={v => u('contactName', v)} placeholder="Jane Smith" />
        <Inp label="Role / Title" value={d.contactRole} onChange={v => u('contactRole', v)} placeholder="Owner / Manager / Director" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Inp label="Email Address" required type="email" value={d.contactEmail} onChange={v => u('contactEmail', v)} placeholder="jane@yourbusiness.com.au" />
        <Inp label="Mobile / Phone" required type="tel" value={d.contactPhone} onChange={v => u('contactPhone', v)} placeholder="04XX XXX XXX" />
      </div>
      <Sel label="Preferred Contact Method" value={d.contactPreference} onChange={v => u('contactPreference', v)}
        options={['Email', 'Phone Call', 'SMS', 'WhatsApp']} />
    </div>
  )
}

function Step3({ d, u }) {
  const updateLoc = (i, key, val) => {
    const updated = d.locations.map((l, idx) => idx === i ? { ...l, [key]: val } : l)
    u('locations', updated)
  }
  const addLoc = () => u('locations', [...d.locations, { name: '', address: '', suburb: '', state: '', phone: '' }])
  const removeLoc = i => u('locations', d.locations.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Add each restaurant location. At least one is required.</p>
      {d.locations.map((loc, i) => (
        <div key={i} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location {i + 1}</span>
            {d.locations.length > 1 && (
              <button onClick={() => removeLoc(i)} className="text-red-400 hover:text-red-600 transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Inp label="Location Name" required value={loc.name} onChange={v => updateLoc(i, 'name', v)} placeholder="Main Branch / CBD / South" />
            <Inp label="Phone" value={loc.phone} onChange={v => updateLoc(i, 'phone', v)} placeholder="03 XXXX XXXX" />
          </div>
          <Inp label="Street Address" required value={loc.address} onChange={v => updateLoc(i, 'address', v)} placeholder="123 Example St" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Inp label="Suburb" value={loc.suburb} onChange={v => updateLoc(i, 'suburb', v)} placeholder="Suburb" />
            <Sel label="State" value={loc.state} onChange={v => updateLoc(i, 'state', v)}
              options={['ACT','NSW','NT','QLD','SA','TAS','VIC','WA']} />
          </div>
        </div>
      ))}
      <button onClick={addLoc}
        className="flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-700 transition-colors">
        <Plus size={15} /> Add Another Location
      </button>
    </div>
  )
}

function Step4({ d, u }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Inp label="Current Website" value={d.currentWebsite} onChange={v => u('currentWebsite', v)} placeholder="https://yoursite.com.au" />
        <Inp label="Preferred Domain / Subdomain" value={d.preferredDomain} onChange={v => u('preferredDomain', v)} placeholder="yourrestaurant.com.au" hint="We'll check availability" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Primary Brand Colour</Label>
          <div className="flex items-center gap-3">
            <input type="color" value={d.brandColorPrimary} onChange={e => u('brandColorPrimary', e.target.value)}
              className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5" />
            <input value={d.brandColorPrimary} onChange={e => u('brandColorPrimary', e.target.value)}
              placeholder="#f97316" className="flex-1" />
          </div>
        </div>
        <div>
          <Label>Secondary Brand Colour</Label>
          <div className="flex items-center gap-3">
            <input type="color" value={d.brandColorSecondary} onChange={e => u('brandColorSecondary', e.target.value)}
              className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5" />
            <input value={d.brandColorSecondary} onChange={e => u('brandColorSecondary', e.target.value)}
              placeholder="#0f172a" className="flex-1" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sel label="Do you have a logo?" value={d.logoProvided} onChange={v => u('logoProvided', v)}
          options={['Yes — ready to send', 'Yes — needs redesign', 'No — need one created', 'No — use text only']} />
        <Sel label="Logo File Format (if applicable)" value={d.logoFormat} onChange={v => u('logoFormat', v)}
          options={['PNG', 'SVG', 'AI / EPS', 'PDF', 'JPEG', 'Not sure']} />
      </div>
      <Textarea label="Brand Notes / Style Guide / Inspiration" value={d.brandNotes} onChange={v => u('brandNotes', v)}
        placeholder="Describe your style, any competitor sites you like, fonts, etc." />
    </div>
  )
}

// ─── NEW STEPS 5–11 ────────────────────────────────────────────────────────

const THEMES = [
  {
    key: 'theme-d1', label: 'D1',
    desc: 'Clean, modern layout with strong imagery and clear CTAs.',
    features: ['Utility belt', 'Dynamic sections', 'Reviews carousel', 'Responsive header'],
    preview: '🍽️',
  },
  {
    key: 'theme-d2', label: 'D2',
    desc: 'Warm, elegant layout with rounded corners and serif typography.',
    features: ['Utility belt', 'Banner carousel', 'Promo tiles', 'Reviews carousel', 'Rounded corners'],
    preview: '☕',
  },
  {
    key: 'theme-d3', label: 'D3',
    desc: 'Bold, alternative layout with a distinctive style.',
    features: ['Utility belt', 'Banner carousel', 'Promo tiles', 'Reviews carousel'],
    preview: '🥐',
  },
]

const HEADER_TYPES = [
  { key: 'standard-full', label: 'Standard Full',  desc: 'Logo left · Nav centre · CTA right' },
  { key: 'sticky',        label: 'Sticky',         desc: 'Stays fixed at top while scrolling' },
  { key: 'minimal',       label: 'Minimal',        desc: 'Logo + hamburger menu only' },
  { key: 'split',         label: 'Split',          desc: 'Logo centre · Nav split left & right' },
]

const UTILITY_ITEMS = [
  { key: 'contact-info', label: 'Contact Info',  desc: 'Phone, address & hours' },
  { key: 'social-links', label: 'Social Links',  desc: 'Facebook, Instagram, etc.' },
  { key: 'reviews',      label: 'Star Rating',   desc: 'Google review count & stars' },
  { key: 'header-ctas',  label: 'Header CTAs',   desc: 'Custom call-to-action buttons' },
]

const PAGE_OPTIONS = [
  { key: 'home',          label: 'Home',           desc: 'Main landing page', locked: true },
  { key: 'menu',          label: 'Menu',           desc: 'Full menu listing' },
  { key: 'contact',       label: 'Contact Us',     desc: 'Contact form & map' },
  { key: 'about',         label: 'About Us',       desc: 'Story, history, values' },
  { key: 'team',          label: 'Meet the Team',  desc: 'Staff profiles' },
  { key: 'locations',     label: 'Locations',      desc: 'Multi-venue page' },
  { key: 'specials',      label: 'Specials',       desc: 'Current offers & deals' },
  { key: 'gallery',       label: 'Gallery',        desc: 'Photo gallery page' },
  { key: 'privacyPolicy', label: 'Privacy Policy', desc: 'Legal requirement', locked: true },
  { key: 'terms',         label: 'Terms of Use',   desc: 'Legal requirement', locked: true },
]

const HOMEPAGE_SECTIONS = [
  { key: 'banners',  label: 'Hero Banners',    desc: 'Rotating hero image carousel at the top' },
  { key: 'welcome',  label: 'Welcome Section', desc: 'Intro text + image block' },
  { key: 'promos',   label: 'Promo Tiles',     desc: 'Promotional tile grid (deals, categories)' },
  { key: 'specials', label: 'Specials',        desc: 'Current specials & limited offers' },
  { key: 'featured', label: 'Featured Items',  desc: 'Highlighted menu items' },
  { key: 'loyalty',  label: 'Loyalty Banner',  desc: 'Loyalty program callout' },
  { key: 'reviews',  label: 'Reviews',         desc: 'Google reviews carousel' },
  { key: 'custom',   label: 'Custom Block',    desc: 'Free-text / HTML content block' },
]

function Step5({ d, u }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Choose the design theme that best fits your restaurant's style. We'll apply your brand colours on top.</p>
      <div className="space-y-3">
        {THEMES.map(t => {
          const active = d.theme === t.key
          return (
            <button key={t.key} onClick={() => u('theme', t.key)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                active ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-300'
              }`}>
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">{t.preview}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-sm font-bold ${ active ? 'text-orange-600' : 'text-slate-800'}`}>{t.label}</span>
                    {active && <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded">SELECTED</span>}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{t.desc}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.features.map(f => (
                      <span key={f} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {!d.theme && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">Please select a theme to continue.</p>
      )}
    </div>
  )
}

function Step6({ d, u }) {
  const toggleUtil = key => u('utilityItems', { ...d.utilityItems, [key]: !d.utilityItems[key] })
  const addCta = () => u('headerCtas', [...(d.headerCtas || []), { label: '', url: '', variant: 'primary' }])
  const updateCta = (i, field, val) => u('headerCtas', d.headerCtas.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  const removeCta = i => u('headerCtas', d.headerCtas.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-5">
      <div>
        <Label>Header Layout Type</Label>
        <div className="grid grid-cols-2 gap-3">
          {HEADER_TYPES.map(ht => {
            const active = d.headerType === ht.key
            return (
              <button key={ht.key} onClick={() => u('headerType', ht.key)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${
                  active ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-orange-300'
                }`}>
                <div className={`text-sm font-bold mb-0.5 ${ active ? 'text-orange-600' : 'text-slate-800'}`}>{ht.label}</div>
                <div className="text-xs text-slate-400">{ht.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <Label>Header Colour Mode</Label>
        <div className="flex gap-3">
          {['not-set', 'light', 'dark'].map(k => (
            <button key={k} onClick={() => u('headerTheme', k)}
              className={`px-5 py-2 rounded-lg border-2 text-sm font-semibold capitalize transition-all ${
                d.headerTheme === k ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-600'
              }`}>
              {k === 'not-set' ? 'Default' : k}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">"Default" inherits from your selected theme.</p>
      </div>

      <div className="p-4 border border-slate-200 rounded-xl bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-slate-800">Utility Belt</div>
            <div className="text-xs text-slate-400">Top bar above the header — shows contact info, socials, reviews</div>
          </div>
          <div onClick={() => u('utilityBelt', !d.utilityBelt)}
            className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors flex-shrink-0 ${ d.utilityBelt ? 'bg-orange-500' : 'bg-slate-200'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${ d.utilityBelt ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
        </div>
        {d.utilityBelt && (
          <div className="grid grid-cols-2 gap-2">
            {UTILITY_ITEMS.map(item => (
              <label key={item.key} className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-white transition-colors">
                <input type="checkbox" checked={!!d.utilityItems[item.key]}
                  onChange={() => toggleUtil(item.key)} className="w-4 h-4 accent-orange-500" />
                <div>
                  <div className="text-xs font-semibold text-slate-700">{item.label}</div>
                  <div className="text-[10px] text-slate-400">{item.desc}</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Header CTAs (buttons in the header)</Label>
          <button onClick={addCta} className="text-xs font-bold text-orange-500 hover:text-orange-700 flex items-center gap-1">
            <Plus size={12}/> Add CTA
          </button>
        </div>
        {(d.headerCtas || []).length === 0 ? (
          <p className="text-xs text-slate-400 italic">No CTAs added — e.g. "Book Now", "Order Online"</p>
        ) : (
          <div className="space-y-2">
            {d.headerCtas.map((cta, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={cta.label} onChange={e => updateCta(i,'label',e.target.value)}
                  placeholder="Label e.g. Book Now" className="flex-1" />
                <input value={cta.url} onChange={e => updateCta(i,'url',e.target.value)}
                  placeholder="URL e.g. /book or tel:04..." className="flex-1" />
                <select value={cta.variant} onChange={e => updateCta(i,'variant',e.target.value)}
                  className="w-28">
                  {['primary','secondary','outline','text'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <button onClick={() => removeCta(i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Step7({ d, u }) {
  const togglePage = key => u('pages', { ...d.pages, [key]: !d.pages[key] })
  const addExtra = () => u('extraPages', [...(d.extraPages||[]), { title: '', purpose: '' }])
  const updateExtra = (i, field, val) => u('extraPages', d.extraPages.map((p, idx) => idx===i ? {...p,[field]:val} : p))
  const removeExtra = i => u('extraPages', d.extraPages.filter((_,idx)=>idx!==i))

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Select the pages you need on your website. Locked pages are always included.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PAGE_OPTIONS.map(p => {
          const checked = !!d.pages[p.key]
          return (
            <label key={p.key}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                p.locked ? 'border-slate-200 bg-slate-50 opacity-70' :
                checked ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-orange-300'
              }`}>
              <input type="checkbox" checked={checked} disabled={p.locked}
                onChange={() => !p.locked && togglePage(p.key)}
                className="w-4 h-4 mt-0.5 accent-orange-500 flex-shrink-0" />
              <div>
                <div className="text-sm font-semibold text-slate-800">{p.label}</div>
                <div className="text-xs text-slate-400">{p.desc}{p.locked ? ' · Always included' : ''}</div>
              </div>
            </label>
          )
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Any Other Pages Needed?</Label>
          <button onClick={addExtra} className="text-xs font-bold text-orange-500 hover:text-orange-700 flex items-center gap-1">
            <Plus size={12}/> Add Custom Page
          </button>
        </div>
        {(d.extraPages||[]).length === 0 ? (
          <p className="text-xs text-slate-400 italic">e.g. "Catering", "Events", "Franchise"</p>
        ) : (
          <div className="space-y-2">
            {d.extraPages.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input value={p.title} onChange={e => updateExtra(i,'title',e.target.value)}
                  placeholder="Page title" className="flex-1" />
                <input value={p.purpose} onChange={e => updateExtra(i,'purpose',e.target.value)}
                  placeholder="Brief description" className="flex-1" />
                <button onClick={() => removeExtra(i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 size={14}/></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Step8({ d, u }) {
  const toggle = key => u('homepageLayout', { ...d.homepageLayout, [key]: !d.homepageLayout[key] })
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Choose which sections appear on your homepage and in what order.</p>
      <div className="space-y-2">
        {HOMEPAGE_SECTIONS.map(s => {
          const on = !!d.homepageLayout[s.key]
          return (
            <Toggle key={s.key} label={s.label} desc={s.desc} checked={on} onChange={() => toggle(s.key)} />
          )
        })}
      </div>

      {d.homepageLayout.reviews && (
        <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl space-y-3">
          <div className="text-sm font-bold text-orange-700 flex items-center gap-1.5"><Star size={14}/> Reviews Setup</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Reviews Source</Label>
              <select value={d.reviewsSource} onChange={e => u('reviewsSource', e.target.value)} className="w-full">
                <option value="google">Google Reviews</option>
                <option value="manual">Manual / Curated</option>
              </select>
            </div>
            {d.reviewsSource === 'google' && (
              <Inp label="Google Place ID" value={d.reviewsPlaceId} onChange={v => u('reviewsPlaceId', v)}
                placeholder="ChIJN1t_tDeuEmsRUsoyG..." hint="Find at: maps.google.com → Share → Embed" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Step9({ d, u }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Tell us how you'll provide your menu. We'll set it up in the CMS.</p>
      <Sel label="How will you provide your menu?" required value={d.menuUploadType} onChange={v => u('menuUploadType', v)}
        options={[
          'CSV / Spreadsheet upload',
          'Photos of printed menu — we\'ll type it up',
          'Word / PDF document',
          'Existing website — we\'ll copy it over',
          'We\'ll enter it ourselves in the CMS after launch',
          'POS sync — auto import from our POS system',
        ]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sel label="How many menu categories roughly?" value={d.menuCategoryCount} onChange={v => u('menuCategoryCount', v)}
          options={['1–5', '6–10', '11–20', '20+', 'Not sure']} />
        <Sel label="Approximate number of menu items?" value={d.menuItemCount} onChange={v => u('menuItemCount', v)}
          options={['Under 20', '20–50', '51–100', '100+', 'Not sure']} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sel label="Do items have size variants?" value={d.menuHasSizes} onChange={v => u('menuHasSizes', v)}
          options={['Yes (e.g. small/medium/large)', 'No', 'Some items']} />
        <Sel label="Do items have add-ons / extras?" value={d.menuHasAddons} onChange={v => u('menuHasAddons', v)}
          options={['Yes', 'No', 'Some items']} />
      </div>
      <Textarea label="Menu Notes" value={d.menuNotes} onChange={v => u('menuNotes', v)}
        placeholder="Any notes: dietary categories needed, allergen labelling, seasonal menus, etc." />
    </div>
  )
}

function Step10({ d, u }) {
  const addSpecial = () => u('specials', [...(d.specials||[]), { title: '', description: '', price: '', startDate: '', endDate: '', isRegular: false }])
  const updateSpecial = (i, field, val) => u('specials', d.specials.map((s, idx) => idx===i ? {...s,[field]:val} : s))
  const removeSpecial = i => u('specials', d.specials.filter((_,idx)=>idx!==i))

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Add any current specials, recurring deals or promotions to include at launch. Can be added/edited in the CMS later.</p>
      {(d.specials||[]).length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
          <Sparkles size={24} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">No specials added yet</p>
          <p className="text-xs text-slate-400 mt-1">e.g. Happy Hour, Kids Eat Free, Weekend Brunch Deal</p>
        </div>
      ) : (
        <div className="space-y-4">
          {d.specials.map((s, i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-xl bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Special {i+1}</span>
                <button onClick={() => removeSpecial(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Inp label="Title" required value={s.title} onChange={v => updateSpecial(i,'title',v)} placeholder="e.g. Happy Hour" />
                <Inp label="Price / Value" value={s.price} onChange={v => updateSpecial(i,'price',v)} placeholder="e.g. $12 cocktails or 2-for-1" />
              </div>
              <Field label="Description">
                <textarea value={s.description} onChange={e => updateSpecial(i,'description',e.target.value)}
                  placeholder="Brief description of the special or offer"
                  rows={2} className="w-full resize-none" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Inp label="Start Date" type="date" value={s.startDate} onChange={v => updateSpecial(i,'startDate',v)} />
                <Inp label="End Date" type="date" value={s.endDate} onChange={v => updateSpecial(i,'endDate',v)} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!s.isRegular} onChange={e => updateSpecial(i,'isRegular',e.target.checked)} className="w-4 h-4 accent-orange-500" />
                <span className="text-xs text-slate-600 font-medium">This is a recurring / permanent offer (no end date)</span>
              </label>
            </div>
          ))}
        </div>
      )}
      <button onClick={addSpecial}
        className="flex items-center gap-2 text-sm font-semibold text-orange-500 hover:text-orange-700 transition-colors">
        <Plus size={15}/> Add Special / Offer
      </button>
    </div>
  )
}

function Step11({ d, u }) {
  const ASSET_ROWS = [
    { key: 'hasLogo',         label: 'Logo',              hint: 'Primary logo file (SVG, PNG, AI preferred)' },
    { key: 'hasBannerImages', label: 'Hero / Banner Images', hint: 'Large images for the homepage slideshow' },
    { key: 'hasMenuImages',   label: 'Menu Item Photos',  hint: 'Images for individual menu items' },
    { key: 'hasGalleryImages',label: 'Gallery Photos',    hint: 'Restaurant ambience & food photography' },
  ]
  const OPTIONS = ['Yes — ready to send', 'Yes — needs editing/resizing', 'No — need sourcing', 'Not required']
  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">Let us know which assets you have ready. We'll request files separately via email or shared folder.</p>
      <div className="space-y-3">
        {ASSET_ROWS.map(row => (
          <div key={row.key} className="p-3 border border-slate-200 rounded-xl bg-slate-50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">{row.label}</div>
                <div className="text-xs text-slate-400">{row.hint}</div>
              </div>
              <select value={d[row.key]||''} onChange={e => u(row.key, e.target.value)} className="sm:w-64">
                <option value="">Select status...</option>
                {OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
      <Sel label="Preferred Asset Delivery Method" value={d.assetDeliveryMethod} onChange={v => u('assetDeliveryMethod', v)}
        options={['Google Drive / Dropbox link', 'WeTransfer', 'Email attachments', 'You collect from us in person', 'Other']} />
      <Textarea label="Asset Notes" value={d.assetNotes} onChange={v => u('assetNotes', v)}
        placeholder="Any notes about existing assets, brand guidelines, photographers, etc." />
    </div>
  )
}

// ─── RENAMED OLD STEPS (5→12, 6→13, 7→14, 8→15) ───────────────────────────

function Step12({ d, u }) {
  const toggle = key => u('services', { ...d.services, [key]: !d.services[key] })
  const FEATURES = [
    { key: 'menuDisplay',    label: 'Menu Display',         desc: 'Full menu on your website' },
    { key: 'onlineOrdering', label: 'Online Ordering',      desc: 'Pickup & delivery orders' },
    { key: 'reservations',   label: 'Table Reservations',   desc: 'Online booking system' },
    { key: 'specials',       label: 'Specials & Promotions',desc: 'Rotating deals & offers' },
    { key: 'loyalty',        label: 'Loyalty Program',      desc: 'Points & rewards for customers' },
    { key: 'pos',            label: 'POS Integration',      desc: 'Sync with your till system' },
    { key: 'multiLocation',  label: 'Multiple Locations',   desc: 'Manage more than one venue' },
    { key: 'giftVouchers',   label: 'Gift Vouchers',        desc: 'Sell digital vouchers' },
  ]
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 mb-2">Select all features you'd like on your DineDesk site.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map(f => (
          <Toggle key={f.key} label={f.label} desc={f.desc}
            checked={!!d.services[f.key]} onChange={() => toggle(f.key)} />
        ))}
      </div>
    </div>
  )
}

function Step13_POS({ d, u }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sel label="Current POS System" value={d.posSystem} onChange={v => u('posSystem', v)}
          options={['Square', 'Toast', 'Clover', 'Lightspeed', 'Revel', 'Abacus', 'Impos', 'OrderMate', 'H&L', 'Other', 'None']} />
        <Inp label="POS Version / Model" value={d.posVersion} onChange={v => u('posVersion', v)} placeholder="e.g. Square Register, Lightspeed R-Series" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Sel label="Payment Provider / Merchant" value={d.paymentProvider} onChange={v => u('paymentProvider', v)}
          options={['Stripe', 'Square', 'Tyro', 'ANZ eGate', 'CommBank', 'NAB', 'Westpac', 'PayPal', 'Other']} />
        <Sel label="Accept Online Payments?" value={d.acceptsOnlinePayment} onChange={v => u('acceptsOnlinePayment', v)}
          options={['Yes — card only', 'Yes — card + Apple/Google Pay', 'Cash on pickup only', 'Not sure yet']} />
      </div>
      <Textarea label="POS / Payment Notes" value={d.posNotes} onChange={v => u('posNotes', v)}
        placeholder="Any notes about your setup, API access, or special requirements" />
    </div>
  )
}

function Step14_Timeline({ d, u }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Inp label="Desired Go-Live Date" type="date" value={d.goLiveDate} onChange={v => u('goLiveDate', v)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Inp label="Referred By (name or company)" value={d.referredBy} onChange={v => u('referredBy', v)} placeholder="Optional" />
        <Sel label="How Did You Hear About Us?" value={d.hearAboutUs} onChange={v => u('hearAboutUs', v)}
          options={['Google Search', 'Social Media', 'Referral / Word of Mouth', 'Industry Event', 'Cold Outreach', 'Other']} />
      </div>
      <Textarea label="Additional Notes / Special Requirements" rows={4} value={d.additionalNotes} onChange={v => u('additionalNotes', v)}
        placeholder="Any additional information, special requests, or questions for our team" />
    </div>
  )
}

function Step15({ d, u, onSubmit, submitting, submitted }) {
  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Form Submitted Successfully!</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto">
          Your onboarding form has been submitted and your PDF has been downloaded. Our team will be in touch within 1–2 business days.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Terms summary */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-600 space-y-2">
        <p className="font-semibold text-slate-800">Before you submit, please review:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-500">
          <li>All information you've provided is accurate and up to date</li>
          <li>DineDesk will use this information to build and configure your website</li>
          <li>You authorise DineDesk to create accounts and deploy services on your behalf</li>
          <li>Standard setup fees and ongoing subscription fees apply as per your selected plan</li>
        </ul>
      </div>

      {/* Legal links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        {[
          ['Terms of Service', 'https://www.dinedesk.com.au/terms-of-service'],
          ['Privacy Policy', 'https://www.dinedesk.com.au/privacy-policy'],
          ['Service Level Agreement', 'https://www.dinedesk.com.au/service-level-agreement'],
        ].map(([label, href]) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 border border-slate-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-slate-700 hover:text-orange-600">
            <FileCheck size={14} className="flex-shrink-0" />
            <span className="font-medium">{label}</span>
          </a>
        ))}
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={d.termsRead} onChange={e => u('termsRead', e.target.checked)}
            className="w-4 h-4 mt-0.5 flex-shrink-0 accent-orange-500" />
          <span className="text-sm text-slate-600">
            I have read and agree to DineDesk's <strong>Terms of Service</strong>, <strong>Privacy Policy</strong> and <strong>Service Level Agreement</strong>.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={d.signatureConsent} onChange={e => u('signatureConsent', e.target.checked)}
            className="w-4 h-4 mt-0.5 flex-shrink-0 accent-orange-500" />
          <span className="text-sm text-slate-600">
            I confirm that all information provided is accurate and I am authorised to submit this onboarding form on behalf of the business.
          </span>
        </label>
      </div>

      {/* Signature field */}
      <div>
        <Label required>Your Full Name (acts as digital signature)</Label>
        <input
          value={d.signedByName || d.contactName || ''}
          onChange={e => u('signedByName', e.target.value)}
          placeholder="Type your full legal name"
          className="w-full text-lg font-medium"
          style={{ fontFamily: 'Georgia, serif' }}
        />
        <p className="text-xs text-slate-400 mt-1">
          By typing your name above you are providing an electronic signature confirming acceptance of the above terms.
        </p>
      </div>

      {!d.termsRead || !d.signatureConsent || !d.signedByName ? (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <AlertCircle size={15} />
          <span>Please accept the terms and provide your name to proceed.</span>
        </div>
      ) : null}

      <button
        onClick={onSubmit}
        disabled={submitting || !d.termsRead || !d.signatureConsent || !d.signedByName}
        className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
      >
        <Download size={16} />
        {submitting ? 'Generating PDF...' : 'Submit & Download PDF'}
      </button>
    </div>
  )
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const u = (key, val) => setData(prev => ({ ...prev, [key]: val }))

  const next = () => setStep(s => Math.min(s + 1, STEPS.length))
  const prev = () => setStep(s => Math.max(s - 1, 1))

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { pdf, filename } = generateOnboardingPDF(data)
      pdf.save(filename)
      setSubmitted(true)
      setStep(15)
    } catch (err) {
      console.error(err)
      alert('PDF generation failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const stepProps = { d: data, u }
  const STEP_CONTENT = {
    1:  <Step1  {...stepProps} />,
    2:  <Step2  {...stepProps} />,
    3:  <Step3  {...stepProps} />,
    4:  <Step4  {...stepProps} />,
    5:  <Step5  {...stepProps} />,
    6:  <Step6  {...stepProps} />,
    7:  <Step7  {...stepProps} />,
    8:  <Step8  {...stepProps} />,
    9:  <Step9  {...stepProps} />,
    10: <Step10 {...stepProps} />,
    11: <Step11 {...stepProps} />,
    12: <Step12 {...stepProps} />,
    13: <Step13_POS {...stepProps} />,
    14: <Step14_Timeline {...stepProps} />,
    15: <Step15 {...stepProps} onSubmit={handleSubmit} submitting={submitting} submitted={submitted} />,
  }

  const pct = submitted ? 100 : Math.round(((step - 1) / STEPS.length) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="DineDesk" style={{ width: 32, height: 32 }} />
            <div>
              <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                <span style={{ color: '#0f172a' }}>Dine</span>
                <span style={{ background: 'linear-gradient(135deg,#FF6B2B,#C0310A)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Desk</span>
              </div>
              <div style={{ fontFamily:"'DM Sans',system-ui,sans-serif", fontSize: 10, color: '#94a3b8', marginTop: 1, fontWeight: 500 }}>Client Onboarding</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{pct}% complete</span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 gap-1">
          {STEPS.map((s, i) => {
            const done = step > s.id
            const active = step === s.id
            return (
              <button
                key={s.id}
                onClick={() => !submitted && setStep(s.id)}
                className={`flex flex-col items-center gap-1 min-w-[52px] transition-all ${
                  active ? 'opacity-100' : done ? 'opacity-80 cursor-pointer' : 'opacity-30 cursor-default'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  done ? 'bg-green-500 text-white' :
                  active ? 'bg-orange-500 text-white ring-4 ring-orange-100' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {done ? <Check size={14} /> : <s.Icon size={14} />}
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-orange-600' : 'text-slate-400'}`}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Step card */}
        <div className="step-card p-6 sm:p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Step {step} of {STEPS.length}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {[
                'Business Details',
                'Primary Contact',
                'Restaurant Location(s)',
                'Website & Branding',
                'Theme Selection',
                'Header & Utility Belt',
                'Pages Required',
                'Homepage Layout',
                'Menu Details',
                'Specials & Offers',
                'Assets & Media',
                'Features & Services',
                'POS & Payments',
                'Timeline & Goals',
                'Review & Sign Off',
              ][step - 1]}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {[
                'Tell us about your restaurant or hospitality business.',
                'Who should we contact during setup?',
                'Add all restaurant locations we\'ll be managing.',
                'Help us match your brand identity and domain.',
                'Choose the design theme that best fits your style.',
                'Configure the header layout, utility belt and CTA buttons.',
                'Select which pages you need on your website.',
                'Pick the sections and layout for your homepage.',
                'How will you provide your menu content?',
                'Any specials, deals or promotions to include at launch.',
                'What brand assets and media files do you have ready?',
                'Select the features and functionality you need.',
                'Current tech stack and payment preferences.',
                'When do you need to go live?',
                'Review, accept terms, and download your onboarding PDF.',
              ][step - 1]}
            </p>
          </div>

          {STEP_CONTENT[step]}
        </div>

        {/* Navigation */}
        {!submitted && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prev}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} /> Back
            </button>

            {step < STEPS.length ? (
              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-all"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : null}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-slate-300">
          DineDesk — Confidential Onboarding Document. All information is stored securely.
        </div>
      </div>
    </div>
  )
}
