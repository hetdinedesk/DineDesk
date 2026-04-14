# Site Template Testing Guide

## Available Test Sites

We have 3 different restaurant sites configured for testing:

### 1. Urban Eats (Modern Fine Dining)
- **Client ID**: `cmnigwgly0000bytqj51urqs7`
- **Theme**: Modern elegant restaurant
- **Colors**: Primary #C8823A (Gold), Secondary #1C2B1A (Dark Green)
- **Header Type**: Standard Full
- **URL**: http://localhost:3001/?site=cmnigwgly0000bytqj51urqs7

### 2. Bella Vista (Traditional Italian)
- **Client ID**: `cmnk7oqf70000ma32p7wwcnjh`
- **Theme**: Traditional Italian restaurant
- **Colors**: Primary #8B4513 (Brown), Secondary #D2691E (Chocolate)
- **Header Type**: Split
- **URL**: http://localhost:3001/?site=cmnk7oqf70000ma32p7wwcnjh

### 3. Sushi Paradise (Japanese Cuisine)
- **Client ID**: `cmnk7osyo0000137m1nw0yxoo`
- **Theme**: Modern Japanese restaurant
- **Colors**: Primary #DC143C (Crimson), Secondary #1A1A1A (Black)
- **Header Type**: Minimal
- **URL**: http://localhost:3001/?site=cmnk7osyo0000137m1nw0yxoo

## Testing Checklist

For each site, verify:

### Utility Belt Components
- [ ] Contact info (address/phone) displays correctly
- [ ] Social media links appear when configured
- [ ] Reviews show Google ratings or fallback reviews
- [ ] Header CTAs (Book/Order buttons) are styled correctly

### Color & Theme Application
- [ ] Primary and secondary colors are applied correctly
- [ ] Header background and text colors match configuration
- [ ] Body background and text colors are correct
- [ ] CTA buttons use the right colors

### Data Display
- [ ] Restaurant name and logo appear correctly
- [ ] Menu items and categories are displayed
- [ ] Location information is accurate
- [ ] Navigation menu is populated

### Header Variants
- [ ] Urban Eats: Standard Full header with centered logo
- [ ] Bella Vista: Split header with centered logo and nav on both sides
- [ ] Sushi Paradise: Minimal header with logo and mobile menu only

## CMS Access

- **CMS Admin**: http://localhost:5174
- **API Backend**: http://localhost:3001/api
- **Site Template**: http://localhost:3001

## Quick Test Commands

```bash
# Test Urban Eats
curl http://localhost:3001/api/clients/cmnigwgly0000bytqj51urqs7/export

# Test Bella Vista  
curl http://localhost:3001/api/clients/cmnk7oqf70000ma32p7wwcnjh/export

# Test Sushi Paradise
curl http://localhost:3001/api/clients/cmnk7osyo0000137m1nw0yxoo/export
```

## Expected Issues Fixed

1. ✅ CMS API connectivity (port 3001)
2. ✅ Utility belt data mapping from CMS structure
3. ✅ Social links configuration 
4. ✅ Header CTA object-to-array conversion
5. ✅ Color theme application via CSS variables
6. ✅ Header type variants (standard, split, minimal)
7. ✅ Multiple client support with query parameter override
