# Facebook Lead Ads CSV Import - FIXED

## Problem Identified

Your CSV file has these challenges:
1. **UTF-16 encoding** with BOM (Byte Order Mark)
2. **Tab-separated** values (not comma-separated)
3. **Facebook-specific format** with columns like `platform`, `first_name`, `phone_number`
4. **Phone format**: `p:+919911363929` (has 'p:' prefix)

## Solution Applied

### 1. Enhanced CSV Parser
- Auto-detects UTF-16 encoding
- Handles both tabs and commas
- Removes BOM characters
- Cleans phone numbers (removes 'p:' prefix)

### 2. Facebook Column Mapping
Now recognizes:
- `first_name` → Name
- `phone_number` → Phone  
- `platform` → Source (fb/ig detection)
- `ad_name` → Source clue
- `campaign_name` → Source clue

### 3. Smart Source Detection
- `platform: fb` → "Facebook Ads"
- `platform: ig` → "Instagram Ads"
- Detects from ad_name/campaign_name if platform not specified

## How Your File Will Import

Your CSV has:
```
first_name: Pratap, Mohan, Ram Shiromani, etc.
phone_number: p:+919911363929, p:+918527998619, etc.
platform: fb, ig
```

Will become:
```
Name: Pratap
Phone: 919911363929 (cleaned)
Source: Facebook Ads (from platform: fb)

Name: Mohan  
Phone: 918527998619 (cleaned)
Source: Facebook Ads (from platform: fb)
```

## Files Updated

- `src/crm/components/ImportLeadsModal.jsx` - Fixed CSV parser

## Deployment

```bash
cd ~/Downloads/fanbe-hostinger-CLEAN/hostinger-clean

git add src/crm/components/ImportLeadsModal.jsx
git commit -m "fix: Support Facebook Lead Ads CSV import (UTF-16, tab-separated)"
git push origin main
```

Wait 2-3 minutes for Hostinger to rebuild and deploy.

## Testing After Deployment

1. Login as admin: `ANKITFG` / `Major@1k`
2. Go to Leads Management
3. Click "Import Leads"
4. Upload your Facebook CSV
5. Should now parse correctly! ✅

## Expected Result

From your 45 leads file, you should see:
- **45 leads** detected
- Names properly parsed
- Phone numbers cleaned (no 'p:' prefix)
- Source detected as "Facebook Ads" or "Instagram Ads"
- Ready to assign to employees

