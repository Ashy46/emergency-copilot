export interface SignalDetectionConfig {
  sensitivityThreshold?: number;  // 0-1, default 0.5
  cooldownMs?: number;            // Prevent rapid re-triggers, default 5000
  signalThreshold?: number;       // Number of signals before triggering callback
  onTransition?: (videoFile: File) => Promise<void>; // Transition callback with video file
}

export interface SignalResult {
  shouldStream: boolean;
  detectedAt?: number;            // Timestamp when anomaly was detected
  anomalyType?: string;           // What type of anomaly was detected
  confidence?: number;            // 0-1 confidence score
}
