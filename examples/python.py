import os
import requests

API = "https://vesper-3159a405.base44.app/functions/v1RepairJson"
api_key = os.environ["JSONSUTURE_API_KEY"]
model_output = "```json\n{answer: 'Ship it', confidence: 0.94,}\n```"

response = requests.post(
    API,
    headers={"Authorization": f"Bearer {api_key}"},
    json={
        "text": model_output,
        "schema": {
            "type": "object",
            "required": ["answer", "confidence"],
            "properties": {
                "answer": {"type": "string"},
                "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            },
            "additionalProperties": False,
        },
    },
    timeout=10,
)
response.raise_for_status()
print(response.json()["result"])
