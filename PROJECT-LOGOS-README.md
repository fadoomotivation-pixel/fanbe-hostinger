# Project Logos Setup

## Required Logo Files

Place the following plain logo files in `public/logos/` directory:

### Files Needed:

1. **kunj-bihari-logo.png** - Shree Kunj Bihari Enclave logo
2. **khatu-shyam-logo.png** - Khatu Shyam Enclave logo
3. **brij-vatika-logo.png** - Brij Vatika logo
4. **jagannath-dham-logo.png** - Shree Jagannath Dham logo
5. **gokul-vatika-logo.png** - Shree Gokul Vatika logo
6. **maa-simri-vatika-logo.png** - Maa Simri Vatika logo

## Logo Specifications

- **Format:** PNG with transparent background
- **Size:** 200x200px to 400x400px (square)
- **Style:** Simple, clean logo without complex backgrounds
- **Color:** Preferably with project branding colors
- **File Size:** < 100KB per logo

## Directory Structure

```
public/
└── logos/
    ├── kunj-bihari-logo.png
    ├── khatu-shyam-logo.png
    ├── brij-vatika-logo.png
    ├── jagannath-dham-logo.png
    ├── gokul-vatika-logo.png
    └── maa-simri-vatika-logo.png
```

## Where Logos Appear

- Project detail pages in the "Why Choose" section
- Displayed in a white rounded box (80x80px)
- Appears next to project highlights

## Fallback Behavior

If logo file is missing:
- Logo container will be hidden automatically
- Section title will still display properly
- No broken image icon shown

## How to Add Logos

1. Create `public/logos/` directory if it doesn't exist
2. Add all 6 PNG logo files with exact names above
3. Rebuild the project: `npm run build`
4. Logos will appear automatically on project pages

## Example Logo Creation

If you don't have logos yet, you can:

1. **Use Text-based logos:** Create simple text with project name
2. **Design tools:** Use Canva, Figma, or Photoshop
3. **AI generators:** Use DALL-E, Midjourney for logo design
4. **Temporary placeholder:** Use first letter of project in a circle

## Testing

After adding logos, visit:
- https://fanbegroup.com/projects/shree-kunj-bihari
- https://fanbegroup.com/projects/khatu-shyam-enclave
- https://fanbegroup.com/projects/brij-vatika
- https://fanbegroup.com/projects/jagannath-dham
- https://fanbegroup.com/projects/gokul-vatika
- https://fanbegroup.com/projects/maa-simri-vatika

Logos should appear in white boxes in the "Why Choose" section.
