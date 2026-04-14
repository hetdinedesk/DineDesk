// ==UserScript==
// @name         DineDesk CMS Test Data Entry
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automatically fills test data into DineDesk CMS sections one by one
// @author       You
// @match        http://localhost:5173/*
// @match        http://localhost:5174/*
// @match        http://localhost:5175/*
// @match        https://*.dinedesk.io/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // TEST DATA CONFIGURATION
    // ==========================================
    const TEST_DATA = {
        // Site Settings
        siteSettings: {
            restaurantName: "Test Bistro Melbourne",
            displayName: "Test Bistro",
            defaultEmail: "test@bistro.example.com",
            abn: "51 824 753 556",
            country: "Australia",
            timezone: "Australia/Melbourne"
        },

        // Site Notes
        siteNotes: {
            general: "<h2>General Notes</h2><p>Test general notes for development purposes.</p><ul><li>Analytics ID: TEST-12345</li><li>Developer: Test User</li></ul>",
            stock: "<h3>Operational Notes</h3><p>Test operational information and stock management notes.</p>"
        },

        // Branding
        branding: {
            primaryColor: "#FF6B2B",
            accentColor: "#00D4FF",
            logoUrl: "https://via.placeholder.com/200x80/FF6B2B/FFFFFF?text=Test+Bistro",
            faviconUrl: "https://via.placeholder.com/32x32/FF6B2B/FFFFFF?text=T"
        },

        // Social Links
        socialLinks: {
            facebook: "https://facebook.com/testbistro",
            instagram: "https://instagram.com/testbistro",
            twitter: "https://twitter.com/testbistro",
            linkedin: "https://linkedin.com/company/testbistro"
        },

        // Reviews Config
        reviewsConfig: {
            googlePlaceId: "ChIJ1234567890TEST",
            tripAdvisorUrl: "https://www.tripadvisor.com/test",
            yelpUrl: "https://www.yelp.com/test"
        },

        // Booking Config
        booking: {
            resyWidget: "test-resy-widget-code",
            openTableId: "123456",
            bookingEmail: "bookings@testbistro.example.com",
            phoneNumber: "+61 3 1234 5678"
        },

        // Analytics
        analytics: {
            gtmId: "GTM-TEST123",
            gaId: "GA-TEST456",
            metaPixel: "PIXEL-TEST789"
        },

        // Shortcodes
        shortcodes: {
            phone: "+61 3 1234 5678",
            address: "123 Test Street, Melbourne VIC 3000",
            hours: "Mon-Fri: 9am-10pm, Sat-Sun: 10pm-11pm"
        },

        // Team Members
        teamMembers: [
            {
                name: "Chef Marco Rossi",
                position: "Executive Chef",
                image: "https://randomuser.me/api/portraits/men/32.jpg",
                isActive: true
            },
            {
                name: "Sarah Chen",
                position: "Head Sommelier",
                image: "https://randomuser.me/api/portraits/women/44.jpg",
                isActive: true
            },
            {
                name: "James Wilson",
                position: "Restaurant Manager",
                image: "https://randomuser.me/api/portraits/men/67.jpg",
                isActive: true
            }
        ],

        // Menu Items
        menuItems: [
            { name: "Truffle Risotto", price: "28.00", category: "Mains", description: "Arborio rice with black truffle and parmesan", isFeatured: true },
            { name: "Wagyu Beef Burger", price: "24.00", category: "Mains", description: "Premium wagyu patty with caramelized onions", isFeatured: true },
            { name: "Pan-Seared Scallops", price: "22.00", category: "Starters", description: "Hokkaido scallops with pea puree", isFeatured: false },
            { name: "Chocolate Fondant", price: "16.00", category: "Desserts", description: "Molten center with vanilla ice cream", isFeatured: true },
            { name: "Caesar Salad", price: "18.00", category: "Starters", description: "Classic with house-made dressing", isFeatured: false },
            { name: "Grilled Salmon", price: "32.00", category: "Mains", description: "Atlantic salmon with asparagus", isFeatured: false }
        ],

        // Homepage Sections
        hero: {
            title: "Welcome to Test Bistro",
            subtitle: "Experience culinary excellence in the heart of Melbourne",
            ctaText: "Book a Table",
            ctaLink: "/booking",
            backgroundImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920",
            isActive: true
        },

        promoTiles: {
            sectionTitle: "Chef's Recommendations",
            description: "Hand-picked seasonal delights from our kitchen",
            items: [
                {
                    heading: "Summer Specials",
                    subheading: "Refreshing seasonal dishes",
                    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
                    linkUrl: "/menu",
                    alternateStyle: false
                },
                {
                    heading: "Wine Pairing Dinner",
                    subheading: "5-course degustation menu",
                    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400",
                    linkUrl: "/events",
                    alternateStyle: true
                },
                {
                    heading: "Weekend Brunch",
                    subheading: "Saturday & Sunday 10am-3pm",
                    image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400",
                    linkUrl: "/brunch",
                    alternateStyle: false
                }
            ]
        },

        specials: {
            sectionTitle: "Current Specials",
            description: "Check out our latest offers and limited-time dishes",
            items: [
                {
                    title: "Lunch Express",
                    description: "2-course menu in 45 minutes - $35pp",
                    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
                    ctaLabel: "Book Now",
                    ctaLink: "/booking",
                    isActive: true
                },
                {
                    title: "Happy Hour",
                    description: "50% off all drinks 4-6pm weekdays",
                    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400",
                    ctaLabel: "View Menu",
                    ctaLink: "/drinks",
                    isActive: true
                }
            ]
        },

        reviews: {
            sectionTitle: "Customer Reviews",
            subtitle: "What our customers are saying about us",
            showGoogleReviews: true,
            showRegularReviews: true,
            alternateStyle: false,
            cta: {
                active: true,
                label: "Leave a Review",
                variant: "primary",
                url: "https://search.google.com/local/writereview?placeid=TEST"
            }
        },

        locations: [
            {
                title: "Melbourne CBD",
                content: "Our flagship location in the heart of the city",
                address: "123 Test Street, Melbourne VIC 3000",
                phone: "+61 3 1234 5678",
                hours: "Mon-Sun: 11am-11pm",
                imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600",
                isActive: true
            },
            {
                title: "South Yarra",
                content: "Cozy neighborhood bistro",
                address: "456 Chapel Street, South Yarra VIC 3141",
                phone: "+61 3 9876 5432",
                hours: "Tue-Sun: 5pm-10pm",
                imageUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600",
                isActive: true
            }
        ],

        homepageBanners: [
            {
                title: "Valentine's Day Special",
                content: "Romantic dinner for two with champagne",
                imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800",
                buttonText: "Reserve Now",
                buttonUrl: "/booking/valentines",
                isActive: true
            }
        ],

        contentSections: [
            {
                title: "Our Story",
                content: "Founded in 2020, Test Bistro brings together passion for local ingredients and international culinary techniques.",
                imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600",
                buttonText: "Learn More",
                buttonUrl: "/about",
                isActive: true
            }
        ],

        // Navigation Items
        headerSections: [
            {
                label: "Menu",
                url: "/menu",
                isActive: true,
                children: [
                    { label: "Dinner", url: "/menu/dinner", isActive: true },
                    { label: "Lunch", url: "/menu/lunch", isActive: true },
                    { label: "Drinks", url: "/menu/drinks", isActive: true }
                ]
            },
            {
                label: "Reservations",
                url: "/booking",
                isActive: true,
                children: []
            },
            {
                label: "About",
                url: "/about",
                isActive: true,
                children: [
                    { label: "Our Story", url: "/about/story", isActive: true },
                    { label: "Team", url: "/about/team", isActive: true }
                ]
            },
            {
                label: "Private Events",
                url: "/events",
                isActive: true,
                children: []
            }
        ],

        footerSections: [
            {
                title: "Quick Links",
                isActive: true,
                links: [
                    { label: "Menu", url: "/menu" },
                    { label: "Book a Table", url: "/booking" },
                    { label: "Gift Cards", url: "/gift-cards" },
                    { label: "Careers", url: "/careers" }
                ]
            },
            {
                title: "Contact",
                isActive: true,
                links: [
                    { label: "123 Test Street", url: null },
                    { label: "bookings@testbistro.com", url: "mailto:bookings@testbistro.com" },
                    { label: "+61 3 1234 5678", url: "tel:+61312345678" }
                ]
            }
        ]
    };

    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const findElement = (selector, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const check = () => {
                const el = document.querySelector(selector);
                if (el) {
                    resolve(el);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Element not found: ${selector}`));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    };

    const fillInput = async (selector, value) => {
        const input = await findElement(selector);
        input.focus();
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await wait(100);
    };

    const clickElement = async (selector) => {
        const el = await findElement(selector);
        el.click();
        await wait(300);
    };

    const safeClick = async (selector) => {
        try {
            await clickElement(selector);
            return true;
        } catch (e) {
            console.log(`Could not click ${selector}:`, e.message);
            return false;
        }
    };

    // ==========================================
    // SECTION FILLERS
    // ==========================================

    // 1. Site Settings Section
    const fillSiteSettings = async () => {
        console.log('📝 Filling Site Settings...');
        const data = TEST_DATA.siteSettings;

        // Navigate to config/site-settings
        if (!window.location.pathname.includes('/config/site-settings')) {
            const configLink = document.querySelector('a[href*="config"]');
            if (configLink) configLink.click();
            await wait(1000);
            await safeClick('button:has-text("Site Settings")');
            await wait(500);
        }

        // Fill identity fields
        await fillInput('input[placeholder*="restaurantName" i], input[placeholder*="Restaurant Name" i]', data.restaurantName);
        await fillInput('input[placeholder*="displayName" i], input[placeholder*="Display Name" i]', data.displayName);
        await fillInput('input[type="email"]', data.defaultEmail);
        await fillInput('input[placeholder*="ABN" i]', data.abn);

        // Select country
        const countrySelect = document.querySelector('select');
        if (countrySelect) {
            countrySelect.value = data.country;
            countrySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Select timezone
        const timezoneSelect = document.querySelectorAll('select')[1];
        if (timezoneSelect) {
            timezoneSelect.value = data.timezone;
            timezoneSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        console.log('✅ Site Settings filled');
    };

    // 2. Menu Items Section
    const fillMenuItems = async () => {
        console.log('🍽️ Filling Menu Items...');

        // Navigate to items section
        if (!window.location.pathname.includes('/items')) {
            const itemsLink = document.querySelector('a[href*="items"]');
            if (itemsLink) itemsLink.click();
            await wait(1000);
        }

        for (const item of TEST_DATA.menuItems) {
            // Click Add Menu Item
            const addBtn = document.querySelector('button:has-text("Add Menu Item"), button:contains("+ Add")');
            if (addBtn) addBtn.click();
            await wait(300);

            // Fill form
            const inputs = document.querySelectorAll('input');
            if (inputs.length >= 4) {
                inputs[0].value = item.name;
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));

                inputs[1].value = item.price;
                inputs[1].dispatchEvent(new Event('input', { bubbles: true }));

                inputs[2].value = item.category;
                inputs[2].dispatchEvent(new Event('input', { bubbles: true }));

                inputs[3].value = item.description;
                inputs[3].dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Check featured if needed
            if (item.isFeatured) {
                const featuredCheck = document.querySelector('input[type="checkbox"]#isFeatured, input[type="checkbox"]');
                if (featuredCheck && !featuredCheck.checked) {
                    featuredCheck.click();
                }
            }

            // Save
            const saveBtn = document.querySelector('button:has-text("Save Item"), button:contains("Save")');
            if (saveBtn) saveBtn.click();

            await wait(800);
        }

        console.log('✅ Menu Items filled');
    };

    // 3. Team Members Section
    const fillTeamMembers = async () => {
        console.log('👥 Filling Team Members...');

        // Navigate to team section
        if (!window.location.pathname.includes('/team')) {
            const teamLink = document.querySelector('a[href*="team"], a:has-text("Team")');
            if (teamLink) teamLink.click();
            await wait(1000);
        }

        for (const member of TEST_DATA.teamMembers) {
            // Click Add Member
            const addBtn = await findElement('button:has-text("Add Member"), button:contains("+ Add")');
            addBtn.click();
            await wait(500);

            // Fill modal
            await fillInput('input[placeholder*="Name" i]', member.name);
            await fillInput('input[placeholder*="Position" i], input[placeholder*="Role" i]', member.position);
            await fillInput('input[placeholder*="Image" i], input[placeholder*="URL" i]', member.image);

            // Save
            await safeClick('button:has-text("Save Member"), button:contains("Save")');
            await wait(800);
        }

        console.log('✅ Team Members filled');
    };

    // 4. Homepage - Promo Tiles
    const fillPromoTiles = async () => {
        console.log('🖼️ Filling Promo Tiles...');

        // Navigate to homepage/promo-tile
        if (!window.location.pathname.includes('/homepage')) {
            const homeLink = document.querySelector('a[href*="homepage"], a:has-text("Home")');
            if (homeLink) homeLink.click();
            await wait(1000);
        }

        // Click Promo Tiles tab
        const promoTab = document.querySelector('button:has-text("Promo Tiles"), button:contains("promo")');
        if (promoTab) promoTab.click();
        await wait(500);

        // Fill section header
        const titleInput = document.querySelector('input[value], input');
        if (titleInput) {
            titleInput.value = TEST_DATA.promoTiles.sectionTitle;
            titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Add promo items
        for (const item of TEST_DATA.promoTiles.items) {
            const addBtn = document.querySelector('button:has-text("Add Item"), button:contains("+ Add")');
            if (addBtn) addBtn.click();
            await wait(500);

            // Fill promo item modal
            const inputs = document.querySelectorAll('input');
            if (inputs.length >= 2) {
                inputs[0].value = item.heading;
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));

                inputs[1].value = item.subheading;
                inputs[1].dispatchEvent(new Event('input', { bubbles: true }));

                // Find image input
                const imageInput = Array.from(inputs).find(i => i.placeholder?.includes('Image') || i.placeholder?.includes('URL'));
                if (imageInput) {
                    imageInput.value = item.image;
                    imageInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // Save
            await safeClick('button:has-text("Save Tile"), button:contains("Save")');
            await wait(800);
        }

        console.log('✅ Promo Tiles filled');
    };

    // 5. Homepage - Specials
    const fillSpecials = async () => {
        console.log('🔥 Filling Specials...');

        // Navigate to specials tab
        const specialsTab = document.querySelector('button:has-text("Specials"), button:contains("special")');
        if (specialsTab) specialsTab.click();
        await wait(500);

        const data = TEST_DATA.specials;

        // Fill section header
        const inputs = document.querySelectorAll('input');
        if (inputs.length > 0) {
            inputs[0].value = data.sectionTitle;
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Add special items
        for (const item of data.items) {
            const addBtn = document.querySelector('button:has-text("Add Special"), button:contains("+ Add")');
            if (addBtn) addBtn.click();
            await wait(500);

            // Fill special item
            const modalInputs = document.querySelectorAll('input');
            if (modalInputs.length >= 3) {
                modalInputs[0].value = item.title;
                modalInputs[0].dispatchEvent(new Event('input', { bubbles: true }));

                modalInputs[1].value = item.image;
                modalInputs[1].dispatchEvent(new Event('input', { bubbles: true }));

                modalInputs[2].value = item.ctaLabel;
                modalInputs[2].dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Description textarea
            const textarea = document.querySelector('textarea');
            if (textarea) {
                textarea.value = item.description;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Save
            await safeClick('button:has-text("Save Special"), button:contains("Save")');
            await wait(800);
        }

        console.log('✅ Specials filled');
    };

    // 6. Social Links Section
    const fillSocialLinks = async () => {
        console.log('🔗 Filling Social Links...');

        // Navigate to config/social-links
        if (!window.location.pathname.includes('/config/social-links')) {
            window.location.href = window.location.origin + '/site/' + getClientId() + '/config/social-links';
            await wait(1000);
        }

        const data = TEST_DATA.socialLinks;

        // Fill social link inputs
        const inputs = document.querySelectorAll('input');
        const dataMap = [
            { key: 'facebook', placeholder: ['facebook', 'fb'] },
            { key: 'instagram', placeholder: ['instagram', 'ig'] },
            { key: 'twitter', placeholder: ['twitter', 'x'] },
            { key: 'linkedin', placeholder: ['linkedin', 'li'] }
        ];

        for (const input of inputs) {
            const placeholder = input.placeholder?.toLowerCase() || '';
            const label = input.previousElementSibling?.textContent?.toLowerCase() || '';

            for (const map of dataMap) {
                if (map.placeholder.some(p => placeholder.includes(p) || label.includes(p))) {
                    input.value = data[map.key];
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    break;
                }
            }
        }

        console.log('✅ Social Links filled');
    };

    // 7. Reviews Section
    const fillReviews = async () => {
        console.log('⭐ Filling Reviews Section...');

        // Navigate to reviews config
        const reviewsTab = document.querySelector('button:has-text("Reviews"), a[href*="reviews"]');
        if (reviewsTab) reviewsTab.click();
        await wait(800);

        const data = TEST_DATA.reviews;

        // Fill title and subtitle
        const inputs = document.querySelectorAll('input');
        if (inputs.length > 0) {
            inputs[0].value = data.sectionTitle;
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }

        const textareas = document.querySelectorAll('textarea');
        if (textareas.length > 0) {
            textareas[0].value = data.subtitle;
            textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Toggle switches
        const toggles = document.querySelectorAll('[role="switch"], input[type="checkbox"]');
        toggles.forEach(toggle => {
            if (!toggle.checked) toggle.click();
        });

        console.log('✅ Reviews Section filled');
    };

    // 8. Navigation - Header Sections
    const fillHeaderSections = async () => {
        console.log('🧭 Filling Navigation (Header)...');

        // Navigate to navbar section
        if (!window.location.pathname.includes('/navbar')) {
            const navLink = document.querySelector('a[href*="navbar"], a:has-text("Nav")');
            if (navLink) navLink.click();
            await wait(1000);
        }

        // Click Header Sections tab
        const headerTab = document.querySelector('button:has-text("Header"), button:contains("header")');
        if (headerTab) headerTab.click();
        await wait(500);

        for (const section of TEST_DATA.headerSections) {
            // Add header section
            const addBtn = document.querySelector('button:has-text("Add Section"), button:contains("+ Add")');
            if (addBtn) addBtn.click();
            await wait(500);

            // Fill section
            const inputs = document.querySelectorAll('input');
            if (inputs.length >= 2) {
                inputs[0].value = section.label;
                inputs[0].dispatchEvent(new Event('input', { bubbles: true }));

                inputs[1].value = section.url;
                inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Add children if any
            for (const child of section.children) {
                const addChildBtn = document.querySelector('button:has-text("Add Child"), button:contains("+ Child")');
                if (addChildBtn) addChildBtn.click();
                await wait(300);

                const childInputs = document.querySelectorAll('input');
                // Find the last 2 inputs (likely for the new child)
                const lastInputs = Array.from(childInputs).slice(-2);
                if (lastInputs.length >= 2) {
                    lastInputs[0].value = child.label;
                    lastInputs[0].dispatchEvent(new Event('input', { bubbles: true }));

                    lastInputs[1].value = child.url;
                    lastInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // Save
            await safeClick('button:has-text("Save"), button:contains("Save")');
            await wait(800);
        }

        console.log('✅ Navigation filled');
    };

    // Helper to get client ID from URL
    const getClientId = () => {
        const match = window.location.pathname.match(/\/site\/([^\/]+)/);
        return match ? match[1] : 'test-client';
    };

    // ==========================================
    // MAIN CONTROLLER
    // ==========================================

    const SECTIONS = [
        { name: 'Site Settings', fn: fillSiteSettings },
        { name: 'Social Links', fn: fillSocialLinks },
        { name: 'Reviews Config', fn: fillReviews },
        { name: 'Menu Items', fn: fillMenuItems },
        { name: 'Team Members', fn: fillTeamMembers },
        { name: 'Promo Tiles', fn: fillPromoTiles },
        { name: 'Specials', fn: fillSpecials },
        { name: 'Navigation', fn: fillHeaderSections }
    ];

    let currentSectionIndex = 0;
    let isRunning = false;

    const runNextSection = async () => {
        if (currentSectionIndex >= SECTIONS.length) {
            console.log('🎉 ALL SECTIONS COMPLETED!');
            alert('Test data entry completed for all sections!');
            isRunning = false;
            return;
        }

        const section = SECTIONS[currentSectionIndex];
        console.log(`\n▶️ Running: ${section.name} (${currentSectionIndex + 1}/${SECTIONS.length})`);

        try {
            await section.fn();
            console.log(`✅ Completed: ${section.name}`);
        } catch (err) {
            console.error(`❌ Error in ${section.name}:`, err.message);
        }

        currentSectionIndex++;

        // Auto-continue after delay
        setTimeout(() => {
            if (isRunning) runNextSection();
        }, 2000);
    };

    // Create floating control panel
    const createControlPanel = () => {
        const panel = document.createElement('div');
        panel.id = 'dinedesk-test-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #0E1420;
                border: 1px solid #1E2D4A;
                border-radius: 12px;
                padding: 16px;
                z-index: 999999;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
                font-family: 'DM Sans', system-ui, sans-serif;
                min-width: 280px;
                color: #F1F5FF;
            ">
                <h3 style="
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 700;
                    color: #FF6B2B;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">🧪 DineDesk Test Data</h3>

                <div id="test-progress" style="
                    font-size: 12px;
                    color: #7A8BAD;
                    margin-bottom: 12px;
                ">Ready to start</div>

                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button id="test-start-all" style="
                        padding: 8px 16px;
                        background: linear-gradient(135deg, #FF6B2B, #E85A1A);
                        border: none;
                        border-radius: 6px;
                        color: white;
                        font-weight: 700;
                        font-size: 12px;
                        cursor: pointer;
                        font-family: inherit;
                    ">▶ Run All</button>

                    <button id="test-next" style="
                        padding: 8px 16px;
                        background: #141C2E;
                        border: 1px solid #1E2D4A;
                        border-radius: 6px;
                        color: #F1F5FF;
                        font-weight: 600;
                        font-size: 12px;
                        cursor: pointer;
                        font-family: inherit;
                    ">⏭ Next</button>

                    <button id="test-stop" style="
                        padding: 8px 16px;
                        background: #1A0505;
                        border: 1px solid #EF444440;
                        border-radius: 6px;
                        color: #EF4444;
                        font-weight: 600;
                        font-size: 12px;
                        cursor: pointer;
                        font-family: inherit;
                    ">⏹ Stop</button>
                </div>

                <div style="
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #1E2D4A;
                ">
                    <div style="font-size: 11px; color: #445572; margin-bottom: 8px;">Quick Fill:</div>
                    <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                        <button class="quick-btn" data-section="0" style="
                            padding: 4px 10px;
                            background: #111827;
                            border: 1px solid #2A3F63;
                            border-radius: 4px;
                            color: #7A8BAD;
                            font-size: 11px;
                            cursor: pointer;
                        ">Settings</button>
                        <button class="quick-btn" data-section="3" style="
                            padding: 4px 10px;
                            background: #111827;
                            border: 1px solid #2A3F63;
                            border-radius: 4px;
                            color: #7A8BAD;
                            font-size: 11px;
                            cursor: pointer;
                        ">Menu</button>
                        <button class="quick-btn" data-section="4" style="
                            padding: 4px 10px;
                            background: #111827;
                            border: 1px solid #2A3F63;
                            border-radius: 4px;
                            color: #7A8BAD;
                            font-size: 11px;
                            cursor: pointer;
                        ">Team</button>
                        <button class="quick-btn" data-section="5" style="
                            padding: 4px 10px;
                            background: #111827;
                            border: 1px solid #2A3F63;
                            border-radius: 4px;
                            color: #7A8BAD;
                            font-size: 11px;
                            cursor: pointer;
                        ">Promo</button>
                    </div>
                </div>

                <div id="test-status" style="
                    margin-top: 12px;
                    font-size: 11px;
                    color: #445572;
                    font-style: italic;
                "></div>
            </div>
        `;
        document.body.appendChild(panel);

        // Event listeners
        document.getElementById('test-start-all').addEventListener('click', () => {
            isRunning = true;
            currentSectionIndex = 0;
            updateProgress();
            runNextSection();
        });

        document.getElementById('test-next').addEventListener('click', async () => {
            if (currentSectionIndex < SECTIONS.length) {
                const section = SECTIONS[currentSectionIndex];
                updateProgress(`Running: ${section.name}`);
                try {
                    await section.fn();
                    currentSectionIndex++;
                    updateProgress(`Completed: ${section.name}`);
                } catch (err) {
                    updateProgress(`Error: ${section.name} - ${err.message}`);
                }
            }
        });

        document.getElementById('test-stop').addEventListener('click', () => {
            isRunning = false;
            updateProgress('Stopped');
        });

        // Quick buttons
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = parseInt(btn.dataset.section);
                const section = SECTIONS[idx];
                updateProgress(`Running: ${section.name}`);
                try {
                    await section.fn();
                    updateProgress(`Completed: ${section.name}`);
                } catch (err) {
                    updateProgress(`Error: ${err.message}`);
                }
            });
        });
    };

    const updateProgress = (msg) => {
        const progressEl = document.getElementById('test-progress');
        const statusEl = document.getElementById('test-status');
        if (progressEl) {
            progressEl.textContent = msg || `Progress: ${currentSectionIndex}/${SECTIONS.length}`;
        }
        if (statusEl && msg) {
            statusEl.textContent = new Date().toLocaleTimeString() + ' - ' + msg;
        }
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================

    const init = () => {
        console.log('🧪 DineDesk Test Script Loaded');
        console.log('Available sections:', SECTIONS.map(s => s.name).join(', '));
        console.log('Click "Run All" to auto-fill all sections, or use Quick Fill buttons for individual sections');

        // Wait for page to load then create panel
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createControlPanel);
        } else {
            createControlPanel();
        }
    };

    // Run init
    init();

    // Expose for console debugging
    window.DineDeskTest = {
        fillSiteSettings,
        fillSocialLinks,
        fillReviews,
        fillMenuItems,
        fillTeamMembers,
        fillPromoTiles,
        fillSpecials,
        fillHeaderSections,
        SECTIONS,
        TEST_DATA,
        runAll: () => {
            currentSectionIndex = 0;
            isRunning = true;
            runNextSection();
        },
        runNext: async () => {
            if (currentSectionIndex < SECTIONS.length) {
                await SECTIONS[currentSectionIndex].fn();
                currentSectionIndex++;
            }
        },
        reset: () => {
            currentSectionIndex = 0;
            isRunning = false;
            updateProgress('Reset');
        }
    };

})();
