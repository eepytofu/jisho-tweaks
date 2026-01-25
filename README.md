# <img src="icons/icon128.png" alt="Jisho Tweaks icon" width="40" height="40" style="vertical-align: text-bottom; margin-right: 8px;" /> Jisho Tweaks

English | [Bahasa Indonesia](./README_id.md)

Chrome extension (Manifest v3) for jisho.org that adds Indonesian translations and a few layout tweaks.

## Features

* Translates English meanings to Indonesian directly on the page.
* Hides non-English meaning columns.
* Moves extra readings (Nanori, Pinyin, and Korean) to the top, directly below On'yomi (toggleable).
* Shows the existing Unicode codepoint (U+XXXX) below the Variants/Parts section.
* Stores translation results in `localStorage`.
* Translation text color follows Jisho's light or dark mode.

## Install

### [Chrome Web Store](https://chromewebstore.google.com/detail/jisho-tweaks/ilmdijfkkpaibfnpegddbgpkloanogfk)

### Developer mode (for advanced users)
1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the repository folder (the one containing `manifest.json`).

## How to use

1. Open jisho.org (kanji or vocabulary pages).
2. Click the **Jisho Tweaks** icon in the Chrome toolbar to open the popup.
3. Enable or disable features using the available toggles.
4. Changes are applied to the current Jisho page. Some changes may require a page refresh.
5. Use **Clear translation cache** if you want to remove stored translations.

## Permissions

* `storage`
* `host_permissions`:

  * `https://jisho.org/*`
  * `https://translate.googleapis.com/*`

## Notes

* Uses the public Google Translate (gtx) endpoint. If a request fails, the original English text remains and no translation is added.
  * Translations are for reference only, machine translation may miss nuances or context.
* Mainly for personal use. Provided as-is without any warranty. Licensed under the GNU General Public License v3.0.