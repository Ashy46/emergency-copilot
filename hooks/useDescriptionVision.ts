import { useOvershootVision } from "./useOvershootVision";

const DESCRIPTION_VISION_PROMPT = `You are a description vision agent. You are given a snapshot of a video and you need to analyze the scene and provide a structured description.

Respond with ONLY a JSON object:

{
  "scenario": "<string - one of: 'carAccident', 'fire', 'medical', 'unknown'>",
  "data": {
    "description": "<string - a clear, concise description of what is happening in the scene>",
    <any additional data about the scene structured as a JSON object>
  }
}

IMPORTANT: Return ONLY valid JSON, no additional text or formatting.`;

export function useDescriptionVision() {
  const { vision, startVision, clearVision } = useOvershootVision({
    prompt: DESCRIPTION_VISION_PROMPT,
    clipLengthSeconds: 1,
    delaySeconds: 0.5,
    onResult: (result: any) => {
      if (result?.ok && result?.result) {
        try {
          console.log('Description vision result:', result.result);
          const parsed = JSON.parse(result.result);
          console.log('Description vision parsed:', parsed);

          const URL = `${process.env.NEXT_PUBLIC_API_URL}/api/description-vision`;
          fetch(URL, {
            method: 'POST',
            body: JSON.stringify(parsed),
          }).then(response => response.json()).then(data => {
            console.log('Description vision response:', data);
          }).catch(error => {
            console.error('Failed to send description vision result:', error);
          });
        } catch (e) {
          console.error('Failed to parse vision result:', e);
        }
      }
    },
    onError: (error) => {
      console.error('Description vision error:', error.message);
    }
  });

  return { vision, startVision, clearVision };
}