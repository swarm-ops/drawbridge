---
name: drawbridge
description: |
  Generate Excalidraw diagrams with a hand-drawn aesthetic using Drawbridge.
  Use when user asks for: flowcharts, dependency diagrams, project visualization,
  task maps, or "make a diagram of this". Pushes elements to a live Excalidraw
  canvas via HTTP API, or renders to PNG/SVG.
---

# Drawbridge - Real-time Diagram API

This skill enables AI agents to create and manipulate diagrams using the Drawbridge server API. Drawbridge provides a real-time Excalidraw canvas with HTTP API and WebSocket support for collaborative diagram creation.

## Server Setup

Start the Drawbridge server:
```bash
npm start
# or with PM2 for production:
pm2 start ecosystem.config.js
```

Server runs on port 3062 by default (configurable via `DRAWBRIDGE_PORT`).

## API Reference

### Core Endpoints

**POST /api/session/:id/elements**
Replace all elements in a session.
```bash
curl -X POST http://localhost:3062/api/session/my-diagram/elements \
  -H "Content-Type: application/json" \
  -d '{"elements": [...]}'
```

**POST /api/session/:id/append**
Add elements to existing session (progressive drawing).
```bash
curl -X POST http://localhost:3062/api/session/my-diagram/append \
  -H "Content-Type: application/json" \
  -d '{"elements": [...]}'
```

**GET /api/session/:id**
Get current elements, appState, and viewport for a session.
```bash
curl http://localhost:3062/api/session/my-diagram
```

**POST /api/session/:id/clear**
Clear all elements from a session.
```bash
curl -X POST http://localhost:3062/api/session/my-diagram/clear
```

**POST /api/session/:id/viewport**
Set camera position and zoom level.
```bash
curl -X POST http://localhost:3062/api/session/my-diagram/viewport \
  -H "Content-Type: application/json" \
  -d '{"x": 100, "y": 200, "width": 1024, "height": 768}'
```

**POST /api/session/:id/undo**
Undo the last operation.
```bash
curl -X POST http://localhost:3062/api/session/my-diagram/undo
```

### Management Endpoints

**GET /api/sessions**
List all active sessions with element and client counts.

**GET /health**
Health check with server status and connection counts.

**GET /api/session/:id/versions**
List available snapshot versions for time-travel restore.

**POST /api/session/:id/restore**
Restore session from a specific snapshot timestamp.

### File Upload (Images)

**POST /api/session/:id/files**
Upload images to Digital Ocean Spaces CDN.
```bash
curl -X POST http://localhost:3062/api/session/my-diagram/files \
  -H "Content-Type: application/json" \
  -d '{"fileId": "img-1", "dataURL": "data:image/png;base64,...", "mimeType": "image/png"}'
```

**GET /api/session/:id/files**
Get file metadata for a session.

### Real-time Updates

**WebSocket: ws://localhost:3062/ws/:sessionId**
Connect for real-time bidirectional updates:
- Receive element changes from other clients
- Send collaborative edits
- Get viewport updates
- File upload notifications

## Element Format Reference

### Simplified Format (Recommended)

Only specify what matters. `convertToExcalidrawElements` fills in all required internal properties:

```json
{
  "id": "unique-element-id",
  "type": "rectangle|ellipse|diamond|arrow|line|text|freedraw|image",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 100
}
```

### Full Excalidraw Format

For direct API usage, include all required fields:

```json
{
  "id": "unique-element-id",
  "type": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 100,
  "strokeColor": "#000000",
  "backgroundColor": "#ffffff", 
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "opacity": 100,
  "angle": 0,
  "seed": 123456,
  "versionNonce": 789012,
  "updated": 1640995200000,
  "isDeleted": false,
  "groupIds": [],
  "roundness": null,
  "boundElements": null,
  "link": null,
  "locked": false
}
```

### Labeled Shapes (Preferred)

Add `label` to any shape for auto-centered text:

```json
{
  "type": "rectangle",
  "id": "r1",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 80,
  "roundness": { "type": 3 },
  "backgroundColor": "#a5d8ff",
  "fillStyle": "solid",
  "label": { "text": "API Server", "fontSize": 20 }
}
```

### Element Type Examples

**Rectangle with Label**
```json
{
  "id": "rect-1",
  "type": "rectangle",
  "x": 100, "y": 100,
  "width": 200, "height": 100,
  "strokeColor": "#000000",
  "backgroundColor": "#e7f3ff",
  "fillStyle": "solid",
  "strokeWidth": 2,
  "roughness": 1,
  "roundness": { "type": 3 },
  "label": { "text": "Process Step", "fontSize": 18 }
}
```

**Text Element**
```json
{
  "id": "text-1",
  "type": "text", 
  "x": 150, "y": 140,
  "width": 100, "height": 25,
  "text": "Process Step",
  "fontSize": 16,
  "fontFamily": 1,
  "textAlign": "center",
  "verticalAlign": "middle",
  "strokeColor": "#000000",
  "backgroundColor": "transparent"
}
```

**Arrow with Bindings**
```json
{
  "id": "arrow-1",
  "type": "arrow",
  "x": 300, "y": 150,
  "width": 150, "height": 0,
  "points": [[0, 0], [150, 0]],
  "startBinding": {"elementId": "rect-1", "focus": 0.5, "gap": 10},
  "endBinding": {"elementId": "rect-2", "focus": 0.5, "gap": 10},
  "startArrowhead": null,
  "endArrowhead": "arrow",
  "strokeColor": "#000000",
  "strokeWidth": 2,
  "label": { "text": "API call", "fontSize": 14 }
}
```

**Diamond (Decision)**
```json
{
  "id": "diamond-1",
  "type": "diamond",
  "x": 200, "y": 300,
  "width": 120, "height": 80,
  "strokeColor": "#000000", 
  "backgroundColor": "#fff2cc",
  "fillStyle": "solid",
  "label": { "text": "Decision?", "fontSize": 16 }
}
```

## Common Diagram Patterns

### Simple Flowchart
```bash
curl -X POST http://localhost:3062/api/session/flowchart/elements \
  -H "Content-Type: application/json" \
  -d '{
    "elements": [
      {
        "id": "start",
        "type": "ellipse",
        "x": 100, "y": 50,
        "width": 100, "height": 60,
        "backgroundColor": "#d4ffd4",
        "strokeColor": "#000000",
        "strokeWidth": 2,
        "roundness": { "type": 3 },
        "label": { "text": "Start", "fontSize": 16 }
      },
      {
        "id": "process",
        "type": "rectangle", 
        "x": 100, "y": 150,
        "width": 100, "height": 60,
        "backgroundColor": "#e7f3ff",
        "strokeColor": "#000000",
        "roundness": { "type": 3 },
        "label": { "text": "Process", "fontSize": 16 }
      },
      {
        "id": "arrow-1",
        "type": "arrow",
        "x": 150, "y": 110,
        "width": 0, "height": 40,
        "points": [[0, 0], [0, 40]],
        "startBinding": {"elementId": "start", "focus": 0.5, "gap": 5},
        "endBinding": {"elementId": "process", "focus": 0.5, "gap": 5},
        "endArrowhead": "arrow"
      }
    ]
  }'
```

### System Architecture Diagram  
```bash
curl -X POST http://localhost:3062/api/session/architecture/elements \
  -H "Content-Type: application/json" \
  -d '{
    "elements": [
      {
        "id": "frontend",
        "type": "rectangle",
        "x": 50, "y": 50,
        "width": 120, "height": 80, 
        "backgroundColor": "#e1f5fe",
        "strokeColor": "#01579b",
        "strokeWidth": 2,
        "roundness": { "type": 3 },
        "label": { "text": "Frontend", "fontSize": 16 }
      },
      {
        "id": "backend", 
        "type": "rectangle",
        "x": 250, "y": 50,
        "width": 120, "height": 80,
        "backgroundColor": "#f3e5f5", 
        "strokeColor": "#4a148c",
        "roundness": { "type": 3 },
        "label": { "text": "Backend", "fontSize": 16 }
      },
      {
        "id": "api-call",
        "type": "arrow",
        "x": 170, "y": 90, 
        "width": 80, "height": 0,
        "points": [[0, 0], [80, 0]],
        "startBinding": {"elementId": "frontend", "focus": 0.5, "gap": 5},
        "endBinding": {"elementId": "backend", "focus": 0.5, "gap": 5},
        "endArrowhead": "arrow",
        "label": { "text": "API", "fontSize": 14 }
      }
    ]
  }'
```

### Network/Infrastructure Diagram
```bash
curl -X POST http://localhost:3062/api/session/network/elements \
  -H "Content-Type: application/json" \
  -d '{
    "elements": [
      {
        "id": "router",
        "type": "diamond",
        "x": 200, "y": 100,
        "width": 100, "height": 60,
        "backgroundColor": "#ffecb3",
        "strokeColor": "#f57f17",
        "label": { "text": "Router", "fontSize": 16 }
      },
      {
        "id": "server1",
        "type": "rectangle", 
        "x": 100, "y": 250,
        "width": 80, "height": 60,
        "backgroundColor": "#c8e6c9",
        "strokeColor": "#2e7d32",
        "roundness": { "type": 3 },
        "label": { "text": "Server 1", "fontSize": 14 }
      },
      {
        "id": "server2",
        "type": "rectangle",
        "x": 300, "y": 250, 
        "width": 80, "height": 60,
        "backgroundColor": "#c8e6c9",
        "strokeColor": "#2e7d32",
        "roundness": { "type": 3 },
        "label": { "text": "Server 2", "fontSize": 14 }
      }
    ]
  }'
```

## Color Palette

### Primary Colors (strokes, text)
| Name | Hex | Use |
|------|-----|-----|
| Blue | `#4a9eed` | Primary actions, links |
| Amber | `#f59e0b` | Warnings, highlights |
| Green | `#22c55e` | Success, positive |
| Red | `#ef4444` | Errors, negative |
| Purple | `#8b5cf6` | Accents, special |
| Cyan | `#06b6d4` | Info, secondary |

### Fills (backgrounds)
| Color | Hex | Use |
|-------|-----|-----|
| Light Blue | `#e7f3ff` | Input, sources, primary |
| Light Green | `#d4ffd4` | Success, output, completed |
| Light Orange | `#fff2cc` | Warning, pending, external |
| Light Purple | `#f3e5f5` | Processing, middleware |
| Light Red | `#ffebee` | Error, critical, alerts |
| Light Yellow | `#fffbf0` | Notes, decisions, planning |
| Light Teal | `#e0f7fa` | Storage, data, memory |

### Background Zones (use with opacity: 30-35)
| Color | Hex | Use |
|-------|-----|-----|
| Blue zone | `#dbe4ff` | UI / frontend layer |
| Purple zone | `#e5dbff` | Logic / agent layer |
| Green zone | `#d3f9d8` | Data / tool layer |

## Progressive Drawing

Build diagrams step by step using `/append`:

```bash
# Step 1: Add main components
curl -X POST http://localhost:3062/api/session/diagram/elements \
  -H "Content-Type: application/json" \
  -d '{"elements": [{"id": "start", "type": "ellipse", "x": 100, "y": 50, "width": 100, "height": 60, "backgroundColor": "#d4ffd4", "label": {"text": "Start", "fontSize": 16}}]}'

# Step 2: Add more components  
curl -X POST http://localhost:3062/api/session/diagram/append \
  -H "Content-Type: application/json" \
  -d '{"elements": [{"id": "process", "type": "rectangle", "x": 100, "y": 150, "width": 100, "height": 60, "backgroundColor": "#e7f3ff", "roundness": {"type": 3}, "label": {"text": "Process", "fontSize": 16}}]}'

# Step 3: Connect with arrows
curl -X POST http://localhost:3062/api/session/diagram/append \
  -H "Content-Type: application/json" \
  -d '{"elements": [{"id": "arrow-1", "type": "arrow", "x": 150, "y": 110, "width": 0, "height": 40, "points": [[0, 0], [0, 40]], "startBinding": {"elementId": "start", "focus": 0.5, "gap": 5}, "endBinding": {"elementId": "process", "focus": 0.5, "gap": 5}, "endArrowhead": "arrow"}]}'
```

## Complex Diagram Examples

### System Architecture with Zones

```json
{
  "elements": [
    {
      "id": "title",
      "type": "text",
      "x": 200, "y": 10,
      "text": "System Architecture",
      "fontSize": 28,
      "strokeColor": "#000000"
    },
    {
      "id": "zone-fe",
      "type": "rectangle",
      "x": 80, "y": 60,
      "width": 300, "height": 200,
      "backgroundColor": "#dbe4ff",
      "fillStyle": "solid",
      "roundness": { "type": 3 },
      "strokeColor": "#4a9eed",
      "strokeWidth": 1,
      "opacity": 35
    },
    {
      "id": "zone-fe-label",
      "type": "text",
      "x": 100, "y": 66,
      "text": "Frontend Layer",
      "fontSize": 16,
      "strokeColor": "#1971c2"
    },
    {
      "id": "app",
      "type": "rectangle",
      "x": 120, "y": 100,
      "width": 200, "height": 80,
      "roundness": { "type": 3 },
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "strokeColor": "#1971c2",
      "strokeWidth": 2,
      "label": { "text": "React App", "fontSize": 20 }
    },
    {
      "id": "api-arrow",
      "type": "arrow",
      "x": 320, "y": 140,
      "width": 150, "height": 0,
      "points": [[0,0],[150,0]],
      "startBinding": {"elementId": "app", "focus": 0.5, "gap": 5},
      "endBinding": {"elementId": "api", "focus": 0.5, "gap": 5},
      "endArrowhead": "arrow",
      "label": { "text": "REST API", "fontSize": 14 }
    },
    {
      "id": "api",
      "type": "rectangle",
      "x": 470, "y": 100,
      "width": 200, "height": 80,
      "roundness": { "type": 3 },
      "backgroundColor": "#d0bfff",
      "fillStyle": "solid",
      "strokeColor": "#6f42c1",
      "strokeWidth": 2,
      "label": { "text": "API Server", "fontSize": 20 }
    }
  ]
}
```

### Decision Flowchart

```json
{
  "elements": [
    {
      "id": "start",
      "type": "ellipse",
      "x": 200, "y": 50,
      "width": 100, "height": 60,
      "backgroundColor": "#d4ffd4",
      "strokeColor": "#2e7d32",
      "roundness": { "type": 3 },
      "label": { "text": "Start", "fontSize": 16 }
    },
    {
      "id": "decision",
      "type": "diamond",
      "x": 175, "y": 150,
      "width": 150, "height": 80,
      "backgroundColor": "#fff2cc",
      "strokeColor": "#f57f17",
      "label": { "text": "Valid input?", "fontSize": 16 }
    },
    {
      "id": "yes-path",
      "type": "rectangle",
      "x": 350, "y": 150,
      "width": 120, "height": 60,
      "backgroundColor": "#d4ffd4",
      "strokeColor": "#2e7d32",
      "roundness": { "type": 3 },
      "label": { "text": "Process", "fontSize": 16 }
    },
    {
      "id": "no-path",
      "type": "rectangle",
      "x": 50, "y": 280,
      "width": 120, "height": 60,
      "backgroundColor": "#ffebee",
      "strokeColor": "#d32f2f",
      "roundness": { "type": 3 },
      "label": { "text": "Show Error", "fontSize": 16 }
    }
  ]
}
```

### Network Topology

```json
{
  "elements": [
    {
      "id": "internet",
      "type": "ellipse",
      "x": 200, "y": 20,
      "width": 100, "height": 60,
      "backgroundColor": "#ffecb3",
      "strokeColor": "#f57f17",
      "label": { "text": "Internet", "fontSize": 16 }
    },
    {
      "id": "firewall",
      "type": "diamond",
      "x": 175, "y": 120,
      "width": 150, "height": 60,
      "backgroundColor": "#ffcdd2",
      "strokeColor": "#d32f2f",
      "label": { "text": "Firewall", "fontSize": 16 }
    },
    {
      "id": "load-balancer",
      "type": "rectangle",
      "x": 150, "y": 220,
      "width": 200, "height": 60,
      "backgroundColor": "#e1f5fe",
      "strokeColor": "#01579b",
      "roundness": { "type": 3 },
      "label": { "text": "Load Balancer", "fontSize": 16 }
    },
    {
      "id": "server-1",
      "type": "rectangle",
      "x": 50, "y": 320,
      "width": 100, "height": 60,
      "backgroundColor": "#c8e6c9",
      "strokeColor": "#2e7d32",
      "roundness": { "type": 3 },
      "label": { "text": "Server 1", "fontSize": 16 }
    },
    {
      "id": "server-2",
      "type": "rectangle",
      "x": 200, "y": 320,
      "width": 100, "height": 60,
      "backgroundColor": "#c8e6c9", 
      "strokeColor": "#2e7d32",
      "roundness": { "type": 3 },
      "label": { "text": "Server 2", "fontSize": 16 }
    },
    {
      "id": "server-3",
      "type": "rectangle", 
      "x": 350, "y": 320,
      "width": 100, "height": 60,
      "backgroundColor": "#c8e6c9",
      "strokeColor": "#2e7d32", 
      "roundness": { "type": 3 },
      "label": { "text": "Server 3", "fontSize": 16 }
    }
  ]
}
```

## Sizing Rules

### Font Sizes
- **Minimum 16** for body text, labels, descriptions
- **Minimum 20** for titles and headings  
- **Minimum 14** for secondary annotations only (sparingly)

### Element Sizes
- **Minimum 120x60** for labeled rectangles/ellipses
- **20-30px gaps** between elements minimum
- Prefer fewer, larger elements over many tiny ones

## View the Diagram

Open browser to: `http://localhost:3062/#session-id`

## Best Practices

1. **Use meaningful IDs**: `user-login`, `db-query`, `payment-gateway`
2. **Group related elements**: Use consistent naming like `step-1`, `step-2`
3. **Set proper dimensions**: Calculate based on text content
4. **Use appropriate colors**: Match element types to semantic colors
5. **Position logically**: Left-to-right flow, proper spacing
6. **Add labels**: Include text for all shapes that need labels
7. **Connect with arrows**: Use proper bindings for connected elements
8. **Progressive drawing**: Build diagrams step-by-step for live viewing

## Camera Control

Set viewport to focus on specific diagram areas:
```bash
curl -X POST http://localhost:3062/api/session/my-diagram/viewport \
  -H "Content-Type: application/json" \
  -d '{"x": 0, "y": 0, "width": 1200, "height": 800}'
```

## Session Management

- Sessions persist automatically to disk in `./data/`
- Use descriptive session IDs: `user-onboarding`, `payment-flow`, `system-architecture`  
- Sessions support undo, clear, and snapshot versioning
- Multiple clients can collaborate on the same session via WebSocket
- Sessions are evicted from memory after 5 minutes of inactivity (data remains on disk)

## Rendering to Files

Export diagrams as PNG or SVG:
```bash
# Get session data and render to image
curl -s http://localhost:3062/api/session/my-diagram > diagram.excalidraw
npx tsx scripts/render.ts diagram.excalidraw diagram.png
npx tsx scripts/render.ts diagram.excalidraw diagram.svg
```

## Generation Workflow

1. **Plan layout** — Decide zones, flow direction, element grouping
2. **Generate elements** — Follow progressive drawing order  
3. **Push to live viewer** — For real-time review with user
4. **Set viewport** — Focus camera on the important parts
5. **Render to PNG/SVG** — For embedding in docs, reports, or sharing