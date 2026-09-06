# Google Sheet cloud sync

This lets the vault app automatically back itself up to a Google Sheet you
own, instead of you exporting a backup file by hand. Every save pushes the
*same encrypted blob* the app already stores in the browser — Google never
sees plaintext passwords, account numbers, etc., as long as you've set a
master password in the app. On load, the app fetches the latest blob back
from the sheet so it reflects your most recent save from any device/browser.

## Deploy the backend

1. Create a new Google Sheet (any name).
2. In the Sheet, go to **Extensions → Apps Script**.
3. Delete the placeholder code and paste in the contents of `Code.gs` from
   this folder.
4. (Recommended) Add a shared secret so random visitors can't hit your
   endpoint:
   - **Project Settings → Script Properties → Add script property**
   - Name: `SECRET_KEY`, Value: any long random string.
5. **Deploy → New deployment → Select type: Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, authorize the requested permissions, and copy the
     Web App URL (ends in `/exec`).

## Connect the app

1. Open the vault, set a master password if you haven't already (Cloud
   sync refuses to enable until this is done, so the sheet never receives
   plaintext).
2. Click **Cloud sync off** in the sidebar footer.
3. Paste the Web App URL. If you set `SECRET_KEY`, paste the same value
   into the **Secret key** field.
4. Click **Test connection** to confirm it works, then check **Enable
   automatic sync** and **Save**.

From then on, every change is pushed to the sheet a moment after you make
it, and the app fetches the sheet's latest copy each time you load the
page.

## Notes

- The `Latest` sheet tab always holds the single current copy. The
  `History` tab appends every save, so you have a rollback trail if
  something gets overwritten by mistake.
- The Web App URL (plus secret key, if set) is effectively a password for
  your vault backup — don't share it or commit it anywhere public.
- If you ever remove the master password, sync will keep working but the
  sheet will then receive plain, readable data. The app warns you in the
  Cloud sync panel when this is the case.
