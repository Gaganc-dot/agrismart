/**
 * ai-helpers.js
 * Shared Groq utility functions used by routes/ai.js and routes/aiChat.js.
 *
 * Provider : Groq (https://console.groq.com)
 * Models   : llama-3.3-70b-versatile  — text generation (fast, free, generous quota)
 *            meta-llama/llama-4-scout-17b-16e-instruct — vision (image analysis)
 *
 * The public function signatures are identical to the old Gemini helpers so
 * no other file needs to change.
 */

const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Text model ────────────────────────────────────────────────────
const TEXT_MODEL   = "llama-3.3-70b-versatile";
// ── Vision model ─────────────────────────────────────────────────
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

// ── Language helper ───────────────────────────────────────────────
function getLanguageName(code) {
  switch (code) {
    case "hi": return "Hindi";
    case "mr": return "Marathi";
    default:   return "English";
  }
}

/**
 * callGroq(prompt, isJson, languageCode)
 * General-purpose text generation.
 * Name kept as-is so existing callers don't need to change.
 */
async function callGroq(prompt, isJson = false, languageCode = "en") {
  const langName = getLanguageName(languageCode);

  const systemContent =
    `You are an expert Indian agricultural advisor helping farmers with crop recommendations, ` +
    `fertilizer advice, disease detection, and government schemes. Always give practical, specific ` +
    `advice for Indian farming conditions. You must output your response completely in ${langName}. ` +
    `Do not mix scripts or use English phonetics in non-English responses.` +
    (isJson
      ? " You MUST respond with a valid JSON object only. Do not include any conversational text or markdown code blocks outside the JSON. Ensure JSON keys and structure exactly match what is requested."
      : "");

  const completion = await groq.chat.completions.create({
    model:    TEXT_MODEL,
    messages: [
      { role: "system",  content: systemContent },
      { role: "user",    content: prompt },
    ],
    temperature:      0.7,
    max_tokens:       2000,
    ...(isJson ? { response_format: { type: "json_object" } } : {}),
  });

  const text = completion.choices[0]?.message?.content || "";
  if (!text) throw new Error("Empty response from Groq API");
  return text;
}

/**
 * callGroqVision(prompt, imageBase64, mimeType, languageCode)
 * Multimodal generation — used by the disease-detection endpoint
 * to analyse a crop/leaf image.
 */
async function callGroqVision(prompt, imageBase64, mimeType, languageCode = "en") {
  const langName = getLanguageName(languageCode);

  const systemContent =
    `You are an expert plant pathologist. You MUST respond ONLY with a valid JSON object ` +
    `matching the requested schema. No conversational text. You must output your response ` +
    `completely in ${langName}. Do not mix scripts or use English phonetics in non-English responses.`;

  const completion = await groq.chat.completions.create({
    model:    VISION_MODEL,
    messages: [
      { role: "system", content: systemContent },
      {
        role:    "user",
        content: [
          {
            type:       "image_url",
            image_url: {
              url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}`,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    temperature:     0.7,
    max_tokens:      1500,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content || "";
  if (!text) throw new Error("Empty response from Groq Vision API");
  return text;
}

/**
 * callGroqChat(systemPrompt, prompt, languageCode)
 * Variant for conversational AI chat — no JSON mode.
 */
async function callGroqChat(systemPrompt, prompt, languageCode = "en") {
  const completion = await groq.chat.completions.create({
    model:    TEXT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: prompt },
    ],
    temperature: 0.8,
    max_tokens:  1500,
  });

  const text = completion.choices[0]?.message?.content || "";
  if (!text) throw new Error("Empty response from Groq API");
  return text;
}

module.exports = { callGroq, callGroqVision, callGroqChat, getLanguageName };
