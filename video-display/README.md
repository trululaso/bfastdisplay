# Edifica 2026 — video display

Portrait (vertical TV) player for the company's YouTube videos.

## Pages

| URL            | What it shows                                                                 |
| -------------- | ----------------------------------------------------------------------------- |
| `/`            | Menu with every video. Tap one to open it; the **Loop** button (bottom-right) opens `/loop` |
| `/video/<id>`  | That one video, with a **Volver** button back to the menu. Returns to the menu when it ends |
| `/loop`        | Plays all the videos one after another. Tap any video in the list ("Todos los videos") to play it right away; when it ends, the loop continues with the next one. The **Menú** button (bottom-right) goes back to the menu |

URL options (below) carry over between pages. To have the TV start straight in the loop,
change the address at the end of `start-display.bat` to `http://localhost:4173/loop`.

## Run it

```
npm install
npm run dev        # development, http://localhost:5173
```

On the TV computer, just double-click **`start-display.bat`**: it builds the app, serves it on
http://localhost:4173 and opens Chrome in full-screen kiosk mode (Alt+F4 to exit).

An internet connection is needed (the videos stream from YouTube).

## Change the videos

Edit `src/config.js`. Each video is `{ youtubeId, title, subtitle?, tag?, start? }`,
where `youtubeId` is the part after `watch?v=` in the YouTube link. The same file has the
settings: event name, logo, shuffle, start muted, max seconds per video, QR code on/off.

## URL options

| Option        | What it does                                                          |
| ------------- | --------------------------------------------------------------------- |
| `?rotate=90`  | Rotates the app when the TV/PC can't rotate its own output (also `-90`) |
| `?sound=1`    | Start with sound (needs Chrome's autoplay flag, which `start-display.bat` sets) |

Best setup: set Windows *Display orientation* to **Portrait** so no `rotate` is needed.

## Controls

Touch:
- Tap the video: shows ⏮ ⏯ ⏭ (previous / pause-play / next); they hide again after 4 s
- Full-screen button (bottom-right of the video): the video turns sideways and fills the
  whole vertical screen; tap it again to go back. It also goes back by itself when the video
  ends. Direction: `fullscreenRotation` in `src/config.js` (90, -90, or 0 for no rotation)
- Sound button (bottom-right of the video): sound on/off
- Tap a video in the list: play it (and turn the sound on)
- A paused video resumes by itself after 60 s (`resumeAfterPauseSeconds` in `src/config.js`)
- The list scrolls itself to the playing video once nobody has touched it for 20 s

Keyboard: `→` / `←` next / previous, `Space` pause, `M` sound, `V` video full screen (`Esc` to leave),
`F` browser full screen, `Backspace` back to the menu (on a video page).

If a video fails or freezes it is skipped automatically. If there's no internet the
screen shows "Sin conexión" and retries every 30 seconds.
