# 🎨 Logo Upload Instructions

## Current Issue
The website is looking for logo files at:
- `https://fanbegroup.com/logos/kunj-bihari-logo.png`
- `https://fanbegroup.com/logos/khatu-shyam-logo.png`
- `https://fanbegroup.com/logos/brij-vatika-logo.png`
- `https://fanbegroup.com/logos/jagannath-dham-logo.png`
- `https://fanbegroup.com/logos/gokul-vatika-logo.png`
- `https://fanbegroup.com/logos/maa-simri-vatika-logo.png`

These files need to be uploaded to your Hostinger server.

## Steps to Upload Logos

### Option 1: Via Hostinger File Manager

1. **Login to Hostinger** → Go to your hosting panel
2. **File Manager** → Navigate to `public_html/logos/` (create folder if doesn't exist)
3. **Upload** all 6 logo PNG files
4. **File names MUST match exactly:**
   - `kunj-bihari-logo.png`
   - `khatu-shyam-logo.png`
   - `brij-vatika-logo.png`
   - `jagannath-dham-logo.png`
   - `gokul-vatika-logo.png`
   - `maa-simri-vatika-logo.png`

### Option 2: Via FTP

```bash
# Connect via FileZilla or any FTP client
Host: ftp.fanbegroup.com
Username: your_ftp_username
Password: your_ftp_password

# Upload to: /public_html/logos/
```

### Option 3: Via Terminal (if you have SSH access)

```bash
ssh your_username@fanbegroup.com
cd public_html
mkdir -p logos
cd logos
# Upload files here
```

## Logo Specifications

- **Format:** PNG with transparent background
- **Size:** 300x300px to 500x500px (square recommended)
- **File Size:** < 200KB each
- **Background:** Transparent or white
- **Quality:** High resolution for sharp display

## Where Logos Appear

1. **Projects Dropdown Menu** - 64x64px display
2. **Project Cards** (listing page) - 64x64px badge top-left
3. **Project Detail Page** - 96x96px in "Why Choose" section
4. **Mobile Menu** - 48x48px display

## Testing After Upload

1. Clear browser cache (Ctrl+Shift+Delete)
2. Visit: https://fanbegroup.com
3. Click "Projects" in navbar - logos should appear in dropdown
4. Visit projects page - logos should appear on cards
5. Visit individual project pages - logos should appear in "Why Choose" section

## Troubleshooting

### If logos don't appear:

1. **Check file names** - Must be exactly as specified (lowercase, with hyphens)
2. **Check file permissions** - Should be 644 (read for all)
3. **Check file path** - Must be in `/public_html/logos/` folder
4. **Clear cache** - Browser cache and Cloudflare cache (if using)
5. **Check file format** - Must be PNG (not JPG/JPEG)

### Set correct permissions via SSH:

```bash
cd public_html/logos
chmod 644 *.png
```

## Current Fallback

If logos fail to load, the system will:
- Hide the logo container (no broken image icon)
- Show only text in dropdown
- Project cards will show without logo badge

## Need Help?

If you need assistance:
1. Check that logos folder exists: `public_html/logos/`
2. Verify file names match exactly
3. Ensure files are accessible at: `https://fanbegroup.com/logos/[filename].png`
