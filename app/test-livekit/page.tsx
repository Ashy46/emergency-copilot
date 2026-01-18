"use client";

import { useState } from "react";

export default function TestLiveKitPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testToken = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: "test-room",
          identity: "test-user",
          role: "caller",
        }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data,
        parsed: data.token ? parseJWT(data.token) : null,
      });
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const testWebRTC = async () => {
    setLoading(true);
    try {
      // Test if we can access camera/mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Test TURN server connectivity (basic WebRTC check)
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      const candidates: string[] = [];
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          candidates.push(e.candidate.candidate);
        }
      };

      // Create a dummy offer to trigger ICE gathering
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait 3 seconds for ICE candidates
      await new Promise((resolve) => setTimeout(resolve, 3000));

      stream.getTracks().forEach((track) => track.stop());
      pc.close();

      setResult({
        webrtc: "success",
        camera: "accessible",
        iceCandidates: candidates.length,
        candidates: candidates.slice(0, 3), // Show first 3
      });
    } catch (err) {
      setResult({
        webrtc: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">LiveKit Diagnostics</h1>

        <div className="space-y-4">
          {/* Test Token Generation */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl text-white mb-4">1. Test Token Generation</h2>
            <button
              onClick={testToken}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Token API"}
            </button>
          </div>

          {/* Test WebRTC */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl text-white mb-4">2. Test WebRTC Connectivity</h2>
            <button
              onClick={testWebRTC}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Camera & Network"}
            </button>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl text-white mb-4">Results</h2>
              <pre className="bg-gray-900 p-4 rounded text-green-400 text-sm overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-900/30 border border-blue-700 p-6 rounded-lg">
            <h3 className="text-lg text-blue-200 mb-2 font-semibold">Debugging Steps:</h3>
            <ol className="text-blue-100 text-sm space-y-2 list-decimal list-inside">
              <li>Click "Test Token API" - Should return a valid JWT token</li>
              <li>Click "Test Camera & Network" - Will request camera access and test WebRTC</li>
              <li>Check the results below</li>
              <li>
                <strong>If token works but WebRTC fails:</strong>
                <ul className="ml-6 mt-1 space-y-1">
                  <li>• Your firewall/network is blocking WebRTC (common on corporate networks)</li>
                  <li>• Try using your phone's hotspot instead of current WiFi</li>
                  <li>• Check if VPN is enabled and disable it</li>
                </ul>
              </li>
              <li>
                <strong>If you see "iceCandidates: 0":</strong> Your network is blocking STUN/TURN
              </li>
              <li>
                <strong>If camera fails:</strong> Allow camera permissions in browser settings
              </li>
            </ol>
          </div>

          {/* LiveKit Cloud Info */}
          <div className="bg-yellow-900/30 border border-yellow-700 p-6 rounded-lg">
            <h3 className="text-lg text-yellow-200 mb-2 font-semibold">LiveKit Cloud Status</h3>
            <p className="text-yellow-100 text-sm mb-2">
              Your LiveKit URL: <code className="bg-gray-800 px-2 py-1 rounded">wss://hackathon-project-pygmalion-9qj0prnt.livekit.cloud</code>
            </p>
            <p className="text-yellow-100 text-sm">
              If tests pass but LiveKit still fails, your cloud project might be paused/expired.
              Check: <a href="https://cloud.livekit.io" target="_blank" className="underline text-yellow-300">cloud.livekit.io</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseJWT(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return { error: "Failed to parse JWT" };
  }
}
