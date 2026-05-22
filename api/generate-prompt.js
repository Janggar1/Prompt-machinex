export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = await readBody(req);
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_MODEL || "gpt-4.1";

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY belum diset di Vercel Environment Variables."
      });
    }

    const {
      imageDataUrl = "",
      engine = "General",
      language = "English",
      mode = "faithful",
      focus = "balanced",
      notes = ""
    } = body || {};

    if (!imageDataUrl) {
      return res.status(400).json({ error: "imageDataUrl wajib diisi." });
    }

    if (imageDataUrl.length > 7000000) {
      return res.status(413).json({ error: "Ukuran gambar terlalu besar. Kompres dulu gambarnya." });
    }

    const instructions = `
You are an elite image-to-prompt specialist.

Task:
Analyze the uploaded image and convert it into a high-quality image-generation prompt.

Output language: ${language}
Target generator: ${engine}
Prompt mode: ${mode}
Focus priority: ${focus}

Requirements:
- This is a pure image-to-prompt task.
- Analyze the visual image carefully: subject, hairstyle, hair color, eye color, facial expression, pose, outfit, accessories, framing, camera angle, composition, lighting, background, style, rendering quality, mood, color palette.
- If the image appears anime or illustration, describe it as anime or illustration instead of photo.
- If the image appears photographic, describe it as photo or photorealistic.
- Do not identify real people by name.
- Do not invent extra major objects that are not present.
- When uncertain, describe cautiously.
- For "faithful" mode, prioritize visual fidelity and consistency.
- For "descriptive" mode, be more detailed and expansive.
- For "tag" mode, make the full prompt more compact and tag-like while still readable.

Return EXACTLY in this structure:

FINAL PROMPT:
[one polished prompt ready to paste into an image generator]

NEGATIVE PROMPT:
[one strong negative prompt suitable for the selected generator]

REFERENCE LOCK:
- [bullet]
- [bullet]
- [bullet]

STYLE NOTES:
[brief note about style/rendering/camera/lighting]

GENERATOR TIPS:
[brief practical tips for ${engine}]

SHORT VERSION:
[one compact prompt]

VARIATIONS:
1. [small variation]
2. [small variation]
3. [small variation]
`;

    const userText = `
Analyze this image and convert it into a strong image-generation prompt.

Extra user notes:
${notes || "(none)"}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        instructions,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: userText },
              { type: "input_image", image_url: imageDataUrl, detail: "high" }
            ]
          }
        ],
        max_output_tokens: 1600
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "OpenAI API request failed."
      });
    }

    const prompt = extractText(data);
    return res.status(200).json({ prompt, model });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || "Server error."
    });
  }
}

async function readBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function extractText(data) {
  if (data.output_text) return data.output_text;

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) parts.push(content.text);
    }
  }

  return parts.join("\n").trim() || "Tidak ada output text dari model.";
}
