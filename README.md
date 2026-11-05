# Jairo Arias — Portfolio v1

A self-contained English portfolio using Jairo’s LinkedIn visual identity: ivory, forest green, sage, burgundy accents, circular geometry and the original portrait. The interactive lab keeps a dark editorial treatment. No gold or copper accents. No build step, dependencies, external fonts, tracking, accounts or API keys.

- Live site: [Jairo Arias — Portfolio](https://jariassantamaria-maker.github.io/jairo-portfolio/)
- Source: [GitHub repository](https://github.com/jariassantamaria-maker/jairo-portfolio)

Published through GitHub Pages from the `main` branch and repository root.

## Preview

Open `index.html` in Safari, Chrome, Edge or Firefox. All site interactions run locally. Alternatively, serve this directory with `python3 -m http.server 8000` and visit http://localhost:8000.

## GitHub Pages configuration

The portfolio and public résumé are already publicly accessible. The following configuration can also be used to deploy a separate copy.

1. Sign in to your GitHub account and create a repository, for example `jairo-portfolio`. A public repository can use GitHub Pages on GitHub Free. Do not upload internal work files.
2. Upload the **contents** of this folder to the repository root: `index.html`, `styles.css`, `app.js`, `assets/` and `.nojekyll`. Keep `index.html` at the root, not inside another portfolio folder. The README may also be included.
3. Commit the files to `main`.
4. Open repository **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then **main** and **/(root)**. Save.
5. Wait for the Pages deployment to finish. Use the exact URL GitHub displays, normally `https://YOUR-USERNAME.github.io/jairo-portfolio/`.
6. Check the site on a phone and desktop; test the résumé download, contact links, case study expansions, KPI filters and workflow simulator.

Official instructions: [Configure a GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

No custom domain, secrets or workflow configuration are required for this static version. All paths are relative, so repository subpaths are supported. Updating files on the selected branch updates the published site.

## Content and privacy

- Reporting: implemented operational work; additional architecture changes are explicitly proposals.
- Incident QA: investigation completed; recommendation implementation is not claimed.
- Enrollment wizard and Gmail routing: proposals, not production implementations.
- The lab is a newly created portfolio prototype with fictional regions, counts and rules, not a reconstruction of internal systems.
- No learner identities, internal screenshots, raw logs, customer names or fabricated business results are included.
- The downloadable résumé is the English Master Harvard Resume v2, converted from the supplied Word document into a public PDF edition. Client names, granular internal reconciliation figures, staffing/geographic scope and platform-specific incident detail were generalized. The supplied Word original was preserved unchanged. No experience or business results were added. The public PDF is `assets/Jairo_Arias_Santamaria_Master_Harvard_Resume_v2_Public.pdf`.
- The site does not connect to Gmail, send messages, store form data or execute enrollment actions. Mailto opens the visitor's mail app.

## Verification

Local checks passed for asset links and section anchors, JavaScript execution using a DOM stub, aggregate KPI 87.5% (210/240), Central KPI 80% (64/80), reset behavior and all 48 routing combinations. Human review takes precedence over missing information and specialist routing.

Browser checks on the published site confirmed:

- Layouts at viewport widths of 360, 768 and 1440 pixels, without horizontal overflow; the original portrait loads correctly.
- Selecting Central shows an 80% on-time rate. Changing the target to 100% with the keyboard shows a 20-percentage-point gap. Reset restores the aggregate rate of 87.5%.
- Billing requests reach the billing review queue, sensitive decisions override routing to human review, and incomplete requests require more information. Reset clears the result.
- Implemented-work and proposal case-study disclosures open and show their scope.
- The public Master CV v2 PDF downloads successfully.

Accessibility features: semantic landmarks, English language attribute, skip link, visible keyboard focus, native labeled controls, native expandable case studies, live results, text equivalents for charts, tabular sample inputs and reduced-motion support. Responsive layout changes at 1050px, 760px and 380px. Decorative shapes are hidden from assistive technology. The portrait has descriptive alternative text and is displayed with CSS framing, with no edits to the original image. Each case study disclosure has a unique accessible name. Key text color combinations were checked for contrast (minimum 5.68:1).

Limit: an assistive-technology audit has not been completed. Viewport checks do not replace testing on physical devices. No claim of WCAG certification is made.

For future changes, recheck the layouts, interactive controls, scope labels and résumé download. Additional checks should cover 200% zoom, full keyboard-only navigation, screen-reader announcements and physical devices. Keep any replacement résumé suitable for public release.

## Edit

- Copy and case studies: `index.html`.
- Colors, typography and responsive layout: `styles.css`.
- Fictional sample data, calculations and demo routing: `app.js`.
- Résumé: `assets/Jairo_Arias_Santamaria_Master_Harvard_Resume_v2_Public.pdf`.
- Original portrait: `assets/jairo-arias-portrait.png`.
- Brand colors and circular forms: the variables and hero/contact rules in `styles.css`.
