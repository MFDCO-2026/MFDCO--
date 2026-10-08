# MFDCO Country Operations v13

## Header / navigation
- Global header desktop navigation reduced to six primary destinations: MFDCO, Works, Members, Country Operations, Tools, News.
- Search, country news, country comparison, international organizations/treaties, support items moved into grouped side-menu sections.
- Country Operations topbar reorganized into `見る`, `この国家`, `編集・管理` dropdown groups.

## Country page media distribution
- Standalone media-upload center retired from normal navigation. `country-media.html` now redirects to the media section of the country page for old links.
- `country-media-inline.js` scans media currently referenced by the country document and automatically lists flag, emblem, anthem, map, capital image, company/party logos, heritage images, article previews, region/Wiki images and other Storage-backed images/audio.
- Default download policy is `deny`.
- Owner/admin can set one bulk policy and terms, then override individual media with `deny / approval / allow`.
- Approval requests store requester, purpose, details, expiry, decision note and a contract snapshot.
- Approved/allowed downloads use short-lived signed URLs from `country-media`.
- Approval can invoke `country-license-email` to send the contract to requester + country owner.
- Static files bundled directly with the website are listed as fixed assets but cannot be reliably access-controlled. Production distributable media should use `country-media` Storage.

## Country presentation
- Added country introduction YouTube URL with privacy-enhanced embed.
- Added multiple external links with label, URL and description.
- Added an explicit Social Issues TOC jump under Society.
- Added sports, arts/culture and food culture lists.

## International organizations and treaties
- Organization/community join policy: `open`, `approval`, `closed`.
- Country can join/apply and leave directly from the organization screen.
- Organization creator can approve/reject applications.
- Organization founder-country ownership is protected by RLS.
- Organization creators can create treaties with type, effective date, summary and body.
- Active member countries can sign/withdraw from active treaties.
- Public country page shows active organization memberships and signed treaties.

## Storage limits — finalized
- 250 MiB per country.
- 500 MiB per account.
- 25 MiB per file.
- Client preflight and DB quota guard use the same final limits.
- Replacing the same media slot removes stale metadata/Storage objects after the replacement succeeds.
- Legacy standalone `country-assets` upload flow is retired; its new INSERT/UPDATE Storage policies are removed.

## Compatibility
- Existing `country-assets` data/tables are retained for rollback/legacy compatibility, but v13 does not expose the old uploader.
- Existing URLs to `country-media.html?id=...` redirect into `country.html?id=...#country-media-downloads`.
