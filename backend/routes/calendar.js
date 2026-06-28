const express    = require("express");
const router     = express.Router();
const CropCalendar = require("../models/CropCalendar");
const protect    = require("../middleware/auth");
const notify     = require("../lib/notify");
const mailer     = require("../lib/mailer");
const { callGroq } = require("./ai-helpers");


// ── Per-crop agronomic stage data (offsets in days from sowing) ──
// Sources: ICAR crop production guides & state agriculture dept. manuals.
const CROP_DATA = {
  // ── Kharif Cereals ──────────────────────────────────────────
  "rice": [
    { name: "Sowing / Transplanting",  offsetDays: 0,   note: "Seed bed or direct seeding; transplant seedlings at 25–30 days" },
    { name: "First Irrigation",         offsetDays: 3,   note: "Maintain 2–5 cm standing water after transplanting" },
    { name: "Basal Fertilizing (NPK)",  offsetDays: 7,   note: "Apply 50 % N + full P & K as basal dose" },
    { name: "Top Dressing (N)",         offsetDays: 40,  note: "Split N dose at active tillering stage" },
    { name: "Pest & Disease Control",   offsetDays: 55,  note: "Monitor for stem borer, leaf folder & blast; spray if needed" },
    { name: "Panicle Initiation Check", offsetDays: 65,  note: "Ensure adequate water; apply last N top-dress if panicles thin" },
    { name: "Grain Filling Irrigation", offsetDays: 90,  note: "Stop irrigation 10 days before harvest; drain field" },
    { name: "Harvest",                  offsetDays: 120, note: "Harvest when 80–85 % grains turn golden; avoid shattering losses" },
  ],

  "wheat": [
    { name: "Sowing",                   offsetDays: 0,   note: "Sow at 100–125 kg/ha seed rate; 20–22 cm row spacing" },
    { name: "Crown Root Irrigation",    offsetDays: 21,  note: "Critical first irrigation at 20–21 DAS (crown root initiation)" },
    { name: "Basal Fertilizing",        offsetDays: 0,   note: "Apply full P & K + 50 % N at sowing" },
    { name: "Tillering Irrigation",     offsetDays: 40,  note: "Second irrigation at tillering stage" },
    { name: "Top Dressing (N)",         offsetDays: 42,  note: "Apply remaining 50 % N immediately after tillering irrigation" },
    { name: "Jointing Irrigation",      offsetDays: 60,  note: "Third irrigation at jointing; avoid water stress" },
    { name: "Pest Control",             offsetDays: 65,  note: "Scout for aphids, yellow rust, Karnal bunt; spray if threshold crossed" },
    { name: "Heading / Flowering Irr.", offsetDays: 80,  note: "Fourth irrigation at heading/flowering — most critical" },
    { name: "Grain Filling Irrigation", offsetDays: 100, note: "Fifth irrigation at grain filling (milky stage)" },
    { name: "Harvest",                  offsetDays: 120, note: "Harvest at < 14 % grain moisture; avoid lodging losses" },
  ],

  "maize": [
    { name: "Sowing",                   offsetDays: 0,   note: "Sow 60,000–70,000 seeds/ha; treat seed with fungicide" },
    { name: "First Irrigation",         offsetDays: 10,  note: "Light irrigation if no rain within 10 days of sowing" },
    { name: "Basal Fertilizing",        offsetDays: 0,   note: "Apply 25 % N + full P & K at sowing" },
    { name: "Top Dressing — 1st",       offsetDays: 25,  note: "Apply 50 % N at knee-high stage (25–30 DAS)" },
    { name: "Pest Control (FAW check)", offsetDays: 30,  note: "Inspect whorls for Fall Armyworm; apply Emamectin if >5 % infestation" },
    { name: "Top Dressing — 2nd",       offsetDays: 45,  note: "Apply remaining 25 % N at pre-tassel stage" },
    { name: "Tasseling Irrigation",     offsetDays: 60,  note: "Critical water period: tasseling to silking; no drought stress" },
    { name: "Grain Filling Check",      offsetDays: 80,  note: "Inspect for ear rots; ensure adequate moisture" },
    { name: "Harvest",                  offsetDays: 100, note: "Harvest at 30–35 % moisture for machine harvest; 25 % for storable grain" },
  ],

  "cotton": [
    { name: "Sowing",                   offsetDays: 0,   note: "Sow Bt cotton at 1.5–2 kg/ha; proper seed treatment" },
    { name: "First Irrigation",         offsetDays: 15,  note: "Light irrigation to ensure germination; avoid waterlogging" },
    { name: "Basal Fertilizing",        offsetDays: 0,   note: "Apply full P & K + 25 % N at sowing" },
    { name: "Thinning & Gap Filling",   offsetDays: 20,  note: "Thin to one healthy plant per hill; fill gaps" },
    { name: "Top Dressing — 1st",       offsetDays: 45,  note: "Apply 50 % N at squaring stage" },
    { name: "Pest Scouting (bollworm)", offsetDays: 60,  note: "Scout for American/Pink bollworm; pheromone traps; spray if needed" },
    { name: "Top Dressing — 2nd",       offsetDays: 75,  note: "Apply remaining 25 % N at boll development" },
    { name: "Irrigation at Boll Dev.", offsetDays: 80,  note: "Ensure adequate moisture during boll swelling" },
    { name: "Defoliation / Opening",    offsetDays: 150, note: "Apply ethephon to speed boll opening if needed before winter" },
    { name: "Harvest",                  offsetDays: 170, note: "Pick when 60 % bolls are open; avoid moisture contamination" },
  ],

  "sugarcane": [
    { name: "Planting (Ratoon/Sett)",   offsetDays: 0,   note: "Plant 3-budded setts at 75–90 cm row spacing; treat with fungicide" },
    { name: "Germination Irrigation",   offsetDays: 7,   note: "Light irrigation 5–7 days after planting for sprouting" },
    { name: "Gap Filling",              offsetDays: 30,  note: "Fill gaps with fresh setts before tillering" },
    { name: "Basal Fertilizing",        offsetDays: 30,  note: "Apply N:P:K (250:80:100 kg/ha) in split doses; first dose at 30 DAS" },
    { name: "Top Dressing — 1st",       offsetDays: 60,  note: "Apply second N split dose at grand growth phase" },
    { name: "Earthing Up",              offsetDays: 90,  note: "Earth up rows to prevent lodging; remove dried leaves (trashing)" },
    { name: "Top Dressing — 2nd",       offsetDays: 120, note: "Final N application; stop N after 150 days to favour sugar accumulation" },
    { name: "Pest Control",             offsetDays: 100, note: "Scout for top shoot borer, pyrilla, and red rot; apply BCA/insecticide" },
    { name: "Irrigation Cessation",     offsetDays: 270, note: "Stop irrigation 30–45 days before harvest to increase sugar %" },
    { name: "Harvest",                  offsetDays: 300, note: "Harvest at optimum maturity (CCS > 10 %); cut close to ground" },
  ],

  // ── Rabi / Short Season Vegetables ──────────────────────────
  "potato": [
    { name: "Planting",                 offsetDays: 0,   note: "Plant certified seed tubers at 50–60 cm × 20 cm spacing; treat with fungicide" },
    { name: "First Irrigation",         offsetDays: 7,   note: "Irrigate 7 days after planting to aid sprouting" },
    { name: "Basal Fertilizing",        offsetDays: 0,   note: "Apply full P & K + 50 % N at planting" },
    { name: "Earthing Up",              offsetDays: 25,  note: "First earthing up when shoots are 15–20 cm tall; apply remaining N" },
    { name: "Pest Control (LB check)", offsetDays: 35,  note: "Scout for late blight (Phytophthora infestans); spray Mancozeb preventively" },
    { name: "Second Earthing Up",       offsetDays: 45,  note: "Second earthing up to cover tubers; prevents greening" },
    { name: "Irrigation",               offsetDays: 50,  note: "Maintain consistent soil moisture during tuber bulking; avoid waterlogging" },
    { name: "Haulm Killing",            offsetDays: 80,  note: "Cut / kill haulms 10–14 days before harvest to set skin" },
    { name: "Harvest",                  offsetDays: 90,  note: "Harvest when tops dry; avoid bruising; store at 4–10 °C" },
  ],

  "tomato": [
    { name: "Transplanting",            offsetDays: 0,   note: "Transplant 25–30 day old seedlings; 60 × 45 cm spacing" },
    { name: "First Irrigation",         offsetDays: 2,   note: "Irrigate immediately after transplanting; maintain soil moisture" },
    { name: "Basal Fertilizing",        offsetDays: 0,   note: "Apply FYM 25 t/ha + full P & K + 33 % N at transplanting" },
    { name: "Staking",                  offsetDays: 20,  note: "Stake plants to prevent lodging and fruit rot contact" },
    { name: "Top Dressing — 1st",       offsetDays: 25,  note: "Apply 33 % N at flowering initiation" },
    { name: "Pest Control",             offsetDays: 30,  note: "Scout for fruit borer (H. armigera), whitefly & TYLCV; spray if needed" },
    { name: "Top Dressing — 2nd",       offsetDays: 45,  note: "Apply final 33 % N at fruit set; foliar micronutrients if pale" },
    { name: "First Harvest",            offsetDays: 60,  note: "Pick at mature green to breaker stage for transport; light red for local market" },
    { name: "Final Harvest",            offsetDays: 90,  note: "Continue picking every 4–5 days until vines exhausted" },
  ],

  "onion": [
    { name: "Transplanting",            offsetDays: 0,   note: "Transplant 45-day seedlings at 15 × 10 cm spacing" },
    { name: "First Irrigation",         offsetDays: 3,   note: "Irrigate 3 days after transplanting; maintain adequate soil moisture" },
    { name: "Basal Fertilizing",        offsetDays: 0,   note: "Apply 100 kg N, 50 kg P₂O₅, 50 kg K₂O/ha; half N as basal" },
    { name: "Top Dressing (N)",         offsetDays: 30,  note: "Apply remaining 50 % N at 30 days after transplanting" },
    { name: "Pest Control",             offsetDays: 35,  note: "Check for thrips, purple blotch, downy mildew; spray Spinosad/Mancozeb" },
    { name: "Irrigation Reduction",     offsetDays: 80,  note: "Reduce irrigation frequency to promote bulb maturity & skin hardening" },
    { name: "Neck Fall Check",          offsetDays: 90,  note: "Stop irrigation when 50 % plants show neck fall (natural toppling)" },
    { name: "Harvest",                  offsetDays: 100, note: "Harvest after 75 % neck fall; cure in field for 3–5 days before storage" },
  ],
};

// ── Fuzzy-match user input to a key in CROP_DATA ─────────────────
function resolveCrop(rawName) {
  const n = rawName.toLowerCase().trim();
  // Exact alias map
  const aliases = {
    "rice": "rice", "paddy": "rice", "rice / paddy": "rice",
    "wheat": "wheat",
    "maize": "maize", "corn": "maize", "maize (corn)": "maize",
    "cotton": "cotton",
    "sugarcane": "sugarcane", "sugar cane": "sugarcane",
    "potato": "potato",
    "tomato": "tomato",
    "onion": "onion",
  };
  if (aliases[n]) return aliases[n];
  // Partial match
  for (const key of Object.keys(CROP_DATA)) {
    if (n.includes(key) || key.includes(n)) return key;
  }
  return null; // unknown crop → use generic fallback below
}

// ── Generic fallback for unrecognised crops ───────────────────────
const GENERIC_STAGES = [
  { name: "Sowing / Planting",        offsetDays: 0,   note: "Prepare field; sow / transplant at recommended spacing" },
  { name: "First Irrigation",         offsetDays: 7,   note: "Irrigate within a week to establish crop" },
  { name: "Basal Fertilizing",        offsetDays: 10,  note: "Apply basal dose of NPK as per soil test recommendation" },
  { name: "Thinning & Weeding",       offsetDays: 25,  note: "Thin to desired plant stand; do first weeding" },
  { name: "Top Dressing (N)",         offsetDays: 35,  note: "Apply split N dose at vegetative growth stage" },
  { name: "Pest & Disease Scouting",  offsetDays: 45,  note: "Scout and spray if pest or disease threshold is crossed" },
  { name: "Flowering / Fruiting Irr.",offsetDays: 60,  note: "Ensure adequate water during reproductive stage — most critical" },
  { name: "Pre-Harvest Check",        offsetDays: 80,  note: "Assess maturity indicators; plan harvest logistics" },
  { name: "Harvest",                  offsetDays: 90,  note: "Harvest at physiological / commercial maturity; handle with care" },
];

// Helper to add days to a date
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

// ── AI-powered stage generator ────────────────────────────────────
// Calls Groq to produce a personalised, agronomically accurate
// stage timeline for ANY crop.  Returns an array of
// { name, offsetDays, note } objects, or null on failure.
async function generateAIStages(cropName, sowingDate) {
  const month = new Date(sowingDate).toLocaleString("en", { month: "long" });
  const monthNum = new Date(sowingDate).getMonth() + 1; // 1-12
  const season =
    monthNum >= 6  && monthNum <= 10 ? "Kharif (monsoon sown)" :
    monthNum >= 11 || monthNum <= 3  ? "Rabi (winter sown)"   :
                                       "Zaid (summer sown)";

  const prompt = `You are an expert Indian agricultural scientist with deep knowledge of ICAR crop production guides.

Generate a complete, agronomically accurate crop calendar for:
- Crop: ${cropName}
- Sowing / Planting Month: ${month} (${season})

Rules:
1. Include ALL relevant stages from sowing/transplanting to final harvest.
2. Each stage must have a realistic "offsetDays" from the sowing date, based on real crop growth cycles (e.g. Rice = 120 days, Wheat = 120 days, Sugarcane = 300 days, Tomato = 90 days, etc.).
3. Include stages like: sowing/transplanting, irrigation events, basal fertilizing, top-dressing, weeding/thinning, earthing-up (where relevant), pest/disease scouting, flowering/fruiting irrigation, harvest, and any crop-specific stages (e.g. panicle initiation for rice, boll development for cotton).
4. The "note" must be a single practical, specific sentence a real Indian farmer can act on immediately.
5. Do NOT include generic placeholders — every note must be crop-specific.
6. Number of stages: minimum 6, maximum 12.

Respond ONLY with this JSON (no markdown, no extra text):
{
  "stages": [
    { "name": "Stage Name", "offsetDays": 0, "note": "Practical action for the farmer" }
  ]
}`;

  try {
    const text = await callGroq(prompt, true, "en");
    const clean = text.replace(/^```json\s*/m, "").replace(/```\s*$/m, "").trim();
    const parsed = JSON.parse(clean);
    const stages = parsed.stages;

    // Validate — must be an array with at least 3 valid stage objects
    if (
      !Array.isArray(stages) ||
      stages.length < 3 ||
      !stages.every(s => s.name && typeof s.offsetDays === "number")
    ) {
      console.warn("[Calendar AI] Invalid stage array from AI, using static fallback.");
      return null;
    }

    // Sort by offsetDays ascending so timeline is always in order
    stages.sort((a, b) => a.offsetDays - b.offsetDays);
    console.log(`[Calendar AI] ✅ Generated ${stages.length} AI stages for "${cropName}"`);
    return stages;
  } catch (err) {
    console.warn("[Calendar AI] AI generation failed, using static fallback:", err.message);
    return null;
  }
}

// ── POST /api/calendar — Create a new crop calendar ──────────
router.post("/", protect, async (req, res) => {
  try {
    const { cropName, sowingDate } = req.body;
    if (!cropName || !sowingDate) {
      return res.status(400).json({ success: false, message: "Crop name and sowing date are required." });
    }

    const sowing = new Date(sowingDate);

    // ── Try AI-generated stages first ──────────────────────────
    let stageTemplate = await generateAIStages(cropName, sowing);

    // ── Fall back to static lookup if AI fails ──────────────────
    if (!stageTemplate) {
      const cropKey = resolveCrop(cropName);
      stageTemplate = cropKey ? CROP_DATA[cropKey] : GENERIC_STAGES;
    }

    const stages = stageTemplate.map(stage => ({
      name: stage.name,
      note: stage.note || "",
      dueDate: addDays(sowing, stage.offsetDays),
      status: "pending",
      notifiedAt: null,
    }));

    const calendar = await CropCalendar.create({
      farmer: req.user.id,
      cropName,
      sowingDate: sowing,
      stages,
    });

    res.status(201).json({ success: true, calendar });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/calendar — Get farmer's calendars & trigger reminders ─
router.get("/", protect, async (req, res) => {
  try {
    // Sort by sowingDate descending
    const calendars = await CropCalendar.find({ farmer: req.user.id }).sort({ sowingDate: -1 });

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let calendar of calendars) {
      let updated = false;
      for (let stage of calendar.stages) {
        if (stage.status === "pending" && stage.dueDate <= today && !stage.notifiedAt) {
          // Fire alert notification
          await notify(req.user.id, {
            type: "general",
            title: `Crop Calendar Reminder: ${calendar.cropName}`,
            message: `Stage "${stage.name}" is due or overdue (${new Date(stage.dueDate).toLocaleDateString("en-IN")})!`,
          });

          // Send email notification (non-blocking)
          if (req.user.email) {
            mailer.sendCalendarReminderEmail({
              to: req.user.email,
              farmerName: req.user.name,
              cropName: calendar.cropName,
              stageName: stage.name,
              dueDate: stage.dueDate,
              note: stage.note,
            });
          }

          stage.notifiedAt = new Date();
          updated = true;
        }
      }
      if (updated) {
        await calendar.save();
      }
    }

    res.json({ success: true, calendars });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/calendar/:id/stage/:stageId — Complete a stage ────
router.put("/:id/stage/:stageId", protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findOne({ _id: req.params.id, farmer: req.user.id });
    if (!calendar) {
      return res.status(404).json({ success: false, message: "Calendar not found." });
    }

    const stage = calendar.stages.id(req.params.stageId);
    if (!stage) {
      return res.status(404).json({ success: false, message: "Stage not found." });
    }

    const { status } = req.body;
    stage.status = status || "done";
    if (stage.status === "done") {
      stage.completedAt = new Date();
    } else {
      stage.completedAt = undefined;
    }

    await calendar.save();
    res.json({ success: true, calendar });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/calendar/:id — Delete a calendar ────────────────
router.delete("/:id", protect, async (req, res) => {
  try {
    const calendar = await CropCalendar.findOneAndDelete({ _id: req.params.id, farmer: req.user.id });
    if (!calendar) {
      return res.status(404).json({ success: false, message: "Calendar not found or unauthorized." });
    }
    res.json({ success: true, message: "Crop calendar deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
