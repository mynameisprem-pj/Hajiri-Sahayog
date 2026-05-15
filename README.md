# Hajiri Sahayog — हाजिरी सहयोग

A simple, offline-first attendance app for teachers. Built as a Progressive Web App (PWA) — works without internet after the first install.

---

## Features

- 📚 Manage multiple classes
- 👥 Add students manually, by voice, or bulk CSV import
- ✅ Mark attendance — Present, Absent, Leave
- 📅 BS (Bikram Sambat) and AD calendar support
- 🗓️ One-time and recurring weekly holidays (e.g. every Sunday)
- 👤 Per-student attendance history and stats
- 💾 Full data export and import for backup
- 📴 100% offline — no account, no server, no internet needed

---

## Tech Stack

| Purpose    | Library |
|--------|   ----------|
| Framework  | React 18 + TypeScript |
| Build Tool | Vite |
| Database   | Dexie.js (IndexedDB) |
| State      | Zustand |
| Styling    | Tailwind CSS v3 |
| Date(BS/AD)| nepali-date-converter |
| Voice Input| Web Speech API |
| PWA        | vite-plugin-pwa + Workbox |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/mynameisprem-pj/Hajiri-Sahayog
cd hajiri-sahayog

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## PWA Icons

Before building for production, add your app icons inside `public/icons/`:

```
public/icons/
├── icon-192.png
└── icon-512.png
```

You can generate these from `public/favicon.svg` using any icon generator.

---

## Data & Privacy

All data is stored locally on the device using IndexedDB. Nothing is sent to any server. The developer has no access to your data.

**Backup regularly** — go to Settings → Export Data. If the browser data is cleared or the device is lost, data cannot be recovered without a backup file.

---

## Year-End Flow

1. Go to **Settings → Export Data** and save the file safely
2. Go to **Settings → Reset App**
3. Set up fresh profile for the new academic year

---

## Browser Support

| Browser | Attendance | Voice Input |
|---|---|---|
| Chrome (Android / Desktop) | ✅ | ✅ |
| Edge (Desktop) | ✅ | ✅ |
| Safari (iOS) | ✅ | ⚠️ Limited |
| Firefox | ✅ | ❌ |

---

## Developer

**Prem Jha**
📧 premjha1714@gmail.com

Built with ❤️ for teachers of Nepal.

---

## License

MIT
