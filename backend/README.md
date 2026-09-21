# SDMS Backend (FaceGate connector)

This small Express service accepts detection JSON (from an external detector such as FaceGate) and broadcasts Server-Sent-Events (SSE) to connected clients.

Endpoints

- `GET /api/face-verification/events` — SSE endpoint (clients connect and receive `scan` events)
- `POST /api/face-verification/detections` — send detection JSON payload; it will be forwarded to connected clients as `scan` events

Run locally

Install dependencies and start:

```bash
cd backend
npm install
npm start
```

Example curl to send a detection (normalized bbox or pixel coords are supported):

```bash
curl -X POST http://localhost:3000/api/face-verification/detections \
  -H "Content-Type: application/json" \
  -d '{"id":"scan-1","student_code":"S001","direction":"IN","confidence":0.91,"scanned_at":"2026-08-06T00:00:00Z","bounding_box":{"x":100,"y":50,"width":120,"height":140}}'
```

Notes

- The service stores no persistent state; it's a simple forwarder. For production you should add authentication, validation, and persistent storage as needed.
