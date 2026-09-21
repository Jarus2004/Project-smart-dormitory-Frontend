const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MAX_SCAN_HISTORY = 100;

const clients = [];
const devices = [];
const scans = [];
let latestFrame = null;
let latestFrameType = "image/jpeg";

const findDevice = (device_code) =>
  devices.find((item) => item.device_code === device_code);
const createDevice = (device_code) => ({
  device_code,
  status: "OFFLINE",
  last_seen: new Date(0).toISOString(),
  last_frame_at: null,
});

const ensureDevice = (device_code) => {
  let device = findDevice(device_code);
  if (!device) {
    device = createDevice(device_code);
    devices.push(device);
  }
  return device;
};

const broadcastSse = (event, payload) => {
  const data = JSON.stringify(payload);
  clients.forEach((client) => {
    try {
      client.res.write(`event: ${event}\n`);
      client.res.write(`data: ${data}\n\n`);
    } catch (err) {
      // ignore send errors from disconnected clients
    }
  });
};

// multer for multipart/form-data image uploads (memory storage)
let upload;
try {
  const multer = require("multer");
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });
} catch (err) {
  // multer may not be installed in test environments; provide a noop fallback
  upload = { single: () => (req, res, next) => next() };
}

app.get("/api/face-verification/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders && res.flushHeaders();

  const clientId = Date.now();
  const client = { id: clientId, res };
  clients.push(client);

  const snapshot = {
    devices: devices.length ? devices : [],
    scans: scans.slice(0, MAX_SCAN_HISTORY),
  };
  broadcastSse("snapshot", snapshot);

  req.on("close", () => {
    const idx = clients.findIndex((c) => c.id === clientId);
    if (idx !== -1) clients.splice(idx, 1);
  });
});

app.get("/api/face-verification/devices", (req, res) => {
  res.json({ ok: true, data: { items: devices } });
});

app.get("/api/face-verification/scan-history", (req, res) => {
  res.json({ ok: true, data: { items: scans.slice(0, MAX_SCAN_HISTORY) } });
});

app.post("/api/face-verification/devices/heartbeat", (req, res) => {
  const { device_code } = req.body || {};
  if (!device_code) {
    return res
      .status(400)
      .json({ ok: false, message: "device_code is required" });
  }

  const device = ensureDevice(device_code);
  device.status = "ONLINE";
  device.last_seen = new Date().toISOString();

  broadcastSse("heartbeat", device);
  res.json({ ok: true, data: { device } });
});

app.post("/api/face-verification/devices/live-frame", (req, res) => {
  const { device_code, frame_base64 } = req.body || {};
  if (!device_code || !frame_base64) {
    return res.status(400).json({
      ok: false,
      message: "device_code and frame_base64 are required",
    });
  }

  try {
    latestFrame = Buffer.from(frame_base64, "base64");
  } catch (err) {
    return res
      .status(400)
      .json({ ok: false, message: "frame_base64 must be valid base64" });
  }

  const device = ensureDevice(device_code);
  device.status = "ONLINE";
  const now = new Date().toISOString();
  device.last_seen = now;
  device.last_frame_at = now;

  broadcastSse("live_frame", { device_code });
  res.json({ ok: true, data: { device } });
});

app.post("/api/face-verification/detections", (req, res) => {
  const payload = req.body || {};
  const scan = {
    id: payload.id || `scan-${Date.now()}`,
    student_code: payload.student_code || payload.student?.code || "UNKNOWN",
    direction: payload.direction || "IN",
    confidence: typeof payload.confidence === "number" ? payload.confidence : 0,
    scanned_at: payload.scanned_at || new Date().toISOString(),
    device_code: payload.device_code,
    action: payload.action,
    student: payload.student,
    bounding_box: payload.bounding_box,
  };

  scans.unshift(scan);
  if (scans.length > MAX_SCAN_HISTORY) {
    scans.length = MAX_SCAN_HISTORY;
  }

  broadcastSse("scan", scan);
  res.json({ ok: true, data: { scan } });
});

// Accept a single image upload from browser for verification or live-frame updates.
app.post(
  "/api/face-verification/verify-image",
  upload.single("file"),
  (req, res) => {
    const device_code = (req.body && req.body.device_code) || "CAMERA_01";

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ ok: false, message: "file is required" });
    }

    // Save latest frame to serve via /live/feed.jpg
    latestFrame = Buffer.from(req.file.buffer);
    latestFrameType = req.file.mimetype || "image/jpeg";

    // Ensure device exists and mark online
    const device = ensureDevice(device_code);
    device.status = "ONLINE";
    const now = new Date().toISOString();
    device.last_seen = now;
    device.last_frame_at = now;

    // Broadcast live_frame so UIs know a frame arrived
    broadcastSse("live_frame", { device_code });

    // Broadcast a tracking scan with full-frame normalized bbox so frontend can overlay while verification runs
    const scan = {
      id: `scan-${Date.now()}`,
      student_code: "UNKNOWN",
      direction: "IN",
      confidence: 0,
      scanned_at: now,
      device_code,
      action: "tracking",
      bounding_box: { x: 0, y: 0, width: 1, height: 1 },
    };

    // Do not add tracking scans to history (frontend ignores action:'tracking' for history), but still broadcast
    broadcastSse("scan", scan);

    return res.json({ ok: true, data: { device } });
  },
);

app.get("/live/feed.jpg", (req, res) => {
  if (!latestFrame) {
    return res.status(404).send("No frame available");
  }
  res.setHeader("Content-Type", latestFrameType);
  res.setHeader("Cache-Control", "no-cache");
  res.send(latestFrame);
});

app.get("/health", (req, res) => res.json({ ok: true }));

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`sdms-backend listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
