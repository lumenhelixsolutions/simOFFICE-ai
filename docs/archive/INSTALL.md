# SimOffice — Install Guide
# Start here. Follow every step in order.

---

## STEP 1: Install Node.js

You need Node.js to run this. If you already have it, skip to Step 2.

**Windows:**
1. Go to https://nodejs.org
2. Click the big green button that says "LTS" (not "Current")
3. Run the installer
4. Click Next through everything (keep all defaults)
5. Restart your computer

**Mac:**
1. Go to https://nodejs.org
2. Click the big green button that says "LTS"
3. Run the installer
4. Done

**Check it worked:**
Open a terminal (Windows: search "Command Prompt" or "PowerShell") and type:
```
node --version
```
You should see something like `v20.x.x` or `v22.x.x`. If you see an error, the install didn't work — try restarting your computer.

---

## STEP 2: Download SimOffice

Download the `simoffice` folder from this chat to your computer.

Put it somewhere simple like:
- Windows: `C:\Users\YourName\Desktop\simoffice`
- Mac: `~/Desktop/simoffice`

---

## STEP 3: Open a terminal in the client folder

**Windows:**
1. Open File Explorer
2. Navigate to the `simoffice` folder, then into the `client` folder
3. Click the address bar at the top, type `cmd`, press Enter
4. A black terminal window opens — you're in the right folder

**Mac:**
1. Open Terminal (search "Terminal" in Spotlight)
2. Type: `cd ~/Desktop/simoffice/client` (adjust the path to wherever you put it)
3. Press Enter

You should see something like:
```
C:\Users\YourName\Desktop\simoffice\client>
```
or
```
~/Desktop/simoffice/client $
```

---

## STEP 4: Install dependencies

In that same terminal, type:
```
npm install
```

Press Enter. Wait. This downloads all the libraries. It takes 1-3 minutes. You'll see a progress bar and a bunch of text. That's normal.

When it's done you'll see something like:
```
added 487 packages in 45s
```

If you see errors about "WARN" — that's fine, ignore warnings.
If you see errors about "ERR!" — something went wrong. Screenshot it and show me.

---

## STEP 5: Start SimOffice

In that same terminal, type:
```
npm run dev
```

Press Enter. You should see:
```
  VITE v4.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## STEP 6: Open in browser

Open Chrome (or any browser). Go to:

```
http://localhost:5173
```

You should see the 3D office with furniture.

---

## DONE

You're running SimOffice.

- Drag to rotate the camera
- Scroll to zoom
- Click "Furniture" button to add items
- Click "GO LIVE" to activate agents

---

## To stop it

Go back to the terminal and press `Ctrl + C`.

## To start it again later

```
cd simoffice/client
npm run dev
```

You only need to run `npm install` once. After that it's just `npm run dev` every time.

---

## Troubleshooting

**"npm is not recognized"**
→ Node.js isn't installed. Go back to Step 1.

**"Cannot find module" errors**
→ You skipped `npm install`. Go back to Step 4.

**Blank white screen**
→ Open browser console (F12 → Console tab). Screenshot the red errors and show me.

**"Port 5173 already in use"**
→ You have another dev server running. Close it or use: `npm run dev -- --port 5174`

---
