const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'telemetry.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function calculateTelemetry() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  // 1. Temperature: Sinusoidal diurnal fluctuation (20 C to 36 C) peaking at 2:00 PM (hour 14)
  // Shift wave so it peaks at hour 14: cos((hour - 14) * PI / 12)
  const tempWave = Math.cos((hour - 14) * Math.PI / 12);
  const temperature = +(28 + 8 * tempWave + 0.1 * Math.sin(minute)).toFixed(1);

  // 2. Humidity: Inversely proportional to temperature (50% to 85%)
  const humidity = +(67.5 - 17.5 * tempWave + 0.2 * Math.cos(minute)).toFixed(1);

  // 3. Soil Moisture: Linear drying cycle over 4 hours for simulation speed (30% to 80%)
  // Repeats every 4 hours. Drops from 80% to 30%, then resets (simulated irrigation).
  const cycleMs = 4 * 60 * 60 * 1000;
  const progress = (now.getTime() % cycleMs) / cycleMs;
  const soilMoisture = +(80 - 50 * progress + 0.5 * Math.sin(second * 0.1)).toFixed(1);

  // 4. Soil NPK: Stable baseline with minor cyclical drifts (step-wise variation)
  const nitrogen = Math.round(100 + 4 * Math.sin(minute * Math.PI / 30) + 1 * Math.cos(second * 0.1));
  const phosphorus = Math.round(40 + 2 * Math.cos(minute * Math.PI / 30) + 0.5 * Math.sin(second * 0.1));
  const potassium = Math.round(175 + 6 * Math.sin(minute * Math.PI / 15) + 2 * Math.cos(second * 0.1));

  // 5. pH: stable around 6.5
  const ph = +(6.5 + 0.15 * Math.sin(minute * Math.PI / 20)).toFixed(1);

  // 6. Rainfall: simulated daily afternoon shower (e.g. 4 PM - 5 PM)
  const rainfall = (hour === 16) ? Math.floor(40 + 20 * Math.sin(minute * Math.PI / 10)) : 0;

  return {
    temperature,
    humidity,
    soilMoisture,
    nitrogen,
    phosphorus,
    potassium,
    ph,
    rainfall,
    timestamp: now.toISOString()
  };
}

function runSimulator() {
  const telemetry = calculateTelemetry();
  
  // Simulated MQTT publish message
  console.log(`[MQTT Broker] Publishing to topic 'farm/sensors/telemetry':`, JSON.stringify(telemetry));

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ success: true, data: telemetry }, null, 2));
  } catch (err) {
    console.error('Failed to write telemetry data file:', err.message);
  }
}

// If run directly
if (require.main === module) {
  console.log('--- Starting Standalone Telemetry Simulator daemon ---');
  console.log('Writing to:', DATA_FILE);
  // Run immediately and then every 10 seconds
  runSimulator();
  setInterval(runSimulator, 10000);
} else {
  module.exports = { calculateTelemetry };
}
