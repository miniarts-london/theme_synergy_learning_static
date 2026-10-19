# Task 1: Synergy Learning theme static page

This is a standalone HTML page built from `concept.png` with Bootstrap 5.3 and Open Sans. To view it, open `index.html` in a browser (double-clicking it works), or serve the folder (`npx serve .`). The compiled stylesheet and script are included, so viewing it needs no build.

The styles are written in Sass and the script in modern JavaScript, and Gulp builds both. To change them:

```bash
npm install        # once
npm run watch      # while editing: rebuilds the CSS and the JavaScript on every save, with source maps
npm run build      # before handing in: lints the Sass, then builds both
npm run lint       # lint the Sass only
```

Edit `scss/` and `js/src/`, never `css/styles.css` or `js/build/`, which are overwritten on every build.

```
task1/
├── index.html            Semantic markup, Bootstrap 5.3.3 + Open Sans from CDN (SRI-pinned)
├── scss/                 Sass source: the theme layer on top of Bootstrap
│   ├── styles.scss           Entry point: loads the partials below in cascade order
│   ├── _variables.scss       Brand colours, font stack, Bootstrap's breakpoints (compile time only)
│   ├── _mixins.scss          up()/down() breakpoint mixins, button-outline()
│   ├── _tokens.scss          CSS custom properties and Bootstrap hooks (runtime)
│   ├── _base.scss            Page, headings, focus style, skip link
│   └── _buttons · _header · _hero · _login · _catalogue · _video · _footer · _motion
├── css/styles.css        Compiled output of scss/ (kept in the repo so the page opens without a build)
├── js/
│   ├── src/main.js           Source: one script with the same parts and functions as the Moodle theme's AMD modules
│   └── build/main.min.js     Compiled and minified by Gulp, plus a source map (loaded by index.html)
├── gulpfile.js           Tasks: lint, styles, scripts, build, watch
├── package.json          npm scripts: build, watch, lint; "browserslist" sets the browsers Babel compiles for
├── .stylelintrc.json     stylelint-config-standard-scss, with the BEM class names allowed
└── assets/
    ├── img/              Responsive banner (WebP + JPEG, 640–2400w), logo @1x/2x/3x, clean video poster
    └── icons/            Category icons re-traced from the PNGs to SVG
```

---

## Markup and structure
- **Landmarks.** The page uses `header`/`nav`, `main` and `footer`, plus a skip link. Every section is a `<section>` labelled by its heading.
- **Heading order.** One `h1` ("Welcome to MyLearning"), then an `h2` for each section and an `h3` for each category. This gives screen-reader users the same visual hierarchy.
- **Catalogue.** The categories are a real list (`<ul>`) of `<article>` cards. Each "View courses" link includes hidden text naming its category, so a screen reader hears "View courses in Business Development" rather than five identical links. The link is also a Bootstrap `stretched-link`, so the whole card can be clicked.
- **Login form.**
  - Each field has a visible `<label>`.
  - `autocomplete="username"` and `current-password` let password managers fill the form.
  - Error messages are linked to their fields with `aria-describedby`.
  - Status messages are announced through an `aria-live` region.
- **Footer.** The postal address is in an `<address>` element.

## Styling
- I wrote a thin theme layer that sets Bootstrap's own CSS variables (`--bs-body-font-family`, `--bs-btn-*` and so on) rather than overriding its selectors. This keeps the code close to how Moodle's Boost theme works, which makes Task 2 easier.
- **Layout is mobile-first.** The concept only shows desktop, so I designed the smaller breakpoints:
  - **Under 576px:**
    - The hero stacks with the form first, because logging in is the main task.
    - The banner crops in to a square so its baked-in text stays readable.
    - The category cards switch to a compact horizontal layout, so all five fit in about one and a half screens instead of five.
  - **576–1199px:** cards run in two or three columns.
  - **1200px and up:** five columns, as in the concept.
- **Sass and Gulp.** The styles are split into one partial per component and use the Sass module system (`@use`). Values only needed at compile time (colours, breakpoints) are Sass variables. Anything read at runtime stays a CSS custom property, set from those variables in `_tokens.scss`, so Bootstrap and the components can still use `var()`. The breakpoint mixins use Bootstrap's own breakpoints, so the media queries line up with its grid classes. Gulp lints the Sass with stylelint, then compiles it with Dart Sass. Task 2 uses Sass too, as Moodle's Boost theme does, so the two tasks share one stylesheet language.
- **Focus.** Every interactive element has a clear focus style: a black outline with a yellow halo, which shows up on white, grey, yellow and black backgrounds alike.
- **Motion.** All motion is turned off under `prefers-reduced-motion`, and `forced-colors` (Windows High Contrast) gets explicit borders.

## JavaScript enhancements (`js/src/main.js`)
The page works fully without JavaScript. `main.js` is one plain script, so the page also works when `index.html` is opened straight from the folder (ES modules would need a web server). Inside, it has the same three parts as the Moodle theme's AMD modules (`navbar`, `frontpage`, `footer`), with the same function names and logic, so the two tasks read as one codebase; the few parts that only make sense on a static page (the fake log in, links to pages that don't exist here) are marked as such. Content is only hidden for the reveal animation once the script has set up the observer that shows it again (`.reveal-ready`), so a script error never leaves the catalogue invisible.

The page loads a compiled copy, `js/build/main.min.js`. Gulp runs the source through Babel, which compiles it for the browsers listed in `package.json`'s `browserslist`, then minifies it with Terser (about 13 KB down to 6 KB). This is the same build step the Moodle theme uses for its AMD modules (`amd/src` to `amd/build`). A source map is written next to it, so the browser's dev tools show and debug `js/src/main.js`, not the minified file.

## Testing
- **Visual comparison.** I compared the page side by side with the concept at its native 1527px width, then checked it at 390px (phone) and 820px (tablet).
- **Accessibility.** A scan with the axe DevTools Chrome extension (axe-core 4.13, WCAG 2.1 AA plus best practices) found **0 issues**.
- **Keyboard.** I tabbed through the whole page and checked every interaction: the menu, the forms, the cards, the video and the modal.

---

## Concept and asset errors, with corrections

| # | Issue found | Why it matters | What I did / suggest |
|---|---|---|---|
| 1 | **Text and icons are baked into `intro-banner.jpg`** ("MYLEARNING", the tagline and five icons) | Screen readers can't read it, it can't be translated or edited, it blurs when scaled, and it becomes unreadable on phones | I kept the image, gave it full alt text, and crop it on small screens so the text stays legible. **Suggestion:** supply a clean background and render the title, tagline and icons as live HTML. |
| 2 | **Banner is 5000 × 2500 and 2.2 MB** | Very slow LCP on mobile connections | Made four responsive WebP/JPEG sizes (about 14–69 KB each). |
| 3 | **Banner icons are in a different order** from the catalogue (Business Management and CPD are swapped) | Visual inconsistency | Flagged here for design; a live-HTML hero (see #1) would keep the two in sync automatically. |
| 4 | **Category icons are low-resolution PNGs at mixed sizes** (four at 65px, CPD at 272px, so stroke weights differ) | Blurry on Retina/HiDPI screens; inconsistent line weight | Traced them to SVG. **Suggestion:** request the original vector icon set. |
| 5 | **The video placeholder has fake player controls baked in** (play button, 01:25, settings and picture-in-picture icons) and black letterboxing | Users will click controls that don't work; there is no real video or captions | Cropped it to a clean poster, built an accessible click-to-load player, and handle the missing file gracefully. **Suggestion:** supply the video file, captions (`.vtt`) and a transcript, as WCAG 1.2 requires. |
| 6 | **"Cookies Settings" button is green `#68b631` on `#efefef`, a 2.2:1 contrast ratio** | Fails WCAG 1.4.3 (4.5:1 required) | Kept the concept's green outline style but darkened it to `#3f7020` (5.0:1 on the footer grey; white text on the hover fill is 5.9:1). Relabelled "Cookie settings" (sentence case, singular). |
| 7 | **Footer copyright text is `#7e7e7e` on `#ececec`, a 3.4:1 contrast ratio** | Fails WCAG AA for small text | Darkened it to `#4d4d52` (7.1:1). |
| 8 | **"© 2023"** is hard-coded | Already out of date | The year comes from the current date. In Moodle this would come from the theme's copyright setting (Task 2). |
| 9 | **"Nikon Optical Ltd, All rights reserved."** is a comma splice | Copy error | Changed to "Nikon Optical Ltd. All rights reserved." |
| 10 | **"United-Kingdom"** has a stray hyphen | Copy error | Changed to "United Kingdom". |

---

## Notes and assumptions
- Links point to Moodle-style URLs (`/my/`, `/course/index.php?categoryid=…`) so the markup can move straight into a Moodle theme for the optional combined task.
- The video is expected at `assets/video/about-nikon-lenswear-uk.mp4`. Add the file and it will play with no code changes.
- The contact phone number (01632 960000) is a placeholder from Ofcom's fictional range.
- Bootstrap and Open Sans load from CDNs with Subresource Integrity on the Bootstrap files. Open Sans is loaded as a variable font covering weights 300–700.
