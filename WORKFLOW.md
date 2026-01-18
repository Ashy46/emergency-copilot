# Emergency Copilot Frontend - Workflow Documentation

## Overview

Emergency Copilot is a Next.js 16 application that provides real-time emergency detection and dispatch capabilities. The frontend consists of two main interfaces:

1. **Caller Interface** (Home Page) - Mobile/browser app for detecting emergencies and streaming video
2. **Dispatcher Dashboard** - Command center for monitoring and managing incidents

---

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16.1.3 | React framework with App Router |
| React 19.2.3 | UI library |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| LiveKit | Real-time video streaming (WebRTC) |
| Overshoot SDK | AI-powered anomaly detection |
| Leaflet/React-Leaflet | Interactive mapping |

---

## Project Structure

```
emergency-copilot/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Caller interface (signal detection)
│   ├── layout.tsx                # Root layout
│   ├── dispatcher/page.tsx       # Dispatcher dashboard
│   └── api/livekit/token/        # LiveKit token generation API
├── components/                   # Reusable UI components
│   └── dispatcher/               # Dispatcher-specific components
│       ├── VideoCard.tsx
│       ├── IncidentCard.tsx
│       ├── VideoDetailsPanel.tsx
│       ├── IncidentDetailsPanel.tsx
│       └── VideoStreamPanel.tsx
├── hooks/                        # Custom React hooks
│   ├── useSignalDetection.ts     # Anomaly detection via Overshoot
│   ├── useDescriptionVision.ts   # Scene description AI
│   ├── useSnapshotWebSocket.ts   # WebSocket for snapshots
│   ├── useSSE.ts                 # Server-sent events listener
│   └── useLocation.ts            # Geolocation tracking
├── lib/                          # Utility functions
│   ├── api.ts                    # REST API client
│   ├── mapHelpers.ts             # Map utilities
│   └── constants.ts
└── types/                        # TypeScript definitions
    ├── api.ts                    # API data types
    ├── signal.ts                 # Signal detection types
    └── event.ts
```

---

## Workflow 1: Caller Interface (Signal Detection & Streaming)

The caller interface (`/`) enables automatic emergency detection and live video streaming.

### Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER UPLOADS VIDEO                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              OVERSHOOT AI SIGNAL DETECTION                      │
│  • Analyzes 1-second video clips with 0.5s delay               │
│  • Detects: weapons, violence, fire, medical, accidents        │
│  • Sensitivity threshold: 0.5                                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  3 SIGNALS DETECTED?                            │
│                                                                 │
│  NO ──────────────────────────────────────────────► Continue    │
│  YES ─────────────────────────────────────────────► Transition  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ (onTransition callback)
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRANSITION PIPELINE                             │
│                                                                 │
│  Step 1: Establish WebSocket connection (preemptive)           │
│  Step 2: Create incident/video record on backend               │
│  Step 3: Start description vision (scene analysis)             │
│  Step 4: Connect to LiveKit for video streaming                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                 LIVE STREAMING MODE                             │
│                                                                 │
│  • Video captured at 30fps via LiveKit                         │
│  • Snapshots sent via WebSocket                                │
│  • Scene analysis continues in background                       │
│  • Status: "🔴 LIVE STREAMING TO DISPATCH"                     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Hooks

| Hook | Responsibility |
|------|----------------|
| `useSignalDetection` | Manages Overshoot AI analysis, fires `onTransition` after 3 detections |
| `useDescriptionVision` | Analyzes frames, classifies scenario (carAccident, fire, medical, unknown) |
| `useSnapshotWebSocket` | Connects to backend, sends snapshots with scenario data |

### Anomaly Detection Categories

- **Critical**: Weapons, violence, military gear, active shooter indicators
- **Moderate**: Suspicious behavior, medical emergencies, fire, accidents

---

## Workflow 2: Dispatcher Dashboard

The dispatcher interface (`/dispatcher`) provides a real-time command center for monitoring incidents.

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│                    DISPATCHER DASHBOARD                          │
├────────────────┬───────────────────────────┬─────────────────────┤
│   LEFT PANEL   │      CENTER PANEL         │    RIGHT PANEL      │
│                │                           │                     │
│  Incidents     │   Interactive Map         │  Details View       │
│  └─ List       │   (Leaflet)              │                     │
│                │                           │  • Incident Info    │
│  Videos        │   • Incident markers      │  • Video Info       │
│  └─ List       │   • Video markers         │  • AI Summary       │
│                │   • Pulse animations      │  • Timeline Events  │
│  [Live: 3]     │   • Auto-zoom to fit      │  • Live Stream      │
│                │                           │                     │
└────────────────┴───────────────────────────┴─────────────────────┘
```

### Real-Time Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   REST API (Initial Load)          SSE Stream (Real-Time)       │
│   • GET /incidents                 • newVideo                   │
│   • GET /videos                    • snapshotReceived           │
│   • GET /videos/:id/timeline       • timelineEvent              │
│                                    • stateUpdated               │
│                                    • videoStatusChanged         │
│                                                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UI STATE UPDATES                             │
│                                                                 │
│   • incidents[] - Array of incident objects                     │
│   • videos[] - Array of video stream objects                    │
│   • selectedIncidentId - Currently selected incident            │
│   • selectedVideoId - Currently selected video                  │
│   • liveTimelineEvents - Real-time events per video             │
│   • updatedVideoStates - AI state summaries per video           │
│   • connectionState - SSE connection status                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### SSE Event Handlers

| Event | Action |
|-------|--------|
| `connected` | Confirm connection, show connected status |
| `newVideo` | Add video to list, update UI |
| `snapshotReceived` | Update snapshot count for video |
| `timelineEvent` | Append event to video's timeline |
| `stateUpdated` | Update video's AI summary |
| `videoStatusChanged` | Update video status (ended/recorded) |

### Map Markers

| Type | Color | Animation |
|------|-------|-----------|
| Incident (active) | Red | Pulse |
| Incident (resolved) | Green | None |
| Incident (archived) | Gray | None |
| Video (live) | Red circle | Pulse |
| Video (recorded) | Green circle | None |
| Video (ended) | Gray circle | None |

---

## Complete Data Flow: Caller to Dispatcher

```
                           CALLER                    BACKEND                    DISPATCHER
                             │                          │                           │
    Video Upload ───────────►│                          │                           │
                             │                          │                           │
    Signal Detection ◄───────┤                          │                           │
    (Overshoot AI)           │                          │                           │
                             │                          │                           │
    3 Signals ──────────────►│                          │                           │
                             │                          │                           │
    WebSocket Connect ───────┼─────────────────────────►│                           │
                             │                          │                           │
    Init Message ────────────┼─────────────────────────►│                           │
    (Create Video/Incident)  │                          │                           │
                             │                          │    newVideo Event         │
                             │                          ├──────────────────────────►│
                             │                          │                           │
    Start LiveKit Stream ────┼─────────────────────────►│                           │
                             │                          │                           │
    Snapshot (WebSocket) ────┼─────────────────────────►│                           │
                             │                          │    snapshotReceived       │
                             │                          ├──────────────────────────►│
                             │                          │                           │
                             │    AI Processing         │                           │
                             │    (Gemini)              │                           │
                             │                          │    timelineEvent          │
                             │                          ├──────────────────────────►│
                             │                          │                           │
                             │                          │    stateUpdated           │
                             │                          ├──────────────────────────►│
                             │                          │                           │
```

---

## API Integration

### REST Endpoints Used

```typescript
// Incidents
GET  /incidents                    // List all incidents
GET  /incidents/:id                // Get incident with videos
GET  /incidents/:id/timeline       // Get timeline events
GET  /incidents/:id/snapshots      // Get raw snapshots

// Videos
GET  /videos                       // List all videos
GET  /videos/:id                   // Get video details
GET  /videos/:id/timeline          // Get video timeline

// Snapshots
POST /snapshots                    // Submit new snapshot
GET  /snapshots                    // List snapshots
```

### WebSocket Messages

```typescript
// Client → Server
{ type: "init", videoId, lat, lng }
{ type: "snapshot", scenario, data }

// Server → Client
{ type: "ack", snapshotId }
```

---

## Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_API_WS_URL=ws://localhost:8080

# Overshoot AI
NEXT_PUBLIC_OVERSHOOT_API_KEY=<your_api_key>

# LiveKit Video Streaming
LIVEKIT_URL=<your_livekit_url>
LIVEKIT_API_KEY=<your_api_key>
LIVEKIT_API_SECRET=<your_api_secret>
```

---

## State Management

The application uses React hooks for state management (no Redux/Zustand):

- **Component state**: `useState` for local UI state
- **Refs**: `useRef` for non-render values (WebSocket connections, signal counts)
- **Custom hooks**: Encapsulate complex logic (signal detection, SSE, WebSocket)

---

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `page.tsx` | `app/page.tsx` | Caller interface with signal detection |
| `dispatcher/page.tsx` | `app/dispatcher/page.tsx` | Main dispatcher dashboard |
| `DispatcherMapView` | `components/DispatcherMapView.tsx` | Interactive map with markers |
| `VideoCard` | `components/dispatcher/VideoCard.tsx` | Video list item |
| `IncidentCard` | `components/dispatcher/IncidentCard.tsx` | Incident list item |
| `VideoDetailsPanel` | `components/dispatcher/VideoDetailsPanel.tsx` | Video info & timeline |
| `VideoStreamPanel` | `components/dispatcher/VideoStreamPanel.tsx` | LiveKit video viewer |
