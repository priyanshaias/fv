# Forest Volunteers (FV)

A web app for divisions of the Directorate of Forests, West Bengal, to enter the **List of Forest Volunteers** they have engaged. An operator signs in, picks a circle and a division, and fills a sheet that works like Excel. Saves go in directly, with no approval. Admins see every division and a full change log on the **Dashboard**.

```
GitHub Pages (docs/)  ──►  Apps Script API (apps-script/Code.gs)  ──►  "Forest Volunteers" Google Sheet
  sign in · sheet · dashboard     checks the sign-in, reads/writes          Volunteers · Change Log · Lists
```

FV is completely separate from UPMC2: it has its own repo, Apps Script project, Google Sheet and sessions. Only the usernames and passwords are the same, because the same hashes are copied into its private `Config.local.gs`.

## What the operator sees
- **Circle → Division**, with the number of volunteers entered and when the division was last saved.
- **The sheet.** It has the columns of the circular: Sl No, Name, Date of Birth, Educational Qualification, Dept. approval ref, Directorate ref, Appointment order, Date of Joining, Present place (Div HQ / Range / Beat / Camp plus its name) and Nature of works. Circle and Division come from the choice already made.
  - Type in cells. **Enter** moves down and **Tab** moves across.
  - **Paste rows straight from Excel**. Both the circular's 12-column format and plain copied columns work.
  - Dates are tidied to DD-MM-YYYY, so 1/7/25 becomes 01-07-2025.
  - **Yellow** cells are changed but not saved. **Red** cells need fixing: a missing name or a wrong date.
  - **Save** with the floppy-disk button or **Ctrl + S**, as often as you like. Unsaved changes are also kept on the device, so a closed tab or a power cut loses nothing.
  - Removing a row (×) takes effect on Save. Press × again to undo.
  - If two people save the same division, the second is warned. They can view the other person's list, download their own changes, or save over it.
- **Download Excel** gives the division's list in the circular's column order.

## Dashboard (admins, `#/admin`)
- Volunteers entered, divisions entered out of the total, changes recorded, and saves today.
- Each division's count, last save and the person who saved it. Click a row to open that division.
- **Change log**: every Added, Edited or Removed value, with old → new, the person's name, designation, mobile and username, and the time. You can filter it by circle and action and search it.
- Downloads of all volunteers and of the change log, plus a link to the Google Sheet.

## Setup (once)

### 1. Apps Script API (a new project of its own)
1. Go to https://script.google.com and click **New project**. Rename it `FV API`.
2. Replace `Code.gs` with `apps-script/Code.gs`.
3. Click **+ → Script** and name it `Config.local`. Paste the private `apps-script/Config.local.gs` from this computer into it. That file is not in GitHub; `Config.example.gs` is the blank template.
4. In **Project Settings (⚙)**, tick **Show "appsscript.json" manifest file in editor**, then replace that file with `apps-script/appsscript.json`.
5. Select the function **fvSetup** and click **Run**. Allow the permission.
   - If you see "Google hasn't verified this app", click **Advanced → Go to FV API (unsafe)**. This is your own script.
   - The log shows the link of the new **Forest Volunteers** sheet, which is created in your Drive.
6. Go to **Deploy → New deployment → ⚙ → Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then copy the URL that ends in `/exec`.

### 2. Connect the website
1. Put the `/exec` URL in `docs/js/config.js`:
   ```js
   API_URL: 'https://script.google.com/macros/s/…/exec',
   ```
2. Push. GitHub Pages serves `docs/` from `main`.

### Circles and divisions
These are in the **Lists** tab of the sheet, one row per division (Circle, Office, Division). Add or rename rows there, and the app picks the change up on the next load. Do not rename a division that already has volunteers; add the new name instead.

### Changing a password
In Apps Script, run `makeHash('new password')`, copy the logged `salt` and `hash` into `Config.local.gs`, and save. No redeploy is needed.

### Updating the API later
Go to **Deploy → Manage deployments → ✎ → Version: New version → Deploy**. The `/exec` URL stays the same.

## Local testing
```bash
cd docs && python3 -m http.server 8772
```
Open http://localhost:8772. With no `API_URL`, or with `?demo` added to the address, it runs on made-up data kept in that browser. **Try with demo data** signs you in.
