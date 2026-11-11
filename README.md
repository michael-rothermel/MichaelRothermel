# michaelrothermel.com: setup and editing guide

A one-page site with your Two Shots featured projects, the project index and a video lightbox. It's hosted free on **GitHub Pages**, and you edit projects in **Pages CMS**, a simple form-based editor. No coding needed for day-to-day updates.

**What's in this folder**

| File | What it is |
|---|---|
| `index.html` | The page itself (headline, approach text, contact section) |
| `styles.css` | Colors, fonts and layout. Colors are at the top. |
| `main.js` | Builds the project sections and the lightbox. You shouldn't need to touch it. |
| `data/projects.json` | Your project list. Edit it through Pages CMS. |
| `data/site.json` | Email, availability, testimonial and social links. Also edited in Pages CMS. |
| `images/` | Your project stills. Pages CMS uploads them here. |
| `.pages.yml` | Tells Pages CMS what's editable. A copy is in `setup/pages-cms-settings.txt`. |

---

## Part 1: Put the site on GitHub (about 15 minutes, once)

1. **Create a free account** at [github.com](https://github.com).
2. Click **+** (top right) → **New repository**.
   - Name: `michaelrothermel-site`
   - Choose **Public** (GitHub Pages is free for public repositories).
   - Click **Create repository**.
3. On the new repository page, click **uploading an existing file**.
4. Unzip this folder on your computer, open it, and drag **everything inside it** into the browser window: `index.html`, `styles.css`, `main.js`, `favicon.svg`, `README.md`, and the `data`, `images` and `setup` folders.
5. **The hidden settings file.** `.pages.yml` starts with a dot, so your computer hides it. Either:
   - On a Mac, press **Cmd + Shift + .** in Finder to show hidden files, then drag `.pages.yml` in too, or
   - After uploading, click **Add file → Create new file** on GitHub, name it `.pages.yml` (with the dot), and paste in the contents of `setup/pages-cms-settings.txt`.
6. Click **Commit changes**.

## Part 2: Turn on the website

1. In the repository, click **Settings** → **Pages** (left sidebar).
2. Under **Build and deployment**, set Source to **Deploy from a branch**, Branch to **main**, folder **/ (root)**, then **Save**.
3. After a minute or two the page shows your temporary address, like `https://YOUR-USERNAME.github.io/michaelrothermel-site/`. Open it to check the site.

## Part 3: Connect your Pages CMS editor

1. Go to [app.pagescms.org](https://app.pagescms.org) and **sign in with GitHub**.
2. When asked, allow Pages CMS access to the `michaelrothermel-site` repository.
3. Open the repository. You'll see **Projects** and **Site details** in the sidebar.

Bookmark that page. It's where you'll make all your updates.

---

## Everyday editing

Every save in Pages CMS updates the live site within about a minute. Refresh the page to see it.

**Add a project**
1. Open **Projects** → **Add an entry** at the bottom of the list.
2. Fill in the title, category, agency or format, a thumbnail still, and the video link.
3. Drag the entry to where you want it in the list, then **Save**.

**Remove a project:** delete its entry, or tick **Hide from site** to keep it saved but off the page.

**Reorder projects:** drag the entries. The index shows them grouped by category, in list order.

**Change the Two Shots projects:** tick **Feature in Two Shots** on up to three projects. They show in list order, alternating left and right. Each one can have a **second still** (a contrasting frame) and **one line about the edit**. If there's no second still, the thumbnail is used twice. If nothing is ticked, the section hides itself.

**Stills:** use 16:9 JPGs around 1600 pixels wide, under 1 MB each. Projects without a still show a simple colored placeholder.

**Video links:** paste the normal link from Vimeo or YouTube, such as `https://vimeo.com/123456789` or `https://youtu.be/abc123`. Unlisted Vimeo links (with the extra code at the end) work too. On Vimeo, check that the video's privacy settings allow embedding. Leave the field empty to show "Video coming soon."

**Site details:** update your contact email, availability ("Booking freelance edits for January"), a testimonial, and Instagram, Vimeo or LinkedIn links. Empty fields are hidden on the site.

**Editing the page text:** the headline, approach paragraphs and the "Featured on / Cut for" strip live in `index.html`. Open it on GitHub, click the pencil icon, edit the words between the tags, and commit.

---

## Part 4: Point michaelrothermel.com at the new site

Do this once you're happy with the site on its temporary address. **Your current Squarespace site goes offline when the DNS switches over.**

1. **On GitHub:** Settings → Pages → **Custom domain** → enter `www.michaelrothermel.com` → **Save**.
2. **On Name.com:** open your domain → **Manage DNS records**.
   - **Delete** the existing records that point the bare domain (host empty or `@`) and `www` at Squarespace.
   - **Do not delete MX or TXT records.** Those run your email (hello@michaelrothermel.com).
   - Add four **A** records with the host empty (or `@`), one for each address:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - Add a **CNAME** record: host `www`, answer `YOUR-USERNAME.github.io` (your GitHub username, no repository name).
3. Wait. DNS changes can take up to 24 hours. When GitHub's Pages settings show the domain is working, tick **Enforce HTTPS**.
4. Once michaelrothermel.com loads the new site and your email still works, you can cancel the Squarespace website plan.

---

## Previewing on your own computer

Double-clicking `index.html` opens the page, but the projects won't load, because browsers block reading the data files that way. Check changes on the live site instead, or use a local server such as the **Live Server** extension in VS Code.

## Changing the look

- Colors: the `:root` block at the top of `styles.css`. Category colors also appear at the top of `main.js` (`CATEGORIES`); change both together.
- Fonts: Archivo and Instrument Serif from Google Fonts, linked in `index.html`.
- Animations: the hero timeline and circle rotation are in the "interactions" part of `main.js`; the contact bars are the "Contact bars" rules in `styles.css`. They switch off on phones (no cursor) and for visitors who turn on "reduce motion" in their device settings. On phones, tapping the circles rotates them.
