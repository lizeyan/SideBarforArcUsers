# Privacy Policy for Side Bar for Arc Users — Arc Style

Last updated: 2026-10-27

## Summary

The extension does not operate a developer-controlled analytics, advertising, telemetry, or account server. The developer does not receive your bookmarks, browsing history, tabs, API keys, page content, or extension settings.

扩展不使用由开发者控制的分析、广告、遥测或账号服务器。开发者不会收到你的书签、浏览历史、标签页、API Key、网页内容或扩展设置。

Some features use local Chrome APIs or third-party services selected below. Data leaves the device only for the feature being used.

## Data stored locally

The extension stores data in Chrome extension storage on your device, including:

- Favorites and pinned-site metadata, such as URLs, titles, icons, and favicons
- Space definitions and real Tab-to-Space assignments
- Bookmark/Favorite-to-live-tab recovery metadata
- Folder expansion state, search preferences, display settings, and other user preferences
- Optional AI naming settings, including the configured Base URL, model, prompt, protocol, and API key

The developer cannot access this local storage. Chrome Sync behavior, if any, is controlled by Chrome and the user's browser settings; this extension currently uses `chrome.storage.local` and `chrome.storage.session`, not `chrome.storage.sync`.

## Bookmarks, tabs, and browsing activity

The extension reads Chrome bookmarks, open tabs, tab titles, URLs, favicons, audible state, native tab groups, and window state to render and operate the sidebar. It may update bookmarks, tabs, and native tab groups when the user explicitly performs the corresponding sidebar action.

This information is processed locally and is not sent to the developer.

## Optional AI naming

AI naming is disabled until the user configures it. When the user validates an AI configuration or requests manual/automatic naming, the extension sends a request directly from the browser to the OpenAI-compatible endpoint configured by the user.

Depending on the user's settings and granted host permission, the request may include:

- The configured API key in the `Authorization` header
- The configured model, protocol, reasoning setting, and naming prompt
- The page URL and current/saved title
- Page metadata, rendered text, linked Markdown, or relevant `llms.txt` content, truncated to local size limits

The configured endpoint receives this information under that provider's own privacy policy and terms. The developer does not proxy, receive, or retain the request. Users should only configure an endpoint they trust and should not enable page-content access for sensitive pages.

## Optional host permissions and page access

The extension declares optional `http://*/*` and `https://*/*` host permissions. These permissions are requested only when the user enables a feature that needs page or endpoint access, such as AI-assisted naming. Without permission, AI naming falls back to information already available to the extension, such as the saved title and URL.

Injected scripts used for AI naming read visible page text and metadata only for the requested feature. They do not read the configured API key from the page or inject the key into page scripts.

## Other external requests

- **Iconify (`api.iconify.design`)**: fetches icon collections or a selected icon. The request contains the icon identifier and normal network metadata; it does not include bookmarks, tabs, API keys, or page content.
- **Favicons and website content**: the extension may request a website's favicon or public page/Markdown/`llms.txt` content when needed for a user-invoked feature. Standard network metadata is visible to that website.
- **Project news/version endpoint**: the extension may request the public latest-version metadata used by the News feature. It does not include bookmark, tab, or AI configuration data.

## Data sharing, sale, and advertising

The developer does not sell user data, use it for advertising, perform creditworthiness or lending decisions, or share it with data brokers. Data sent to a user-configured AI endpoint is initiated by the user and goes directly to that provider.

## Data deletion

Users can remove locally stored extension data by removing the extension and choosing to clear its data, or by clearing the extension's site/storage data through Chrome. Bookmarks created in Chrome remain Chrome bookmarks until the user deletes them.

## Changes to this policy

Material changes will be published in this repository and summarized in the corresponding GitHub Release.

## Contact

For privacy questions, open an issue at:

https://github.com/lizeyan/SideBarforArcUsers/issues
