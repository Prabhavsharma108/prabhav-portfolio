# Portfolio — Prabhav Sharma

An interactive 3D portfolio: a hand-drawn paper world where you walk down a
corridor and open doors into rooms for about, work, projects and contact.

Built with React 19, React Three Fiber, three.js and GSAP on Vite.

**Live:** https://prabhavsharma.in

---

## Running it

```bash
npm install
cp .env.example .env   # fill in VITE_WEB3FORMS_KEY so the contact form delivers
npm run dev
```

`npm run build` produces the production bundle in `dist/`, `npm run preview`
serves it.

## How it's put together

```
src/
  components/canvas/     the 3D scene
    corridor/            infinite corridor, doors, hero text, avatar
    entrance/            the entrance sequence before you go in
    rooms/               About · Gallery · Studio · Contact
    shaders/             paint-reveal and brush-stroke materials
  components/dom/        preloader and page transitions
  components/ui/         navigation, overlays, audio controls
  context/               scene state, audio, performance tier, achievements
  hooks/                 scroll camera, parallax
  styles/                SCSS design tokens and component styles
```

### The corridor is infinite

`InfiniteCorridorManager` keeps three segments alive at a time — the one you're
in plus its neighbours — and recycles them as the camera travels. Segments
outside that window unmount rather than merely hide, so draw calls stay flat
however far you walk.

### Performance

The scene adapts rather than assuming a machine:

- `PerformanceContext` picks a tier from cores, memory and device type, and
  `PerformanceMonitor` drops it further if frame times slip.
- `RoomWarmup` mounts all four rooms far below the scene during the preloader
  and compiles their shaders with `compileAsync`, so the first room you enter
  doesn't hitch.
- The 3D experience is lazily imported, and three.js and R3F are split into
  their own chunks so a content change doesn't invalidate the engine in
  visitors' caches.
- Audio is only fetched after the first interaction — browsers block autoplay
  until then anyway, so loading it earlier just competes with the textures the
  first frame actually needs.
- Assets ship precompressed as brotli and gzip.

### Accessibility

The 3D scene has a full text equivalent in `index.html` for screen readers and
crawlers, and there's a screen-reader overlay describing scene state.

## Configuration

Both are optional but the first is needed for the contact form to work:

| Variable | Purpose |
| --- | --- |
| `VITE_WEB3FORMS_KEY` | Delivers the contact form. Free key at [web3forms.com](https://web3forms.com). Without it the form reports an error rather than silently dropping messages. |
| `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` | Optional analytics. Unset means the script is never downloaded. |

## Deploying

Deployed on Vercel. `vercel.json` sets the security headers and caching policy —
fingerprinted assets are immutable for a year, `index.html` always revalidates
so a deploy actually reaches people.

### Changing the domain

The public origin lives in exactly one place: `SITE_URL` in `vite.config.js`.
A build plugin substitutes it into the canonical link, Open Graph and Twitter
tags and the JSON-LD, and generates `robots.txt` and `sitemap.xml` from the same
value — so they cannot drift apart. Override it without touching code by setting
a `SITE_URL` environment variable on the deployment.

## License

MIT
