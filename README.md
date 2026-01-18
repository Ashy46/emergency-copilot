# Emergency Copilot Frontend

A real-time emergency response platform frontend built with Next.js 16 and React 19. Features AI-powered anomaly detection, live video streaming, and a comprehensive dispatcher dashboard.

## Overview

This application provides two main interfaces:

- **Caller Page** (`/`): Upload video, detect anomalies using AI, and stream live to dispatchers
- **Dispatcher Dashboard** (`/dispatcher`): Monitor active incidents, view live streams, and track timeline events on an interactive map

## Tech Stack

- **Next.js 16.1.3** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript** - Type safety
- **LiveKit** - WebRTC video streaming
- **Overshoot SDK** - AI-powered video analysis
- **Leaflet** - Interactive maps
- **Tailwind CSS 4** - Styling

## Features

### Caller Interface
- Video upload and preview
- Real-time anomaly detection (weapons, violence, accidents, fire, medical emergencies)
- Signal threshold detection (3 signals trigger streaming)
- Live video streaming via LiveKit
- Scene description analysis
- Automatic incident creation

### Dispatcher Dashboard
- Real-time incident and video monitoring
- Interactive map with incident/video markers
- Live video playback
- AI-generated timeline events
- SSE-powered real-time updates
- Collapsible detail panels

## Routes

| Route | Description |
|-------|-------------|
| `/` | Caller/signal detection page |
| `/dispatcher` | Dispatcher dashboard |
| `/map` | Location/geolocation testing |
| `/test` | Development testing |
| `/test-caller` | LiveKit caller simulation |
| `/test-livekit` | LiveKit connection testing |

## Prerequisites

- Node.js 18+ or Bun 1.3.4+
- Overshoot API key
- LiveKit account (URL, API key, API secret)
- Running backend API (emergency-copilot-api)

## Setup

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Overshoot AI Vision
NEXT_PUBLIC_OVERSHOOT_API_KEY=ovs_your_key_here

# LiveKit Video Streaming
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 3. Run Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the caller interface.
Open [http://localhost:3000/dispatcher](http://localhost:3000/dispatcher) for the dashboard.

## Project Structure

```
emergency-copilot/
├── app/                        # Next.js App Router
│   ├── api/livekit/token/      # LiveKit token generation
│   ├── dispatcher/             # Dispatcher dashboard
│   ├── map/                    # Location testing
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main caller page
├── components/                 # React components
│   ├── dispatcher/             # Dashboard components
│   ├── MapView.tsx             # Basic map
│   └── DispatcherMapView.tsx   # Map with markers
├── hooks/                      # Custom React hooks
│   ├── useSignalDetection.ts   # Anomaly detection
│   ├── useSnapshotWebSocket.ts # WebSocket communication
│   ├── useDescriptionVision.ts # Scene analysis
│   ├── useSSE.ts               # Server-Sent Events
│   └── useLocation.ts          # Geolocation
├── lib/                        # Utilities
│   └── api.ts                  # REST API client
├── types/                      # TypeScript types
└── public/                     # Static assets
```

## Key Hooks

| Hook | Purpose |
|------|---------|
| `useSignalDetection` | Overshoot anomaly detection with signal threshold |
| `useSnapshotWebSocket` | WebSocket connection for snapshot streaming |
| `useDescriptionVision` | Scene description analysis |
| `useSSE` | SSE connection for real-time dispatcher updates |
| `useLocation` | Browser geolocation |

## API Integration

The frontend connects to the backend API (`emergency-copilot-api`) via:

- **REST API**: Fetch incidents, videos, snapshots, timeline events
- **WebSocket** (`/ws/snapshots`): Stream snapshots from caller to backend
- **SSE** (`/stream`): Receive real-time updates on dispatcher dashboard
- **LiveKit**: Video streaming between caller and dispatcher

## Documentation

For complete project documentation, see the main [CLAUDE.md](../CLAUDE.md) file.

For backend API documentation, see:
- [API.md](../emergency-copilot-api/API.md) - API endpoint reference
- [docs/NEXTJS_CLIENT.md](../emergency-copilot-api/docs/NEXTJS_CLIENT.md) - Client integration guide
