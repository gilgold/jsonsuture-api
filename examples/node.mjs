const API = "https://vesper-3159a405.base44.app/functions/v1RepairJson";
const apiKey = process.env.JSONSUTURE_API_KEY;
if (!apiKey) throw new Error("Set JSONSUTURE_API_KEY first");

const modelOutput = "```json\n{answer: 'Ship it', confidence: 0.94,}\n```";
const response = await fetch(API, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: modelOutput,
    schema: {
      type: "object",
      required: ["answer", "confidence"],
      properties: {
        answer: { type: "string" },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      additionalProperties: false,
    },
  }),
});

const body = await response.json();
if (!response.ok) throw new Error(JSON.stringify(body));
console.log(body.result);
