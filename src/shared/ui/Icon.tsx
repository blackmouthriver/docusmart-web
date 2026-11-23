// Íconos de trazo (24px), alineados con los de Material que usa la app.
const paths = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  convert: 'M7 7h13l-4-4M17 17H4l4 4',
  pdf: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2',
  study: 'M2 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H2zM22 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z',
  open: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  upload: 'M12 16V4M7 9l5-5 5 5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  cloud: 'M7 19h10.5a4.5 4.5 0 0 0 .4-9A6.5 6.5 0 0 0 5.4 11.6 3.8 3.8 0 0 0 7 19z',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5a1.5 1.5 0 1 1 0-.01',
  text: 'M5 5h14M5 10h14M5 15h10M5 20h7',
  merge: 'M8 4v5a4 4 0 0 0 4 4 4 4 0 0 1 4 4v3M16 4v5a4 4 0 0 1-4 4M5 7l3-3 3 3M13 7l3-3 3 3',
  split: 'M12 3v18M5 7h4M5 12h4M5 17h4M15 7h4M15 12h4M15 17h4',
  rotate: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  reorder: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  hash: 'M5 9h14M5 15h14M10 3 8 21M16 3l-2 18',
  stamp: 'M4 20h16M12 4a3 3 0 0 0-3 3c0 2 2 3 2 5v2H6v4h12v-4h-5v-2c0-2 2-3 2-5a3 3 0 0 0-3-3',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  timer: 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16M12 10v4l2 2M10 2h4',
  chart: 'M4 20h16M7 16v-5M12 16V6M17 16v-8',
  wifi: 'M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0M12 19h.01',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21a8 8 0 0 1 16 0',
  calendar: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  note: 'M5 4h14v12l-4 4H5zM15 20v-4h4M8 9h8M8 13h5',
  volume: 'M4 9h4l5-4v14l-5-4H4zM17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11',
  play: 'M7 4v16l13-8z',
  pause: 'M7 4h4v16H7zM13 4h4v16h-4z',
  stop: 'M6 6h12v12H6z',
  reset: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  close: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  up: 'M12 19V5M6 11l6-6 6 6',
  downArrow: 'M12 5v14M6 13l6 6 6-6',
  check: 'M20 6 9 17l-5-5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  // Huella: hash e integridad de archivos (W-105).
  fingerprint: 'M6.5 6.5A7.5 7.5 0 0 1 19.5 12v1M4.5 10.5A7.5 7.5 0 0 0 4.5 13M8 18.5c1-1.8 1.5-3.8 1.5-6a2.5 2.5 0 0 1 5 0c0 1.2-.1 2.4-.3 3.5M12 12c0 3.2-.8 6-2.3 8.5M17.4 16.5c-.3 1.4-.8 2.8-1.4 4M12 3a9 9 0 0 1 3 .5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 11v6M12 7h.01',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 7v5l3 2',
  alert: 'M12 3 2 21h20zM12 10v5M12 18h.01',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  plus: 'M12 5v14M5 12h14',
  phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1M11 18h2',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z',
  send: 'M4 12 20 4l-6 16-2.5-6.5z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.6 6.6C3.9 8.4 2 12 2 12s4 7 10 7a9.6 9.6 0 0 0 4.4-1M9.9 9.9a3 3 0 0 0 4.2 4.2',
  compress: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
  unlock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 7.5-2',
  wrench: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z',
  archive: 'M3 4h18v4H3zM5 8v12h14V8M10 12h4',
  folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
  pen: 'M15 4l5 5L9 20H4v-5zM13 6l5 5M4 22h16',
  redact: 'M4 5h16v5H4zM4 14h6M14 14h6M4 19h16',
  compare: 'M9 4H5v16h4M15 4h4v16h-4M12 2v20',
  images: 'M8 3h13v13H8zM8 12l3.5-3.5L16 13l2-2 3 3M3 8v13h13',
  cursor: 'M5 3l14 7-6 2-2 6z',
  type: 'M5 7V4h14v3M12 4v16M9 20h6',
  square: 'M4 4h16v16H4z',
  circle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18',
  marker: 'M9 15l-5 5h6l2-2M15 4l5 5-8 8-5-5z',
  eraser: 'M3 16l9-9 6 6-6 6H6zM13 19h8',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  form: 'M5 3h14v18H5zM8 8h8M8 12h8M8 16h4',
  resize: 'M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7',
  flip: 'M12 3v18M8 7l-5 5 5 5zM16 7l5 5-5 5z',
  crop: 'M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14',
  video: 'M3 6h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM16 10l6-3v10l-6-3',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z',
  scissors: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12',
  grip: 'M9 5.5v1M15 5.5v1M9 11.5v1M15 11.5v1M9 17.5v1M15 17.5v1',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  draw: 'M3 17c2.5-5 4.5-6 6-3s3.5 2 5-2 4-6 7-3',
  line: 'M5 19 19 5',
  arrow: 'M5 19 19 5M10 5h9v9',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, title }: { name: IconName; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={paths[name]} />
    </svg>
  )
}
