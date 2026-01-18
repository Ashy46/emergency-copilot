import { useOvershootVision } from "./useOvershootVision";

const DESCRIPTION_VISION_PROMPT = `You are a description vision agent. Analyze the scene and provide a structured description.

Return ONLY a valid JSON object with NO markdown formatting, NO backticks, NO additional text:

{
  "scenario": "carAccident" | "fire" | "medical" | "unknown",
  "data": {
    "description": "clear description of what is happening",
    "additional_fields": "any other relevant data as nested JSON"
  }
}

CRITICAL RULES:
- Return ONLY the JSON object
- NO markdown code blocks (no \`\`\`json or \`\`\`)
- NO text before or after the JSON
- Use double quotes for all strings
- Ensure all JSON is properly escaped`;

export function useDescriptionVision() {
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
          
          // Remove any leading/trailing whitespace or newlines
          cleanResult = cleanResult.trim();
          
          const parsed = JSON.parse(cleanResult);
          console.log('Description vision parsed:', parsed);

          // const URL = `${process.env.NEXT_PUBLIC_API_URL}/api/description-vision`;
          // fetch(URL, {
          //   method: 'POST',
          //   body: JSON.stringify(parsed),
          // }).then(response => response.json()).then(data => {
          //   console.log('Description vision response:', data);
          // }).catch(error => {
          //   console.error('Failed to send description vision result:', error);
          // });
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