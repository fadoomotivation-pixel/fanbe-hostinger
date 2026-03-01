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

### Way 2: Dedicated VoIP Button with Zoiper Intent (1-2 hours)

**How it works:** Add a separate "VoIP Call" button in the CRM alongside the existing
phone and WhatsApp buttons. This button uses `sip:` URI scheme which specifically
targets VoIP apps like Zoiper.

**What to do:**

Add a button that uses the `sip:` URI scheme:

```html
<a href="sip:+919876543210">VoIP Call</a>
```

Or in React (your CRM uses React):

```jsx
// VoIP Call Button Component
const VoIPCallButton = ({ phoneNumber, leadName }) => {

  const handleVoIPCall = () => {
    // Clean the phone number (remove spaces, dashes)
    const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');

    // Add country code if not present
    const fullNumber = cleanNumber.startsWith('+91')
      ? cleanNumber
      : cleanNumber.startsWith('91')
        ? `+${cleanNumber}`
        : `+91${cleanNumber}`;

    // Open with sip: URI — this will trigger Zoiper on Android
    window.location.href = `sip:${fullNumber}`;
  };

  return (
    <button
      onClick={handleVoIPCall}
      style={{
        backgroundColor: '#7C3AED',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      VoIP Call
    </button>
  );
};
```

**Where to place this button:** Next to the existing Phone and WhatsApp buttons
on the lead card/list in your CRM.

**Android Intent alternative (more reliable):**

If `sip:` links don't trigger Zoiper on some phones, use an Android intent URL:

```javascript
function callViaZoiper(phoneNumber) {
  const cleanNumber = phoneNumber.replace(/[\s\-()]/g, '');

  // Try sip: first
  window.location.href = `sip:${cleanNumber}`;

  // If Zoiper is not installed, this will fail silently
  // You can add a fallback after a timeout
  setTimeout(() => {
    // If still on same page, Zoiper might not be installed
    // Redirect to Play Store
    if (document.hasFocus()) {
      const install = confirm('Zoiper app not found. Install from Play Store?');
      if (install) {
        window.location.href = 'https://play.google.com/store/apps/details?id=com.zoiper.android.app';
      }
    }
  }, 2000);
}
```

**Pros:** Clear separation between VoIP and regular calls
**Cons:** Small code addition needed

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
