# QuickLink History UI Modernization Design

**Date**: 2025-03-20
**Status**: Approved

## Overview

Modernize the QuickLink History Chrome extension UI using Material Design principles with Teal as the primary color. The goal is to create a clean, professional, and consistent user experience for both the popup and options pages.

## Design Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Visual Style | Material Design | Professional, consistent with Chrome, well-documented patterns |
| Primary Color | Teal (#009688) | Modern, fresh, suitable for developer tools |
| Popup Layout | List View | Efficient, shows more items, easy to scan |
| Options Layout | Sectioned | Clear organization, extensible for future features |

## Color Palette

```
Primary:        #009688 (Teal 500)
Primary Dark:   #00796b (Teal 700)
Primary Light:  #e0f2f1 (Teal 50)

Text Primary:   #333333
Text Secondary: #757575
Background:     #fafafa
Surface:        #ffffff
Border:         #e0e0e0
Error:          #f44336
```

## Component Specifications

### Popup Component

**Container**
- Width: 360px (fixed)
- Background: white
- Border-radius: 8px
- Box-shadow: 0 2px 8px rgba(0,0,0,0.12)

**Header**
- Background: #009688
- Color: white
- Padding: 16px
- Title: "Frequently Visited" (16px, font-weight 500)
- Subtitle: "Last X days" (12px, opacity 0.8)

**List Item**
- Display: flex, align-items: center
- Padding: 10px 16px
- Hover: background #f5f5f5
- Favicon: 36px circle, centered, background based on domain initial
- URL: 14px, font-weight 500, color #333, truncate with ellipsis
- Title: 12px, color #757575, truncate
- Visit count: 12px, white text, Teal background, border-radius 12px, padding 2px 8px

**Footer**
- Border-top: 1px solid #e0e0e0
- Button: full width, Teal text, font-weight 500, "Open Settings"

### Options Page Component

**Container**
- Max-width: 420px
- Centered on page
- Background: white
- Border-radius: 8px
- Box-shadow: 0 2px 8px rgba(0,0,0,0.12)

**Header**
- Background: #009688
- Color: white
- Padding: 20px
- Title: "Settings" (20px, font-weight 500)
- Subtitle: "Customize your history display" (13px, opacity 0.8)

**Section**
- Padding: 20px
- Border-bottom: 1px solid #e0e0e0 (except last section)

**Section Header**
- Color: #009688
- Font-size: 14px
- Font-weight: 500
- Icon prefix (emoji or icon)

**Form Controls**
- Labels: 12px, color #757575, uppercase, letter-spacing 0.5px
- Inputs: width 100%, padding 10px, border 1px solid #e0e0e0, border-radius 4px
- Focus: border-color #009688

**Blacklist Item**
- Display: flex, align-items: center
- Background: white (on #f5f5f5 container)
- Padding: 8px
- Border-radius: 4px
- Box-shadow: 0 1px 2px rgba(0,0,0,0.05)
- Delete button: color #f44336, cursor pointer

**Save Button**
- Width: 100%
- Padding: 14px
- Background: #009688
- Color: white
- Border: none
- Border-radius: 4px
- Font-size: 15px
- Font-weight: 500

## Favicon Color Mapping

Generate background colors for favicons based on domain first letter:

| Letter Range | Color | Background |
|--------------|-------|------------|
| A-E | Blue | #e3f2fd, text #1976d2 |
| F-J | Orange | #fff3e0, text #f57c00 |
| K-O | Green | #e8f5e9, text #388e3c |
| P-T | Pink | #fce4ec, text #c2185b |
| U-Z | Purple | #f3e5f5, text #7b1fa2 |

## File Changes

### popup.html
- Replace inline styles with external stylesheet
- Add Material Design structure (header, list container, footer)
- Link to new styles.css

### popup.js
- Update `addRow()` function to match new HTML structure
- Add hover effects via JavaScript
- Update favicon generation logic

### options.html
- Restructure with sectioned layout
- Update form controls to Material Design style
- Link to updated styles.css

### options.js
- No functional changes required
- May need minor updates for new DOM structure

### styles.css
- Complete rewrite with Material Design tokens
- Add CSS variables for colors
- Responsive considerations for options page
- Hover states and transitions

## Out of Scope

- Dark mode toggle (can be added later)
- Animations/transitions (minimal, can be enhanced later)
- Favicon fetching from actual websites (using initial letters only)
- Internationalization (keeping Chinese UI text)

## Success Criteria

- Popup displays cleanly with new Material Design style
- All existing functionality preserved (click to open, blacklist add)
- Options page saves settings correctly
- Consistent visual language across both pages
- No JavaScript errors
