/**
 * assetRegistry — typed paths for all expected media.
 *
 * Missing files are handled gracefully: the `useAsset` hook reports
 * `hasFailed: true` so components render CSS placeholder fallbacks.
 *
 * Investor- and mentor-specific assets are owned by
 * `src/lib/investorAssets.ts` — do not duplicate them here.
 */

export const ASSET_REGISTRY = {
  narrator: {
    // Stills (Imagen) — animated WebMs are an aspirational upgrade per ASSETS_REQUIRED.md §3.
    idle:        '/assets/images/narrator/narrator-idle.webp',
    speaking:    '/assets/images/narrator/narrator-speaking.webp',
    pointing:    '/assets/images/narrator/narrator-pointing.webp',
    celebrating: '/assets/images/narrator/narrator-celebrating.webp',
    warning:     '/assets/images/narrator/narrator-warning.webp',
    whispering:  '/assets/images/narrator/narrator-whispering.webp',
  },

  // Served from public/assets/images/bg. Previously hotlinked to the v0 blob
  // host, which put every page's backdrop behind a third-party domain we do
  // not control.
  //
  // The chess-* plates are stills from the same stone-chess-battlefield shot
  // that plays behind /login and /register, taken at five points in its
  // push-in so each route reads differently while the app stays one world.
  // The older hall/chamber plates are still in the folder if you want them
  // back — note chessboard-throne.webp is unusable, it is a stock photo of
  // three men on a clifftop with a lexica.art watermark burned in.
  backgrounds: {
    landing:    '/assets/images/bg/chess-landing.webp',
    dashboard:  '/assets/images/bg/chess-dashboard.webp',
    simulation: '/assets/images/bg/chess-simulation.webp',
    chessboard: '/assets/images/bg/chess-warroom.webp',
    verdict:    '/assets/images/bg/chess-verdict.webp',
  },

  textures: {
    noise:     '/assets/images/textures/noise.webp',
    parchment: '/assets/images/textures/parchment.webp',
    stone:     '/assets/images/textures/stone.webp',
    leather:   '/assets/images/textures/leather.webp',
    vignette:  '/assets/images/textures/vignette.webp',
  },

  door: {
    openingMp4:  '/assets/video/chessboard-door-opening.mp4',
    openingWebm: '/assets/video/chessboard-door-opening.webm',
  },

  crests: {
    chessboard: '/assets/images/crests/warroom-crest.svg',
  },
} as const

export type AssetCategory = keyof typeof ASSET_REGISTRY
