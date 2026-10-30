# Forest Volunteers (FV)

A web app for divisions of the Directorate of Forests, West Bengal, to enter the **List of Forest Volunteers** they have engaged. An operator signs in, picks a circle and a division, and fills a sheet that works like Excel. Saves go in directly, with no approval. Admins see every division and a full change log on the **Dashboard**.

```
GitHub Pages (docs/)  ──►  Apps Script API (apps-script/Code.gs)  ──►  "Forest Volunteers" Google Sheet
  sign in · sheet · dashboard     checks the sign-in, reads/writes          Volunteers · Change Log · Lists
```

Live at **https://fv.forestwb.in** (GitHub Pages, `docs/CNAME`).

FV is completely separate from UPMC2: it has its own repo, Apps Script project, Google Sheet and sessions. Only the usernames and passwords are the same, because the same hashes are copied into its private `Config.local.gs`.

## What the operator sees
- **Added vs details missing.** A volunteer counts as **added** only when every detail is filled: name, date of birth, qualification, the three references, date of joining, place of joining (and its name unless Div HQ), and nature of works (with the work written out for Others). Part-filled entries can be saved and completed later. Each division shows **Total volunteers added** and **Details missing** at the top; pressing **Details missing** opens the next incomplete volunteer at the first empty field. Incomplete rows have an orange mark and their empty cells say *missing*.
- **Circle → Division**, with the number of volunteers entered and when the division was last saved.
- **Nature of works** uses the DL / CDL duty list (Cleaning, Nursery, Timber depot, Driver, Mali, Protection & patrolling, Human-animal conflict, Night guard) plus **Others**, which needs the actual work written out. Duty and details are kept together in one sheet column, e.g. `Others: Mahut of elephant Champa`.
- **Edit panel.** **Edit** at the end of any row, or **Add volunteer**, opens a panel for one volunteer at a time:
  - a calendar for both dates, with month and year dropdowns and decade buttons for the date of birth (age is shown) and **Today** for joining;
  - tap-to-choose buttons for qualification, place of joining and main duty;
  - references, place names and duty details already used in the division offered as one-tap chips;
  - **Previous / Next** to move through the volunteers, and **Save** in the panel. **Esc** closes it.
- **The sheet** shows the list in the circular's columns and cannot be typed into. Clicking any row, or any cell, opens that volunteer in the edit panel at that field; clicking a date cell opens the calendar. The last row, **Add a volunteer**, opens a new one.
  - **Yellow** cells are changed but not saved; **red** ones need fixing (a missing name, a wrong date, or "Others" without the work written).
  - **Save** with the floppy-disk button (in the toolbar or the panel) or **Ctrl + S**. Unsaved changes are also kept on the device, so a closed tab or a power cut loses nothing.
  - If two people save the same division, the second is warned and can see the other list, download their own, or save over it.
- **Present place of posting** is either **Div HQ**, or a **Range** (its name typed in) and, within it, the **Range HQ**, a **Beat** or a **Camp** (name typed in). Names already used in the division are offered as chips. The sheet keeps three columns: Posted at, Range name, and Within the range (e.g. `Beat: Duttar`). Places saved in the earlier format ("Duttar Beat under Sajnekhali Wildlife Sanctuary Range") are converted by `convertPlaces()` (run once) and on reading.
- **Download Excel** gives the division's list in the circular's column order.

## Dashboard (admins, `#/admin`)
The dashboard is in `docs/js/dashboard.js`. It reads every division at once and works out everything in the browser, so the Apps Script needs no change for it.
- **Cards** at the top: volunteers entered, added, details missing, divisions reporting, divisions not started, average age, volunteers in beats and camps, and changes this week. Click a card to filter or to jump to the matching list.
- **Filters**: search, circle, division, details (added / missing), place of posting, nature of works, qualification, age, and missing detail. Each option shows how many volunteers it has. Active filters show as chips, and each chip removes its filter.
- **Overview tab, with charts you can click to filter:**
  - progress by circle or by division (added and missing);
  - place of posting;
  - nature of works;
  - qualification;
  - age;
  - date of joining by month or year;
  - what is missing most;
  - activity over the last 30 days (click a day to see its changes);
  - divisions to follow up.
- **Volunteers tab**: every matching volunteer, sortable, with what is missing. Click a row to open the division.
- **Divisions tab**: each division's volunteers, added, missing, progress, last save and who saved it. Show all divisions, those that need follow-up, those not started or those complete. Sort by circle, least added, most missing, most volunteers or the longest since the last save.
- **Change log tab**: every Added, Edited or Removed value with old → new, the person's name, designation, mobile and username, and the time. Filter by circle, action, period (today, 7 days, 30 days) and person, or search it.
- **Reports tab**: each report comes as a PDF (Government of West Bengal letterhead) or Excel, for whatever the filters cover:
  - **Division progress**: circle by circle, with totals; can show only the divisions that need follow-up.
  - **Follow-up list**: divisions not started, and each volunteer with details missing. **Copy as message** gives a WhatsApp or e-mail text.
  - **List of Forest Volunteers**: the circular's format, division by division.
  - **Abstract**: circle-wise (or division-wise for one circle) totals of added and missing, place of posting, nature of works, qualification and age.
  - **Change log** for a period, with a division-by-division summary.
- **Reports** is also in the name menu (`#/admin/reports`). PDFs are made with pdfmake, which loads from cdnjs the first time one is needed.

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
