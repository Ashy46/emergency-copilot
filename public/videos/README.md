# Video Replay Setup

## How It Works

The replay feature allows dispatchers to rewatch videos after the live stream ends:

1. **User uploads video** (e.g., `pov1.mov`) - Filename determines GPS coordinates
2. **Video streams LIVE via LiveKit** - Real-time streaming to dispatcher
3. **Frontend sends filename to backend** - WebSocket init includes `filename: "pov1.mov"`
4. **When stream ends, backend sets videoUrl** - Sets `videoUrl: "/videos/pov1.mov"`
5. **Dispatcher can replay** - Plays from `/videos/pov1.mov` with timeline

## Quick Setup for Testing

### Step 1: Put your test videos in this folder
```bash
public/videos/
├── pov1.mov    # Car accident angle 1
├── pov2.mov    # Car accident angle 2 (same location)
├── pov3.mov    # Different location
└── README.md
```

### Step 2: Upload video on caller page
When you upload `pov1.mov`, the system:
- Sets coordinates to (37.7749, -122.4194) - Market St, SF
- Sends `filename: "pov1.mov"` to backend via WebSocket

### Step 3: Backend sets videoUrl when stream ends
Your backend should set:
```json
{
  "status": "recorded",
  "videoUrl": "/videos/pov1.mov"
}
```

### Step 4: Dispatcher sees replay
- VideoStreamPanel detects `status === "recorded"` and `videoUrl` is set
- Shows HTML5 video player instead of LiveKit stream
- Timeline events still displayed alongside video

## Coordinate Mapping (Filename → GPS)

When you upload a video, the filename determines where it appears on the map:

| Filename Pattern | Location | Coordinates |
|------------------|----------|-------------|
| `pov1.*` | Market Street, SF | (37.7749, -122.4194) |
| `pov2.*` | Near Market St, SF | (37.7751, -122.4190) |
| `pov3.*` | SoMa, SF | (37.7849, -122.4094) |
| `pov4.*` | Mission District, SF | (37.7649, -122.4294) |
| `pov5.*` | Financial District, SF | (37.7549, -122.3994) |
| Other | Default | (41.7965, -87.6069) |

**Note:** `pov1` and `pov2` are at the same location (different camera angles of same incident)

## Backend Requirements

### 1. Record LiveKit Streams

Your backend needs to record the LiveKit video streams. Options:

**Option A: LiveKit Egress (Recommended)**
- Use LiveKit's built-in recording: https://docs.livekit.io/realtime/egress/overview/
- Automatically saves streams to file or S3

**Option B: Manual Recording**
- Subscribe to the LiveKit room as a participant
- Capture and save the video stream

### 2. Save Recorded Videos

When a stream ends:

1. Save the recording to `public/videos/{videoId}.mp4`
2. Update the database:
   ```json
   {
     "id": "videoId",
     "status": "recorded",
     "videoUrl": "/videos/{videoId}.mp4",
     "endedAt": "2026-01-18T10:30:00Z"
   }
   ```

### 3. API Response

When dispatcher fetches video data, return:

```json
{
  "id": "abc-123",
  "incidentId": "inc-456",
  "status": "recorded",
  "videoUrl": "/videos/abc-123.mp4",
  "lat": 37.7749,
  "lng": -122.4194,
  "startedAt": "2026-01-18T10:00:00Z",
  "endedAt": "2026-01-18T10:15:00Z",
  "currentState": "Car accident on Market St...",
  ...
}
```

## Testing the Replay Feature

### Method 1: End-to-End with LiveKit Recording

1. Upload a video (e.g., named `pov1.mov`) on caller page
2. Wait for 3 anomaly signals → triggers live streaming
3. Video streams live to dispatcher via LiveKit
4. Backend records the stream via LiveKit Egress
5. When stream ends, backend saves to `/videos/{videoId}.mp4`
6. Backend updates status to `"recorded"` and sets `videoUrl`
7. Dispatcher refreshes → sees **Recorded Video** player
8. Click to play the recording

### Method 2: Manual Testing (Without LiveKit Recording)

For quick testing without setting up recording:

1. Manually copy a test video:
   ```bash
   # Get the videoId from the caller page UI
   cp test-video.mp4 public/videos/abc-123.mp4
   ```

2. Manually update your database:
   ```sql
   UPDATE videos
   SET status = 'recorded',
       videoUrl = '/videos/abc-123.mp4',
       endedAt = NOW()
   WHERE id = 'abc-123';
   ```

3. Refresh dispatcher → video should now show replay player

## File Format

Recorded videos should be web-compatible:
- **Recommended:** MP4 with H.264 codec
- **Also supported:** WebM, MOV (if browser-compatible)

## Complete Workflow Example

```
┌──────────────────────────────────────────────────────────────┐
│ CALLER UPLOADS VIDEO                                         │
│ - Filename: pov1.mov                                         │
│ - Coords parsed: (37.7749, -122.4194)                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ 3 ANOMALY SIGNALS DETECTED                                   │
│ - WebSocket init: { videoId, lat, lng, filename }           │
│ - Backend creates incident/video record                      │
│ - Backend stores filename for replay URL                     │
│ - Status: "live"                                             │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ LIVE STREAMING                                               │
│ - Caller → LiveKit → Dispatcher                             │
│ - Backend records stream (LiveKit Egress)                    │
│ - Dispatcher watches LIVE                                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ STREAM ENDS                                                  │
│ - Backend uses stored filename (e.g., "pov1.mov")           │
│ - Update DB: status="recorded", videoUrl="/videos/pov1.mov" │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ DISPATCHER REPLAYS                                           │
│ - Clicks on recorded video                                   │
│ - HTML5 player loads from /videos/{videoId}.mp4            │
│ - Can download, rewatch, share                              │
└──────────────────────────────────────────────────────────────┘
```

## Troubleshooting

**Video won't play:**
- Check file exists: `ls public/videos/{videoId}.mp4`
- Verify browser console for 404 errors
- Ensure video codec is browser-compatible (use H.264)

**Still showing "Live" instead of replay:**
- Verify database has `status: "recorded"` not `"live"` or `"ended"`
- Check `videoUrl` is set and not null
- Refresh dispatcher page

**Wrong coordinates on map:**
- Filename must match pattern (e.g., `pov1.mov` not `POV1.MOV`)
- Check mapping function in `app/page.tsx` around line 30-50

**LiveKit recording not working:**
- Verify LiveKit Egress is configured
- Check backend logs for recording errors
- Ensure sufficient disk space for recordings
