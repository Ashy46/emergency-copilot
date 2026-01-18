"use client";

import { useState } from "react";
import { LiveKitRoom, VideoTrack, useTracks, useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";

export default function TestCallerPage() {
  const [roomName, setRoomName] = useState("video_v1");
  const [callerId, setCallerId] = useState("caller_c1");
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectAsCaller = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName,
          identity: callerId,
          role: "caller",
        }),
      });

      const data = await response.json();
      setUrl(data.url);
      setToken(data.token);
    } catch (err) {
      console.error("Failed to connect:", err);
      alert("Failed to connect to LiveKit");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Test Caller Page</h1>

        {!token ? (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl text-white mb-4">Connect as Caller</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Room Name (Video ID)</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  placeholder="video_v1"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Caller ID (Identity)</label>
                <input
                  type="text"
                  value={callerId}
                  onChange={(e) => setCallerId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg"
                  placeholder="caller_c1"
                />
              </div>
              <button
                onClick={connectAsCaller}
                disabled={isConnecting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {isConnecting ? "Connecting..." : "Connect & Publish Video"}
              </button>
            </div>
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
              <p className="text-sm text-blue-200">
                <strong>Instructions:</strong><br />
                1. Enter a room name (e.g., "video_v1")<br />
                2. Enter your caller ID (e.g., "caller_c1")<br />
                3. Click connect - you'll need to allow camera access<br />
                4. Open the dispatcher page and select this event to see your video
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white">Connected as {callerId}</h2>
              <button
                onClick={() => {
                  setToken(null);
                  setUrl(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Disconnect
              </button>
            </div>
            <LiveKitRoom
              serverUrl={url!}
              token={token}
              connect={true}
              video={true}
              audio={true}
              onConnected={() => console.log("Connected to room")}
              onDisconnected={() => console.log("Disconnected from room")}
              className="w-full"
            >
              <RoomContent callerId={callerId} />
            </LiveKitRoom>
          </div>
        )}
      </div>
    </div>
  );
}

function RoomContent({ callerId }: { callerId: string }) {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera]);

  return (
    <div className="space-y-4">
      <div className="bg-gray-700 p-4 rounded-lg">
        <div className="text-green-400 font-semibold mb-2">✓ Connected to room</div>
        <div className="text-gray-300 text-sm space-y-1">
          <div>Identity: <span className="font-mono text-white">{callerId}</span></div>
          <div>Publishing: <span className="font-mono text-white">
            {localParticipant.isCameraEnabled ? "Camera ON" : "Camera OFF"}
          </span></div>
        </div>
      </div>

      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {tracks.length > 0 && tracks[0].publication.track ? (
          <VideoTrack
            trackRef={tracks[0]}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-24 h-24 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p>Waiting for camera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-yellow-900/30 border border-yellow-700 p-4 rounded-lg">
        <p className="text-yellow-200 text-sm">
          <strong>Now:</strong> Go to the dispatcher page, simulate an event with the same caller ID and video ID, then select it to see this video feed.
        </p>
      </div>
    </div>
  );
}
