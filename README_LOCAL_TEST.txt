SRENOVA LOCAL TEST PACKAGE

Recommended on macOS:
1. Unzip the package.
2. Open Terminal.
3. cd into the extracted srenova_full_redesign folder.
4. Run: python3 -m http.server 8080
5. Open: http://localhost:8080/

Shortcut:
- Double-click start-local.command (macOS may ask for permission the first time).

Main pages:
- http://localhost:8080/index.html
- http://localhost:8080/about.html
- http://localhost:8080/services.html
- http://localhost:8080/treatments.html

Treatment detail pages are inside /treatments/.

Why individual sandbox HTML links failed:
The preview URL serves a single uploaded HTML blob and does not expose sibling files such as styles.css, script.js, assets/, or other HTML pages. The ZIP preserves the relative folder structure, so navigation works when served locally.

Notes:
- Core site files/assets included in this package are local.
- Some treatment photography is referenced from the current srenova.in asset URLs and therefore needs internet access while testing.
