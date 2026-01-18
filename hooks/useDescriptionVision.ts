import { useOvershootVision } from "./useOvershootVision";

const DESCRIPTION_VISION_PROMPT = `Analyze the scene and return ONLY valid JSON. No markdown, no extra text.

Example format:
{
  "scenario": "carAccident",
  "data": {
    "description": "what you see in the scene"
  }
}

Rules:
- "scenario" must be one of: "carAccident", "fire", "medical", "unknown"
- "data" must have a "description" field (string)
- Add any other relevant fields to "data" as needed
- Return ONLY the JSON object
- NO markdown code blocks
- NO backticks
- Use proper JSON syntax with commas between fields`;

interface UseDescriptionVisionProps {
  onSnapshot?: (scenario: string, data: any) => void
}

export function useDescriptionVision(props?: UseDescriptionVisionProps) {
  const { vision, startVision, clearVision } = useOvershootVision({
    prompt: DESCRIPTION_VISION_PROMPT,
    clipLengthSeconds: 1,
    delaySeconds: 0.5,
    onResult: (result: any) => {
      if (result?.ok && result?.result) {
        try {
          console.log('Description vision result:', result.result);
          
          // Clean up the result - remove markdown code blocks if present
          let cleanResult = result.result.trim();
          
          // Remove markdown code blocks (```json ... ``` or ``` ... ```)
          cleanResult = cleanResult.replace(/^```(?:json)?\s*/g, '').replace(/\s*```$/g, '');
          
          // Fix malformed JSON where description has a colon followed by additional_fields
          // Pattern: "description":"text":"additional_fields"
          // Should be: "description":"text","additional_fields"
          cleanResult = cleanResult.replace(/"description":"([^"]*(?:\\.[^"]*)*)":"additional_fields"/g, '"description":"$1","additional_fields"');
          
          // Remove any leading/trailing whitespace or newlines
          cleanResult = cleanResult.trim();
          
          const parsed = JSON.parse(cleanResult);
          console.log('Description vision parsed:', parsed);

          // Call the snapshot callback if provided
          if (props?.onSnapshot && parsed.scenario && parsed.data) {
            props.onSnapshot(parsed.scenario, parsed.data)
          }
        } catch (e) {
          console.error('Failed to parse vision result:', e);
          console.error('Raw result:', result.result);
        }
      }
    },
    onError: (error) => {
      console.error('Description vision error:', error.message);
    }
  });

  return { vision, startVision, clearVision };
}