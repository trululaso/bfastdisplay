// ─────────────────────────────────────────────────────────────
//  Display settings — edit this file to change what the TV shows.
// ─────────────────────────────────────────────────────────────

export const settings = {
  // Play the videos in random order (reshuffled on every full loop).
  shuffle: false,
  // Start with sound off. Browsers block autoplay with sound unless Chrome is
  // launched with --autoplay-policy=no-user-gesture-required (see README).
  // Can also be overridden with ?sound=1 in the URL.
  muted: true,
  // Cut long videos after N seconds (null = play each video to the end).
  maxSecondsPerVideo: null,
  // If a visitor pauses a video and walks away, resume it after N seconds (null = never).
  resumeAfterPauseSeconds: null,
  // Full-screen video turns sideways to fill the vertical TV, like a phone held
  // horizontally. 90 = clockwise, -90 = counter-clockwise (pick the one that matches
  // how the TV was turned), 0 = don't rotate (video just fills the width).
  fullscreenRotation: 90,
  // Show a QR code so visitors can open the current video on their phone.
  showQr: false,
}

// youtubeId: the part after "watch?v=" in the YouTube link.
// start (optional): second to start from.
export const videos = [
  { youtubeId: 'uetJqM0UGvE', title: 'PRODUCCION AUTOMATIZADA', tag: 'Fábrica' },
  { youtubeId: 'ngj0EIRJVhI', title: 'INTEGRACION ELEMENTOS PREFABRICADOS EN MOLDAJE DE ALUMINIO', tag: 'Moldaje de aluminio' },
  { youtubeId: 'YYVsIkziXrs', title: 'ANIMACION MOLDAJE ALUMINIO', tag: 'Moldaje de aluminio' },
  { youtubeId: '9dBVlYOlprg', title: 'ARMADO EN SECO - FABRICA', tag: 'Fábrica' },
  { youtubeId: 'YZvfCcR6Z0s', title: 'BIM 3D PARA MOLDAJE DE ALUMINIO', tag: 'BIM' },
  { youtubeId: 'Gcjoa6A3QC8', title: 'EJEMPLO MOLDAJE', tag: 'Moldaje de aluminio' },
  { youtubeId: '_cTYrUqiVSw', title: 'MALLAS DE PROTECCION AUTOTREPANTES', tag: 'Seguridad' },
  { youtubeId: 'sq6dMFe4f0o', title: 'ANIMACION PANTALLAS PERIMETRALES', tag: 'Seguridad' },
  { youtubeId: 'hln5mX2nueI', title: 'GETO – VIDEO CORPORATIVO 1', tag: 'Corporativo' },
  { youtubeId: 'LYrUKehY1A0', title: 'GETO VIDEO CORPORATIVO 2', tag: 'Corporativo' },
  { youtubeId: 'gO2QM5MLvUc', title: 'GETO PPVC', tag: 'Prefabricados' },
  { youtubeId: 'hM6K_pUEiB0', title: 'GETO——Formwork & Scaffolding Expert · Eco-Smart Construction · 1+N Integrated Solutions', tag: 'Corporativo' },
  { youtubeId: 'Bw49AMxkcKM', title: 'GETO OXYGREEN - WALL FINISH - ALUMINIUM FORMWORK SYSTEM', tag: 'Moldaje de aluminio' },
  { youtubeId: 'OE3Iwm6Fl_c', title: 'GETO Aluminum Formwork System (Villa)', tag: 'Moldaje de aluminio' },
]
