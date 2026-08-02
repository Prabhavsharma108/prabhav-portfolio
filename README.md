# Portfolio — Prabhav Sharma

An interactive 3D portfolio drawn as an engineering blueprint. You walk down a
corridor rendered as a drafting sheet; doors along it open into rooms for
about, experience, projects and contact.

Built with React 19, React Three Fiber, three.js and GSAP on Vite.

**Live:** https://prabhav-portfolio.vercel.app

---

## Running it

```bash
npm install
npm run dev
```

`npm run build` produces the production bundle in `dist/`, `npm run preview`
serves it.

## How it's put together

```
src/
  components/canvas/     the 3D scene
    corridor/            infinite corridor, doors, hero text, scale figure
    entrance/            the entrance sequence before you go in
    rooms/               About · Experience · Projects · Contact
    shaders/             procedural blueprint materials
  components/dom/        preloader and page transitions
  components/ui/         navigation, overlays, audio controls
  context/               scene state, audio, performance tier, achievements
  hooks/                 scroll camera, parallax
  styles/                SCSS design tokens and component styles
```

### The corridor is infinite

`InfiniteCorridorManager` keeps three segments alive at a time — the one you're
in plus its neighbours — and recycles them as the camera travels. Segments
outside that window are unmounted rather than merely hidden, so draw calls stay
flat however far you walk.

### Surfaces are drawn, not textured

The corridor shell (walls, floor, ceiling) is a single shared
`BlueprintMaterial`. The drafting grid is generated in the fragment shader from
**world** position rather than UVs, which is what lets segments recycle without
a visible seam, and it's antialiased with `fwidth` so the lines stay one pixel
wide at grazing angles instead of shimmering.

One shared material instance drives every surface, so the whole shell is one
shader program and one uniform upload per frame.

### Performance

The scene adapts rather than assuming a machine:

- `PerformanceContext` picks a tier from cores, memory and device type, and
  `PerformanceMonitor` drops it further if frame times slip.
- `RoomWarmup` mounts all four rooms far below the scene during the preloader
  and compiles their shaders with `compileAsync`, so the first room you enter
  doesn't hitch.
- Rooms and the whole 3D experience are lazily imported; three.js and R3F are
  split into their own chunks so a content change doesn't invalidate the engine
  in visitors' caches.
- Audio is only fetched after the first interaction — browsers block autoplay
  until then anyway, so loading it earlier just competes with the textures the
  first frame actually needs.

### Accessibility

The 3D scene has a full text equivalent in `index.html` for screen readers and
crawlers, there's a screen-reader overlay describing scene state, keyboard focus
is always visible, and non-essential motion respects
`prefers-reduced-motion`.

## Deploying

Deployed on Vercel. `vercel.json` sets the security headers and the caching
policy — fingerprinted assets are immutable for a year, `index.html` always
revalidates so a deploy actually reaches people.

Analytics is optional: set `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` to enable
it. Without them the script is never downloaded.

## Credits

The corridor concept and a number of the room mechanics began from a portfolio
by [Suyash Agrahari](https://github.com/suyashagrahari/suyash-portfolio-v2),
used and reworked with his permission. The art direction, shaders, content and
performance work here are my own.

## License

MIT
