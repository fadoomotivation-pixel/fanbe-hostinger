# Zoiper 5 VoIP Integration Guide for Fanbe CRM

> **For:** Developer integrating VoIP calling into Fanbe CRM
> **Goal:** Let employees call assigned leads from Android phone using Zoiper 5
> **Difficulty:** Beginner-friendly (step-by-step)

---

## Table of Contents

1. [What is Zoiper 5 and Why Use It](#1-what-is-zoiper-5-and-why-use-it)
2. [What You Need Before Starting](#2-what-you-need-before-starting)
3. [Step 1 — Get a SIP Provider Account](#step-1--get-a-sip-provider-account)
4. [Step 2 — Install Zoiper 5 on Employee Android Phone](#step-2--install-zoiper-5-on-employee-android-phone)
5. [Step 3 — Configure SIP Account in Zoiper 5](#step-3--configure-sip-account-in-zoiper-5)
6. [Step 4 — Test a Call](#step-4--test-a-call)
7. [Integration Ways (Simple to Advanced)](#integration-ways-simple-to-advanced)
   - [Way 1: Simple Click-to-Call Links (Easiest)](#way-1-simple-click-to-call-links-easiest--30-minutes)
   - [Way 2: Dedicated VoIP Button with Zoiper Intent](#way-2-dedicated-voip-button-with-zoiper-intent-1-2-hours)
   - [Way 3: Click-to-Call + Auto Call Logging](#way-3-click-to-call--auto-call-logging-3-5-hours)
   - [Way 4: PBX Server for Full Call Management](#way-4-pbx-server-for-full-call-management-advanced--1-2-weeks)
8. [Employee Daily Workflow](#employee-daily-workflow)
9. [Comparison Table — Which Way to Choose](#comparison-table--which-way-to-choose)
10. [Troubleshooting Common Issues](#troubleshooting-common-issues)
11. [SIP Providers for India](#sip-providers-for-india)
12. [Glossary](#glossary)

---

## 1. What is Zoiper 5 and Why Use It

**Zoiper 5** is a free VoIP softphone app for Android, iOS, and desktop.
It turns any phone into a business phone using internet (WiFi/4G/5G) instead of regular SIM calling.

**Website:** https://www.zoiper.com/en/voip-softphone/

### Why use Zoiper with your CRM?

| Regular SIM Calling (Current) | VoIP via Zoiper (New) |
|---|---|
| Uses employee's personal number | Uses company virtual number |
| Costly for many calls | Very cheap (0.5-2 paisa/sec) |
| No call recording | Can record calls |
| No automatic tracking | Can auto-log calls in CRM |
| Customer sees personal number | Customer sees company number |
| No control after employee leaves | Company owns the number |

### How it works (simple diagram)

```
Employee Android Phone
    |
    | Zoiper 5 App (installed)
    |
    | connects via Internet (WiFi/4G)
    |
    v
SIP Provider Server (your account)
    |
    | routes the call
    |
    v
Lead's Phone (normal call rings)
```

The lead receives a normal phone call. They don't need any app.

---

## 2. What You Need Before Starting

Before you can start, you need these 3 things:

| # | What | Where to Get |
|---|---|---|
| 1 | **SIP Provider Account** | Sign up with any SIP provider (see Section 11) |
| 2 | **Zoiper 5 App** | Free download from Google Play Store |
| 3 | **SIP Credentials** | Your SIP provider gives you: Username, Password, Server Address |

**SIP Credentials look like this (example):**
```
Server (Host):    sip.yourprovider.com
Username:         emp001
Password:         xK9#mP2$vL
Port:             5060 (default)
```

Each employee gets their own SIP username/password from the provider.

---

## Step 1 — Get a SIP Provider Account

### What is a SIP Provider?

A SIP provider is a company that connects your VoIP calls to normal phone networks.
Think of it like a "SIM card service" but for internet calling.

### Recommended Providers for India

| Provider | Website | Starting Price | Best For |
|---|---|---|---|
| **FreJun** | https://frejun.com | Rs 1,299/month | CRM integration, Indian numbers |
| **Zadarma** | https://zadarma.com | Free + per-min | Budget, quick setup |
| **CloudBharat** | https://cloudbharat.com | Contact sales | Indian business, bulk calls |
| **Servetel** | https://servetel.in | Rs 999/month | Cloud telephony, IVR |
| **CallHippo** | https://callhippo.com | $16/month | Virtual numbers, easy setup |
| **Telnyx** | https://telnyx.com | Pay-per-use | Global, developer-friendly |
| **MyOperator** | https://myoperator.com | Rs 1,500/month | Indian market, toll-free |

### How to sign up (general steps)

1. Go to provider's website
2. Create business account
3. Choose a plan (start with basic)
4. Buy a virtual phone number (DID) — this is the number leads will see
5. Create SIP extensions/accounts for each employee
6. Provider will give you SIP credentials for each employee

### What to ask your SIP provider

> "I need SIP credentials for Zoiper 5 softphone on Android.
> Please provide: SIP server address, port, username, and password
> for each of my employees. We will be making outbound calls to
> Indian mobile numbers."

---

## Step 2 — Install Zoiper 5 on Employee Android Phone

### Download

1. Open **Google Play Store** on the Android phone
2. Search for **"Zoiper5"**
3. Look for the app by **Securax LTD** (official developer)
4. Tap **Install**

**Direct Play Store link:** https://play.google.com/store/apps/details?id=com.zoiper.android.app

> **Note:** The free version is enough for basic calling.
> The paid version (Zoiper5 Premium) adds video calls, call recording, and extra codecs.

### Permissions to Allow

When opening Zoiper for the first time, allow these permissions:
- **Microphone** — Required for calls
- **Phone** — For call integration
- **Contacts** — Optional (for phone book access)
- **Notifications** — To receive incoming calls

---

## Step 3 — Configure SIP Account in Zoiper 5

Follow these exact steps on the employee's Android phone:

### 3.1 Open Zoiper 5

Open the Zoiper app. If this is the first time, it will ask you to create/add an account.

### 3.2 Add SIP Account

1. Tap **"Settings"** (gear icon at top)
2. Tap **"Accounts"**
3. Tap **"+"** (Add account button)
4. When asked "Do you already have an account?" — tap **"Yes"**
5. Tap **"Manual Configuration"**
6. Select account type: **"SIP"**

### 3.3 Enter SIP Credentials

Fill in these fields:

| Field | What to Enter | Example |
|---|---|---|
| **Account Name** | Any name (for display only) | "Fanbe Office" |
| **Host** | SIP server address from provider | `sip.frejun.com` |
| **Username** | SIP username from provider | `emp001` |
| **Password** | SIP password from provider | `xK9#mP2$vL` |

> **Important:** If your provider gave a port number other than 5060,
> add it after the host with a colon. Example: `sip.provider.com:5080`

### 3.4 Save and Check Status

1. Tap **"Save"** or the back button
2. Go back to the main screen
3. Look at the account status indicator:
   - **Green checkmark** = Connected and ready to call
   - **Red X** = Connection failed (check credentials)
   - **Yellow/Orange** = Connecting/registering

### 3.5 If Connection Fails

Check these common issues:
- Username/password typed correctly (case-sensitive)
- Internet connection is working (WiFi or mobile data)
- Server address is correct
- Ask provider if they need "Authentication Username" (sometimes different from username)

### 3.6 Recommended Settings

Go to **Settings > Accounts > (your account) > Network Settings**:

| Setting | Recommended Value | Why |
|---|---|---|
| Transport | **TCP** | More reliable than UDP |
| Use STUN | **Yes** | Helps with NAT/firewall |
| Use rport | **Yes** | Better connectivity |

Go to **Settings > Accounts > (your account) > Audio Settings**:

| Setting | Recommended Value | Why |
|---|---|---|
| Codec Priority 1 | **Opus** or **G.722** | Best voice quality |
| Codec Priority 2 | **G.711 (alaw)** | Fallback, most compatible |
| Echo Cancellation | **On** | Removes echo |

---

## Step 4 — Test a Call

1. Open Zoiper 5
2. Check that account shows **green checkmark** (registered)
3. Tap the **dialpad** icon
4. Enter any phone number (e.g., your own number)
5. Tap the **green call button**
6. You should hear ringing — the call is going through your SIP provider

> If the call connects and you can hear both sides clearly, Zoiper is working!

---

## Integration Ways (Simple to Advanced)

Below are 4 ways to connect Zoiper with your CRM, from simplest to most advanced.
**Start with Way 1** and upgrade later as needed.

---

### Way 1: Simple Click-to-Call Links (Easiest — 30 minutes)

**How it works:** When an employee taps the "Call" button on a lead in the CRM,
the phone asks "Open with Zoiper or Phone?" and the employee picks Zoiper.

**What to do:**

Wherever your CRM has a call button or phone link, use the `tel:` URI scheme:

```html
<a href="tel:+919876543210">Call Lead</a>
```

Or in JavaScript:

```javascript
// When employee taps "Call" button
function callLead(phoneNumber) {
  window.location.href = `tel:${phoneNumber}`;
}
```

**Why this works:** On Android, when Zoiper is installed and registered, it automatically
registers itself as a handler for `tel:` links. So when the employee taps a phone link
in the CRM (opened in Chrome), Android will show a popup:

```
Open with:
  [ Zoiper5 ]
  [ Phone   ]
```

The employee selects **Zoiper5** and optionally checks **"Always"** to make it the default.

**To make Zoiper the default dialer:**
1. Go to Android **Settings > Apps > Default Apps > Calling App**
2. Select **Zoiper5**
3. Now all `tel:` links will automatically open in Zoiper

**Pros:** Zero code changes needed, works immediately
**Cons:** Employee must manually select Zoiper (first time only if set as default)

---

### Way 2: Add VoIP Button in Your CRM (1-2 hours)

> This section explains your CRM code in simple language and shows
> **exactly** which files to change, step by step.

---

#### How Your CRM Calling Works Right Now

Your CRM is a **React** app. When an employee opens it on their Android phone
in Chrome, they see their assigned leads. Each lead card has buttons:

```
┌──────────────────────────────────────┐
│  Rajesh Kumar                        │
│  Shree Kunj Bihari  •  Open         │
│                                      │
│  [ Phone ]  [ WhatsApp ]            │  ← Current buttons
└──────────────────────────────────────┘
```

When employee taps **Phone** → the code runs `window.location.href = 'tel:9876543210'`
→ this opens the regular phone dialer (SIM call).

When employee taps **WhatsApp** → the code opens `wa.me/919876543210`
→ this opens WhatsApp chat.

**What we will do:** Add a purple **VoIP** button between them:

```
┌──────────────────────────────────────┐
│  Rajesh Kumar                        │
│  Shree Kunj Bihari  •  Open         │
│                                      │
│  [ Phone ] [ VoIP ] [ WhatsApp ]    │  ← After change
│   (blue)   (purple)   (green)        │
└──────────────────────────────────────┘
```

When employee taps **VoIP** → the code runs `window.location.href = 'sip:+919876543210'`
→ this opens **Zoiper 5** (not the phone dialer).

---

#### Understanding the Pattern: How WhatsAppButton Works

Your CRM already has a reusable **WhatsAppButton** component.
We will create a **VoIPCallButton** that works the exact same way.

**File:** `src/crm/components/WhatsAppButton.jsx`

Here's how WhatsAppButton works (explained line by line):

```jsx
// WhatsAppButton takes these inputs (called "props"):
//   phoneNumber = the lead's phone number
//   leadName    = the lead's name (for the message)
const WhatsAppButton = ({ leadName, projectName, phoneNumber, className, size }) => {

  const handleWhatsAppClick = (e) => {
    e.stopPropagation();  // Don't trigger the card click behind the button

    // Step 1: Clean phone number — remove spaces, dashes, brackets
    //   "98765 43210" → "9876543210"
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');

    // Step 2: Check if number is at least 10 digits
    if (cleanedPhone.length < 10) {
      alert("Invalid phone number format");
      return;
    }

    // Step 3: Add India country code (91) if number is just 10 digits
    //   "9876543210" → "919876543210"
    const formattedPhone = cleanedPhone.length === 10 ? `91${cleanedPhone}` : cleanedPhone;

    // Step 4: Open WhatsApp with this link
    const url = `https://wa.me/${formattedPhone}?text=Hi ${leadName}...`;
    window.open(url, '_blank');
  };

  // Step 5: Show a green button with WhatsApp icon
  return (
    <Button onClick={handleWhatsAppClick} className="bg-[#25D366] text-white">
      <MessageCircle /> WhatsApp
    </Button>
  );
};
```

**Our VoIPCallButton will follow the exact same pattern:**
- Step 1: Clean phone number ✓
- Step 2: Validate length ✓
- Step 3: Add country code ✓
- Step 4: Open `sip:` link instead of `wa.me` ← only this line is different
- Step 5: Purple button instead of green ← different color

---

#### Step A: Create the VoIPCallButton Component

Create a **new file**: `src/crm/components/VoIPCallButton.jsx`

Copy-paste this entire code:

```jsx
// src/crm/components/VoIPCallButton.jsx
// ==========================================
// VoIP Call Button — opens Zoiper 5 to make a SIP call
// Works exactly like WhatsAppButton but opens Zoiper instead
// ==========================================

import React from 'react';
import { Headphones } from 'lucide-react';           // icon from your icon library
import { Button } from '@/components/ui/button';      // your existing Button component
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// This component takes these inputs:
//   phoneNumber = lead's phone number (required)
//   className   = extra CSS classes (optional)
//   size        = button size: "sm", "default", "lg" (optional)
//   variant     = button style (optional)
const VoIPCallButton = ({ phoneNumber, className, size = "default", variant = "default" }) => {

  // This function runs when employee taps the VoIP button
  const handleVoIPCall = (e) => {
    e.stopPropagation();  // Don't trigger the lead card click

    // Check: do we have a phone number?
    if (!phoneNumber) {
      alert("No phone number available");
      return;
    }

    // Step 1: Clean phone number — remove everything except digits
    //   "98765 43210"  → "9876543210"
    //   "+91-9876543210" → "919876543210"
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');

    // Step 2: Check if number is valid (at least 10 digits)
    if (cleanedPhone.length < 10) {
      alert("Invalid phone number format");
      return;
    }

    // Step 3: Add India country code (+91) if it's just 10 digits
    //   "9876543210" → "+919876543210"
    //   "919876543210" → "+919876543210"
    let fullNumber;
    if (cleanedPhone.length === 10) {
      fullNumber = `+91${cleanedPhone}`;
    } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
      fullNumber = `+${cleanedPhone}`;
    } else {
      fullNumber = `+${cleanedPhone}`;
    }

    // Step 4: Open Zoiper using sip: link
    //   "sip:+919876543210" → Android asks Zoiper to dial this number
    //   This is similar to how "tel:" opens the phone dialer
    //   but "sip:" specifically opens VoIP apps like Zoiper
    window.location.href = `sip:${fullNumber}`;
  };

  // Step 5: Show a purple button with headphone icon
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleVoIPCall}
            className={`bg-[#7C3AED] hover:bg-[#6D28D9] text-white ${className}`}
            size={size}
            variant={variant === "ghost" ? "ghost" : "default"}
          >
            <Headphones size={18} className="mr-2" />
            VoIP
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Call via Zoiper (VoIP)</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VoIPCallButton;
```

> **What is `sip:`?** Just like `tel:` opens the phone dialer and `https://wa.me` opens
> WhatsApp, `sip:` opens VoIP apps. When Zoiper is installed on Android, it
> registers itself as the handler for `sip:` links. So tapping this button
> will open Zoiper and start dialing the number.

---

#### Step B: Add VoIP Button to Each Page

Now you need to add the VoIPCallButton in every page where employees see call buttons.
Below are **all 12 places** with exact before/after code.

> **How to read this section:**
> 1. Open the file shown
> 2. Find the "BEFORE" code (search for it in the file)
> 3. Replace it with the "AFTER" code
> 4. Save the file
> 5. Move to the next file

---

##### File 1 of 12: `src/crm/pages/MobileLeadList.jsx`

> **What is this page?** The main lead list employees see on their Android phone.
> Each lead shows as a card with Phone and WhatsApp buttons at the bottom.

**Step 1:** Add the import at the top of the file.

Find this line (near the top):
```jsx
import WhatsAppButton from '@/crm/components/WhatsAppButton';
```

Add this line **right below it**:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add the VoIP button between Phone and WhatsApp.

Find this code (around line 56-65):
```jsx
<div className="flex gap-2" onClick={e => e.stopPropagation()}>
    <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => window.location.href=`tel:${lead.phone}`}>
        <Phone size={14} />
    </Button>
    <WhatsAppButton
        leadName={lead.name}
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2 rounded-full"
    />
</div>
```

Replace with:
```jsx
<div className="flex gap-2" onClick={e => e.stopPropagation()}>
    <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => window.location.href=`tel:${lead.phone}`}>
        <Phone size={14} />
    </Button>
    <VoIPCallButton
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2 rounded-full"
    />
    <WhatsAppButton
        leadName={lead.name}
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2 rounded-full"
    />
</div>
```

> **What changed?** We added `<VoIPCallButton>` between the Phone button and WhatsAppButton.
> It takes the same `phoneNumber` prop from the lead. That's it!

---

##### File 2 of 12: `src/crm/pages/MobileLeadDetails.jsx`

> **What is this page?** When employee taps a lead card, they see this detail page
> with the lead's profile, big round Call and WhatsApp buttons, notes, etc.

**Step 1:** Add the import at the top.

Find:
```jsx
import WhatsAppButton from '@/crm/components/WhatsAppButton';
```

Add below it:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button in the action buttons area.

Find this code (around line 96-106):
```jsx
<div className="flex gap-3 justify-center mt-4">
    <Button className="rounded-full w-12 h-12 p-0" onClick={() => window.location.href = `tel:${lead.phone}`}>
        <Phone size={20} />
    </Button>
    <WhatsAppButton
        leadName={lead.name}
        phoneNumber={lead.phone}
        projectName={lead.project}
        className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
    />
</div>
```

Replace with:
```jsx
<div className="flex gap-3 justify-center mt-4">
    <Button className="rounded-full w-12 h-12 p-0" onClick={() => window.location.href = `tel:${lead.phone}`}>
        <Phone size={20} />
    </Button>
    <VoIPCallButton
        phoneNumber={lead.phone}
        className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
    />
    <WhatsAppButton
        leadName={lead.name}
        phoneNumber={lead.phone}
        projectName={lead.project}
        className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
    />
</div>
```

---

##### File 3 of 12: `src/crm/pages/MobileEmployeeDashboard.jsx`

> **What is this page?** The employee's home screen on mobile. Shows quick stats,
> quick actions, and follow-up reminders with Phone + WhatsApp buttons.

**Step 1:** Add the import at the top.

Find:
```jsx
import WhatsAppButton from '@/crm/components/WhatsAppButton';
```

Add below it:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button in the follow-ups section.

Find this code (around line 98-107):
```jsx
<div className="flex gap-2">
    <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => window.location.href=`tel:${lead.phone}`}>
        <Phone size={14} />
    </Button>
    <WhatsAppButton
        leadName={lead.name}
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2 rounded-full"
    />
</div>
```

Replace with:
```jsx
<div className="flex gap-2">
    <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-full" onClick={() => window.location.href=`tel:${lead.phone}`}>
        <Phone size={14} />
    </Button>
    <VoIPCallButton
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2 rounded-full"
    />
    <WhatsAppButton
        leadName={lead.name}
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2 rounded-full"
    />
</div>
```

---

##### File 4 of 12: `src/crm/components/ActionButtonGroup.jsx`

> **What is this component?** A group of action buttons (Call, WhatsApp, Status) shown on
> lead cards with swipe actions. Used by the LeadActionCard component.

**Step 1:** Add the import at the top.

Find:
```jsx
import { Phone, MessageCircle, ChevronDown } from 'lucide-react';
```

Add below the existing imports:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button between Call and WhatsApp.

Find this code (the full button grid, around line 9-60):
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
    {/* Call Button */}
    <Button
        className="bg-[#1E88E5] hover:bg-[#1976D2] text-white h-11 md:h-12 w-full shadow-sm active:scale-95 transition-transform"
        onClick={(e) => { e.stopPropagation(); onAction('call', lead); }}
    >
        <Phone className="mr-2 h-5 w-5" /> Call
    </Button>

    {/* WhatsApp Button */}
    <Button
        className="bg-[#25D366] hover:bg-[#20bd5a] text-white h-11 md:h-12 w-full shadow-sm active:scale-95 transition-transform"
        onClick={(e) => { e.stopPropagation(); onAction('whatsapp', lead); }}
    >
        <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
    </Button>

    {/* Status Button */}
```

Replace with:
```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-4">
    {/* Call Button */}
    <Button
        className="bg-[#1E88E5] hover:bg-[#1976D2] text-white h-11 md:h-12 w-full shadow-sm active:scale-95 transition-transform"
        onClick={(e) => { e.stopPropagation(); onAction('call', lead); }}
    >
        <Phone className="mr-2 h-5 w-5" /> Call
    </Button>

    {/* VoIP Button — opens Zoiper */}
    <VoIPCallButton
        phoneNumber={lead.phone}
        className="h-11 md:h-12 w-full shadow-sm active:scale-95 transition-transform"
    />

    {/* WhatsApp Button */}
    <Button
        className="bg-[#25D366] hover:bg-[#20bd5a] text-white h-11 md:h-12 w-full shadow-sm active:scale-95 transition-transform"
        onClick={(e) => { e.stopPropagation(); onAction('whatsapp', lead); }}
    >
        <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
    </Button>

    {/* Status Button */}
```

> **Note:** We also changed `grid-cols-3` to `grid-cols-4` because now there are 4 buttons.

---

##### File 5 of 12: `src/crm/pages/MyLeads.jsx`

> **What is this page?** Desktop "My Leads" page with a table of assigned leads.
> Each row has icons for Follow-up, Phone, and WhatsApp.

**Step 1:** Add the import at the top (near the other imports):
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button between Phone and WhatsApp icons.

Find this code (around line 201-206):
```jsx
<Button variant="ghost" size="icon" onClick={() => window.location.href=`tel:${lead.phone}`}>
    <Phone className="h-4 w-4 text-blue-600" />
</Button>
<Button variant="ghost" size="icon" onClick={() => window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank')}>
    <MessageCircle className="h-4 w-4 text-green-600" />
</Button>
```

Replace with:
```jsx
<Button variant="ghost" size="icon" onClick={() => window.location.href=`tel:${lead.phone}`}>
    <Phone className="h-4 w-4 text-blue-600" />
</Button>
<VoIPCallButton
    phoneNumber={lead.phone}
    size="sm"
    variant="ghost"
    className="h-8 w-8 p-0"
/>
<Button variant="ghost" size="icon" onClick={() => window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank')}>
    <MessageCircle className="h-4 w-4 text-green-600" />
</Button>
```

---

##### File 6 of 12: `src/crm/pages/EmployeeLeadDetails.jsx`

> **What is this page?** Detailed lead view for employees with quick action buttons
> (Call, WhatsApp, Update Status) in a 3-column grid.

**Step 1:** Add the import at the top:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button in the quick actions grid.

Find this code (around line 154-167):
```jsx
<div className="grid grid-cols-3 gap-4">
    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = `tel:${lead.phone}`}>
        <Phone className="mr-2 h-4 w-4" /> Call
    </Button>
    <WhatsAppButton
        leadName={lead.name}
        projectName={lead.project}
        phoneNumber={lead.phone}
        className="w-full"
    />
    <Button variant="outline" className="w-full border-blue-600 text-blue-600" onClick={() => setIsUpdateModalOpen(true)}>
        Update Status
    </Button>
</div>
```

Replace with:
```jsx
<div className="grid grid-cols-4 gap-4">
    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => window.location.href = `tel:${lead.phone}`}>
        <Phone className="mr-2 h-4 w-4" /> Call
    </Button>
    <VoIPCallButton
        phoneNumber={lead.phone}
        className="w-full"
    />
    <WhatsAppButton
        leadName={lead.name}
        projectName={lead.project}
        phoneNumber={lead.phone}
        className="w-full"
    />
    <Button variant="outline" className="w-full border-blue-600 text-blue-600" onClick={() => setIsUpdateModalOpen(true)}>
        Update Status
    </Button>
</div>
```

> **Note:** Changed `grid-cols-3` to `grid-cols-4` for the extra button.

---

##### File 7 of 12: `src/crm/pages/LeadSearch.jsx`

> **What is this page?** Search results page where employees can find leads.
> Each result has Phone and WhatsApp icon buttons.

**Step 1:** Add the import at the top:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button between Phone and WhatsApp.

Find this code (around line 147-162):
```jsx
<Button
    variant="ghost"
    size="icon"
    title="Call"
    onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}
>
    <Phone className="h-4 w-4 text-blue-600" />
</Button>
<Button
    variant="ghost"
    size="icon"
    title="WhatsApp"
    onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank'); }}
>
    <MessageCircle className="h-4 w-4 text-green-600" />
</Button>
```

Replace with:
```jsx
<Button
    variant="ghost"
    size="icon"
    title="Call"
    onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}
>
    <Phone className="h-4 w-4 text-blue-600" />
</Button>
<VoIPCallButton
    phoneNumber={lead.phone}
    size="sm"
    variant="ghost"
    className="h-8 w-8 p-0"
/>
<Button
    variant="ghost"
    size="icon"
    title="WhatsApp"
    onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank'); }}
>
    <MessageCircle className="h-4 w-4 text-green-600" />
</Button>
```

---

##### File 8 of 12: `src/crm/pages/SmartGuidance.jsx`

> **What is this page?** AI-powered lead recommendations that suggest which
> leads to call. Has Call and WhatsApp buttons for each recommendation.

**Step 1:** Add the import at the top:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button between Call and WhatsApp.

Find this code (around line 285-301):
```jsx
<Button
    variant="default"
    size="sm"
    className="bg-green-600 hover:bg-green-700 text-white"
    onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}
>
    <Phone className="h-4 w-4 mr-1" />
    Call
</Button>
<Button
    variant="ghost"
    size="sm"
    onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank'); }}
>
    <MessageCircle className="h-4 w-4 mr-1 text-green-600" />
    <span className="text-xs">WhatsApp</span>
</Button>
```

Replace with:
```jsx
<Button
    variant="default"
    size="sm"
    className="bg-green-600 hover:bg-green-700 text-white"
    onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${lead.phone}`; }}
>
    <Phone className="h-4 w-4 mr-1" />
    Call
</Button>
<VoIPCallButton
    phoneNumber={lead.phone}
    size="sm"
    className="px-2"
/>
<Button
    variant="ghost"
    size="sm"
    onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank'); }}
>
    <MessageCircle className="h-4 w-4 mr-1 text-green-600" />
    <span className="text-xs">WhatsApp</span>
</Button>
```

---

##### File 9 of 12: `src/crm/pages/EmployeeDashboard.jsx`

> **What is this page?** Desktop employee dashboard. Shows overdue follow-ups
> with Phone and WhatsApp buttons for each overdue lead.

**Step 1:** Add the import at the top:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button in overdue follow-ups section.

Find this code (around line 202-212):
```jsx
<div className="flex gap-2">
    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-200" onClick={() => window.location.href = `tel:${lead.phone}`}>
        <Phone size={14} className="text-red-600" />
    </Button>
    <WhatsAppButton
        leadName={lead.name}
        projectName={lead.project}
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2 bg-green-500 hover:bg-green-600"
    />
</div>
```

Replace with:
```jsx
<div className="flex gap-2">
    <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-200" onClick={() => window.location.href = `tel:${lead.phone}`}>
        <Phone size={14} className="text-red-600" />
    </Button>
    <VoIPCallButton
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2"
    />
    <WhatsAppButton
        leadName={lead.name}
        projectName={lead.project}
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 px-2 bg-green-500 hover:bg-green-600"
    />
</div>
```

---

##### File 10 of 12: `src/crm/components/LeadActionCard.jsx`

> **What is this component?** Swipeable lead cards with gesture actions.
> The phone number is shown as a `tel:` link. We add a VoIP call link next to it.

**Step 1:** Add the import at the top:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add a small VoIP link next to the phone number.

Find this code (around line 68-75):
```jsx
<div>
    <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
    <a
        href={`tel:${lead.phone}`}
        onClick={(e) => e.stopPropagation()}
        className="text-[#1E88E5] font-medium text-base mt-0.5 block"
    >
        {lead.phone}
    </a>
</div>
```

Replace with:
```jsx
<div>
    <h3 className="text-lg font-bold text-gray-900">{lead.name}</h3>
    <div className="flex items-center gap-2 mt-0.5">
        <a
            href={`tel:${lead.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[#1E88E5] font-medium text-base"
        >
            {lead.phone}
        </a>
        <VoIPCallButton
            phoneNumber={lead.phone}
            size="sm"
            className="h-6 px-2 text-xs"
        />
    </div>
</div>
```

---

##### File 11 of 12: `src/crm/pages/LeadDetail.jsx`

> **What is this page?** Admin/manager view of a lead's full details.
> Has quick action buttons (Call, WhatsApp, Log Call, Schedule Visit).

**Step 1:** Add the import at the top:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2:** Add VoIP button in quick actions.

Find this code (around line 176-182):
```jsx
<div className="flex gap-2 pt-4 border-t">
    <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${lead.phone}`}>
        <Phone className="h-4 w-4 mr-2" /> Call
    </Button>
    <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank')}>
        <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
    </Button>
```

Replace with:
```jsx
<div className="flex gap-2 pt-4 border-t">
    <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${lead.phone}`}>
        <Phone className="h-4 w-4 mr-2" /> Call
    </Button>
    <VoIPCallButton
        phoneNumber={lead.phone}
        size="sm"
        className="px-3"
    />
    <Button variant="outline" size="sm" onClick={() => window.open(`https://wa.me/91${lead.phone.slice(-10)}`, '_blank')}>
        <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
    </Button>
```

---

##### File 12 of 12: `src/crm/components/LeadTable.jsx`

> **What is this component?** The lead table used in admin/management pages.
> Has both a desktop table view and a mobile card view.
> Call/WhatsApp actions are delegated via `onAction('call', lead)` callback.

**Step 1:** Add the import at the top:
```jsx
import VoIPCallButton from '@/crm/components/VoIPCallButton';
```

**Step 2a:** Add VoIP button in **desktop table** row (around line 217-223).

Find:
```jsx
<div className="flex justify-end gap-2">
    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full" onClick={(e) => { e.stopPropagation(); onAction('call', lead); }}>
        <Phone size={14} />
    </Button>
    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100 rounded-full" onClick={(e) => { e.stopPropagation(); onAction('whatsapp', lead); }}>
        <MessageSquare size={14} />
    </Button>
```

Replace with:
```jsx
<div className="flex justify-end gap-2">
    <Button size="icon" variant="ghost" className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full" onClick={(e) => { e.stopPropagation(); onAction('call', lead); }}>
        <Phone size={14} />
    </Button>
    <VoIPCallButton
        phoneNumber={lead.phone}
        size="sm"
        className="h-8 w-8 p-0 rounded-full"
    />
    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 bg-green-50 hover:bg-green-100 rounded-full" onClick={(e) => { e.stopPropagation(); onAction('whatsapp', lead); }}>
        <MessageSquare size={14} />
    </Button>
```

**Step 2b:** Add VoIP button in **mobile card** view (around line 268-271).

Find:
```jsx
<div className="flex gap-2 pt-2 border-t mt-1">
    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('call', lead)}><Phone size={14} className="mr-1" /> Call</Button>
    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('whatsapp', lead)}><MessageSquare size={14} className="mr-1" /> WA</Button>
    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('viewNotes', lead)}><StickyNote size={14} className="mr-1" /> Notes</Button>
</div>
```

Replace with:
```jsx
<div className="flex gap-2 pt-2 border-t mt-1">
    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('call', lead)}><Phone size={14} className="mr-1" /> Call</Button>
    <VoIPCallButton phoneNumber={lead.phone} size="sm" className="flex-1" />
    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('whatsapp', lead)}><MessageSquare size={14} className="mr-1" /> WA</Button>
    <Button variant="outline" size="sm" className="flex-1" onClick={() => onAction('viewNotes', lead)}><StickyNote size={14} className="mr-1" /> Notes</Button>
</div>
```

---

#### Step C: Test on Android Phone

After making all changes:

1. **Build and deploy** your CRM (or run locally with `npm run dev`)
2. Open the CRM on an **Android phone** in **Chrome browser**
3. Go to **My Leads** page
4. You should see three buttons on each lead card: **Phone (blue)**, **VoIP (purple)**, **WhatsApp (green)**
5. Tap the **purple VoIP button**
6. Android should show: **"Open with Zoiper5"** (or open Zoiper directly if set as default)
7. Zoiper starts dialing the lead's number

**If "Complete action using" popup appears:**
- Select **Zoiper5**
- Check **"Always"** to make it the default for `sip:` links
- Next time the VoIP button will directly open Zoiper

**If nothing happens when tapping VoIP:**
- Check that Zoiper 5 is installed on the phone
- Check that the SIP account is registered (green checkmark in Zoiper)
- Try the `tel:` approach from Way 1 as a fallback

---

#### Quick Summary of All Changes

| # | File | What You Added |
|---|------|----------------|
| 1 | `src/crm/components/VoIPCallButton.jsx` | **NEW FILE** — the reusable VoIP button |
| 2 | `src/crm/pages/MobileLeadList.jsx` | Import + VoIP button in lead cards |
| 3 | `src/crm/pages/MobileLeadDetails.jsx` | Import + VoIP button in profile section |
| 4 | `src/crm/pages/MobileEmployeeDashboard.jsx` | Import + VoIP button in follow-ups |
| 5 | `src/crm/components/ActionButtonGroup.jsx` | Import + VoIP button in action grid |
| 6 | `src/crm/pages/MyLeads.jsx` | Import + VoIP button in table actions |
| 7 | `src/crm/pages/EmployeeLeadDetails.jsx` | Import + VoIP button in quick actions |
| 8 | `src/crm/pages/LeadSearch.jsx` | Import + VoIP button in search results |
| 9 | `src/crm/pages/SmartGuidance.jsx` | Import + VoIP button in AI recommendations |
| 10 | `src/crm/pages/EmployeeDashboard.jsx` | Import + VoIP button in overdue follow-ups |
| 11 | `src/crm/components/LeadActionCard.jsx` | Import + VoIP button next to phone number |
| 12 | `src/crm/pages/LeadDetail.jsx` | Import + VoIP button in quick actions |
| 13 | `src/crm/components/LeadTable.jsx` | Import + VoIP button in desktop table + mobile cards |

**Total: 1 new file + 12 file edits. Each edit is just 2 changes: add import + add button.**

---

#### How `sip:` vs `tel:` Works on Android

```
Employee taps blue "Phone" button
  → code runs: window.location.href = "tel:9876543210"
  → Android opens: Phone Dialer (regular SIM call)
  → Uses employee's personal SIM number
  → Lead sees employee's personal number

Employee taps purple "VoIP" button
  → code runs: window.location.href = "sip:+919876543210"
  → Android opens: Zoiper 5 (VoIP call over internet)
  → Uses company's SIP/virtual number
  → Lead sees company's business number
```

Both buttons call the same lead — the difference is **which app makes the call**.

---

### Way 3: Click-to-Call + Auto Call Logging (3-5 hours)

**How it works:** Employee taps "VoIP Call" → Zoiper opens and makes the call →
When employee comes back to CRM, a popup asks them to log the call result →
Call gets saved to the database automatically.

**What to do:**

```jsx
// VoIP Call with Auto-Logging
import { useState, useEffect } from 'react';

const VoIPCallWithLogging = ({ lead, onCallLogged }) => {
  const [callStarted, setCallStarted] = useState(false);
  const [callStartTime, setCallStartTime] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);

  // Detect when employee returns to the CRM after making a call
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && callStarted) {
        // Employee came back from Zoiper
        setShowLogForm(true);
        setCallStarted(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [callStarted]);

  const startVoIPCall = () => {
    const cleanNumber = lead.phone.replace(/[\s\-()]/g, '');
    const fullNumber = cleanNumber.startsWith('+91') ? cleanNumber : `+91${cleanNumber}`;

    // Record when call started (to estimate duration)
    setCallStartTime(new Date());
    setCallStarted(true);

    // Open Zoiper
    window.location.href = `sip:${fullNumber}`;
  };

  const handleLogCall = (status, notes) => {
    const duration = callStartTime
      ? Math.round((new Date() - callStartTime) / 60000) // minutes
      : 0;

    // Save to your database
    onCallLogged({
      leadId: lead.id,
      leadName: lead.name,
      phone: lead.phone,
      callType: 'Outgoing',
      status: status,        // Connected, Not Answered, Busy, etc.
      duration: duration,
      notes: notes,
      callDate: new Date().toISOString(),
      method: 'voip_zoiper'  // Track that this was a VoIP call
    });

    setShowLogForm(false);
    setCallStartTime(null);
  };

  return (
    <>
      {/* VoIP Call Button */}
      <button onClick={startVoIPCall}>
        VoIP Call {lead.name}
      </button>

      {/* Call Logging Popup — shows after employee returns from Zoiper */}
      {showLogForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999
        }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
            <h3>Log Call with {lead.name}</h3>

            <p>How did the call go?</p>

            {/* Quick status buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => handleLogCall('Connected', '')}>
                Connected - Spoke to lead
              </button>
              <button onClick={() => handleLogCall('Not Answered', '')}>
                Not Answered
              </button>
              <button onClick={() => handleLogCall('Busy', '')}>
                Busy / Call Back Later
              </button>
              <button onClick={() => handleLogCall('Switched Off', '')}>
                Switched Off / Unreachable
              </button>
              <button onClick={() => handleLogCall('Wrong Number', '')}>
                Wrong Number
              </button>
              <button onClick={() => setShowLogForm(false)}>
                Skip (Don't Log)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

**How the flow works for the employee:**

```
1. Employee opens CRM on Android Chrome
2. Sees their assigned leads
3. Taps "VoIP Call" on a lead
4. Zoiper 5 opens → call starts automatically
5. Employee talks to the lead
6. Call ends → Employee switches back to CRM (via recent apps)
7. CRM shows popup: "How did the call go?"
8. Employee taps: "Connected" / "Not Answered" / "Busy"
9. Call gets logged to database automatically
10. Employee moves to next lead
```

**Pros:** Automated call tracking, duration estimation, fast workflow
**Cons:** Duration is estimated (not exact), depends on employee returning to CRM

---

### Way 4: PBX Server for Full Call Management (Advanced — 1-2 weeks)

> **Note:** This approach is for when your team grows and needs full call center features.
> Start with Way 1 or 2 first. Move to this when ready.

**How it works:** Set up your own phone server (PBX) that manages all calls.
Every call is automatically recorded, logged, and tracked.

**What you need:**

1. **PBX Software** — Asterisk (free, open-source) or FreeSWITCH
2. **Cloud Server** — DigitalOcean/AWS/Hostinger VPS (Rs 500-2000/month)
3. **SIP Trunk** — From any provider (connects PBX to phone network)
4. **Developer** — Someone with Linux + VoIP experience

**Architecture:**

```
Employee Phone (Zoiper 5)
    |
    | SIP over Internet
    |
    v
Your PBX Server (Asterisk/FreeSWITCH)
    |
    |--- Records all calls (audio files)
    |--- Logs all call details (CDR)
    |--- Routes calls to correct employee
    |
    | SIP Trunk
    |
    v
SIP Provider → Phone Network → Lead's Phone
```

**What a PBX gives you:**

| Feature | Description |
|---|---|
| **Auto Call Recording** | Every call recorded as audio file |
| **CDR (Call Detail Records)** | Exact duration, start time, end time for every call |
| **Call Routing** | Route incoming calls to the assigned employee |
| **IVR** | "Press 1 for sales, Press 2 for support" |
| **Call Queue** | If employee is busy, put caller in queue |
| **Click-to-Call API** | CRM sends API request → PBX calls employee → PBX calls lead → connects both |
| **Call Transfer** | Employee can transfer call to manager |
| **Whisper/Barge** | Manager can listen to live calls for training |

**Setting up Asterisk PBX (overview):**

```bash
# On a Ubuntu/Debian VPS server:

# 1. Install Asterisk
sudo apt update
sudo apt install asterisk

# 2. Configure SIP extensions (one per employee)
# Edit /etc/asterisk/pjsip.conf
# Add:
# [emp001]
# type=endpoint
# context=internal
# auth=emp001_auth
# aors=emp001_aor
# callerid="Employee Name" <virtual-number>

# 3. Configure SIP trunk (connection to provider)
# Edit /etc/asterisk/pjsip.conf
# Add your SIP provider credentials

# 4. Configure dial plan (how calls are routed)
# Edit /etc/asterisk/extensions.conf

# 5. Enable CDR logging to database
# Edit /etc/asterisk/cdr.conf
# Set up CDR to write to PostgreSQL (same as your Supabase)
```

**Syncing CDR to your CRM database:**

```javascript
// Example: Webhook from PBX to your Supabase
// When a call ends, PBX sends call data to your Supabase Edge Function

// Supabase Edge Function (example)
const handleCallEnd = async (callData) => {
  await supabase.from('calls').insert({
    employee_id: callData.employee_extension,  // map extension to employee
    lead_id: null,  // match by phone number
    call_type: callData.direction,  // inbound or outbound
    status: callData.disposition,   // ANSWERED, NO ANSWER, BUSY
    duration: callData.duration,    // exact seconds
    notes: '',
    call_date: callData.start_time,
    recording_url: callData.recording_file  // link to audio recording
  });
};
```

**Pros:** Full call management, exact tracking, recording, professional
**Cons:** Needs server, costs more, needs VoIP-experienced developer

---

## Employee Daily Workflow

### With Way 1 or 2 (Simple Setup)

```
Morning:
  1. Employee opens Zoiper 5 — checks green checkmark (connected)
  2. Opens Fanbe CRM in Chrome browser on Android
  3. Goes to "My Leads" page

For each lead:
  4. Sees lead name, phone, project, status
  5. Taps "Call" button → Zoiper opens → call starts
  6. Talks to lead
  7. After call → switches back to CRM
  8. Logs the call manually in Daily Calling page
  9. If interested → schedules site visit
  10. If need follow-up → schedules follow-up date
  11. Moves to next lead

End of day:
  12. Check call count in dashboard
  13. Submit EOD report
```

### With Way 3 (Auto-Logging)

```
Same as above, but steps 7-8 become automatic:
  7. After call → switches back to CRM
  8. Popup appears → tap "Connected" or "Not Answered"
  → Call is auto-logged! Move to next lead immediately.
```

### Tips for Fast Calling

1. **Set Zoiper as default dialer** — No popup asking "Open with?"
2. **Keep Zoiper running** — Don't close the app, keep it in background
3. **Use WiFi when possible** — More stable than mobile data
4. **Sort leads by priority** — Call hot leads first
5. **Use follow-up dates** — Know exactly who to call today
6. **Quick notes after each call** — Even 2-3 words help

---

## Comparison Table — Which Way to Choose

| | Way 1: tel: Links | Way 2: sip: Button | Way 3: Auto-Logging | Way 4: PBX Server |
|---|---|---|---|---|
| **Effort** | No code change | 1-2 hours | 3-5 hours | 1-2 weeks |
| **Cost** | SIP provider only | SIP provider only | SIP provider only | SIP + Server (Rs 2-5K/mo) |
| **Call Recording** | No | No | No | Yes |
| **Auto Call Logging** | No (manual) | No (manual) | Yes (popup) | Yes (automatic) |
| **Exact Duration** | No | No | Estimated | Exact |
| **Works Offline** | No | No | No | No |
| **Need VoIP Expert** | No | No | No | Yes |
| **Incoming Call Routing** | No | No | No | Yes |
| **Best For** | Quick start | Better UX | Productivity | Call center |
| **Recommended** | Start here | Upgrade to this | Then this | When 10+ employees |

**Our recommendation: Start with Way 1 → Move to Way 3 when comfortable.**

---

## Troubleshooting Common Issues

### Zoiper won't register (Red X)

| Problem | Solution |
|---|---|
| Wrong credentials | Double-check username, password, server with provider |
| Wrong port | Try adding `:5060` after server address |
| No internet | Check WiFi or mobile data is on |
| Firewall blocking | Switch transport from UDP to TCP in Zoiper settings |
| Provider requires Auth Username | Enter it in Zoiper account settings under "Authentication" |

### Call connects but no audio (one-way or both ways)

| Problem | Solution |
|---|---|
| NAT issue | Enable STUN in Zoiper: Settings > Accounts > Network > STUN |
| Codec mismatch | Ensure G.711 alaw is enabled in codec settings |
| Firewall blocking RTP | Use TCP transport, or ask provider about SRTP |
| Microphone permission | Check Android settings > Apps > Zoiper > Permissions |

### sip: links not opening Zoiper

| Problem | Solution |
|---|---|
| Zoiper not set as SIP handler | Android Settings > Apps > Default Apps > Opening Links > Zoiper |
| Using tel: instead of sip: | `sip:` links specifically target VoIP apps |
| Chrome blocking intent | Try: `intent://number#Intent;scheme=sip;package=com.zoiper.android.app;end` |

### Zoiper not receiving incoming calls (background)

This is a known Android limitation. Android kills background apps to save battery.

**Solutions:**
1. Disable battery optimization for Zoiper: Settings > Battery > Zoiper > Unrestricted
2. In Zoiper: Settings > Incoming Calls > Use Push Notifications (requires premium)
3. Keep Zoiper in recent apps (don't swipe it away)

### Call quality is poor

| Problem | Solution |
|---|---|
| Choppy audio | Switch to WiFi, or check signal strength |
| Echo | Enable echo cancellation in Zoiper audio settings |
| Delay/lag | Change codec to G.711 (lower quality but less delay) |
| Background noise | Use headphones or earbuds with microphone |

---

## SIP Providers for India

### Quick Comparison

| Provider | Monthly Cost | Per-Min Cost | Indian DID | Free Trial | Best For |
|---|---|---|---|---|---|
| **FreJun** | Rs 1,299+ | Included | Yes | Yes | Indian CRM integration |
| **Zadarma** | Free plan | ~Rs 0.5/min | Yes | Yes (free) | Budget/testing |
| **CloudBharat** | Contact | Variable | Yes | Yes | Indian enterprise |
| **Servetel** | Rs 999+ | Included | Yes | Yes | IVR + telephony |
| **CallHippo** | Rs 1,300+ | Included | Yes | 10-day trial | Virtual numbers |
| **MyOperator** | Rs 1,500+ | Included | Yes | Yes | Toll-free + tracking |
| **Telnyx** | Pay-per-use | ~Rs 0.5/min | Limited | $2 credit | Developer-friendly |
| **Twilio** | Pay-per-use | ~Rs 1/min | Yes | $15 credit | API + automation |

### Recommended for getting started

**For testing/development:** Zadarma (free account, pay per minute)

**For production (small team):** FreJun or Servetel (Indian support, CRM-friendly)

**For production (growing team):** MyOperator or CloudBharat (call center features)

---

## Glossary

| Term | Simple Explanation |
|---|---|
| **VoIP** | Voice over Internet Protocol — making phone calls using internet instead of SIM |
| **SIP** | Session Initiation Protocol — the technology standard VoIP uses to make calls |
| **Softphone** | Software that acts as a phone (Zoiper is a softphone) |
| **SIP Trunk** | A service that connects your internet calls to the regular phone network |
| **DID** | Direct Inward Dial — a virtual phone number (the number leads will see) |
| **PBX** | Private Branch Exchange — a phone server that manages calls for a company |
| **CDR** | Call Detail Record — log of every call (who called, duration, time) |
| **Codec** | Compression format for voice audio (G.711, Opus, G.722 are common) |
| **STUN** | Helps VoIP calls work through firewalls and routers |
| **RTP** | Real-time Transport Protocol — carries the actual voice audio |
| **IVR** | Interactive Voice Response — the "Press 1 for..." automated menu |
| **NAT** | Network Address Translation — how routers share one IP among many devices |
| **URI** | Uniform Resource Identifier — like a web address but for calling: `sip:number` |
| **Extension** | Internal phone number for an employee (like ext. 101, 102) |

---

## Auto-Provisioning Zoiper for Multiple Employees

If you have many employees and don't want to configure each phone manually:

### Option A: Zoiper Provisioning URL

Zoiper 5 supports auto-configuration via a provisioning URL.
You can host a simple XML file on your server.

**Step 1:** Create a config file for each employee:

```xml
<?xml version="1.0" encoding="utf-8"?>
<ZoiperConfiguration>
  <Accounts>
    <Account>
      <AccountName>Fanbe - Employee Name</AccountName>
      <Protocol>SIP</Protocol>
      <ServerHost>sip.yourprovider.com</ServerHost>
      <ServerPort>5060</ServerPort>
      <Username>emp001</Username>
      <Password>xK9#mP2$vL</Password>
      <Transport>TCP</Transport>
    </Account>
  </Accounts>
</ZoiperConfiguration>
```

**Step 2:** Host the file on your web server:
```
https://yourcrm.com/zoiper-config/emp001.xml
```

**Step 3:** On the employee's phone, in Zoiper:
1. Settings > Accounts > Add Account
2. Choose "I already have an account" > "Configuration URL"
3. Enter the URL: `https://yourcrm.com/zoiper-config/emp001.xml`
4. Zoiper auto-fills all settings

### Option B: Share Config via QR Code

1. Generate a QR code containing the provisioning URL
2. Employee scans QR code with Zoiper
3. Account is configured automatically

This is faster when onboarding new employees.

---

## Security Notes

1. **Never hardcode SIP passwords** in your web CRM frontend code
2. **Use HTTPS** for provisioning config URLs (contains passwords)
3. **Change SIP passwords** when an employee leaves
4. **Enable SRTP** (encrypted voice) if your provider supports it
5. **Use TLS transport** instead of TCP/UDP when available
6. **Restrict IP** on SIP provider dashboard if possible (whitelist office/VPN IPs)

---

## Next Steps

1. **Today:** Sign up for a SIP provider (try Zadarma free account for testing)
2. **Day 1:** Install Zoiper 5 on one test phone, configure SIP account
3. **Day 1:** Make a test call — verify it works
4. **Day 2:** Set up Way 1 (use tel: links, set Zoiper as default dialer)
5. **Day 3:** Roll out to all employees — install Zoiper, configure accounts
6. **Week 2:** Upgrade to Way 2 (add sip: VoIP button in CRM)
7. **Week 3:** Upgrade to Way 3 (auto call logging)
8. **Month 2+:** Evaluate if PBX (Way 4) is needed

---

*Guide prepared for Fanbe Group CRM — VoIP Integration with Zoiper 5*
*Last updated: March 2026*
