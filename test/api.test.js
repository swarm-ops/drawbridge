import { strict as assert } from 'assert';
import { WebSocket } from 'ws';

const BASE_URL = 'http://localhost:3062';
const WS_URL = 'ws://localhost:3062';

// Test utilities
async function post(path, data) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return { status: response.status, data: await response.json() };
}

async function get(path) {
  const response = await fetch(`${BASE_URL}${path}`);
  return { status: response.status, data: await response.json() };
}

function waitForWSMessage(ws, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket timeout')), timeout);
    ws.once('message', (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
  });
}

// Sample elements for testing
function createTestElements(count = 2) {
  const elements = [];
  for (let i = 0; i < count; i++) {
    elements.push({
      id: `test-rect-${i}`,
      type: 'rectangle',
      x: i * 100,
      y: i * 50,
      width: 80,
      height: 60,
      strokeColor: '#000000',
      backgroundColor: '#ffffff',
      fillStyle: 'solid',
      strokeWidth: 2,
      roughness: 1,
      opacity: 100,
      angle: 0,
      groupIds: [],
      roundness: null,
      seed: Math.floor(Math.random() * 1000000),
      versionNonce: Math.floor(Math.random() * 1000000),
      isDeleted: false,
      boundElements: null,
      updated: Date.now(),
      link: null,
      locked: false
    });
  }
  return elements;
}

function createTestArrow(fromId, toId) {
  return {
    id: `test-arrow-${fromId}-${toId}`,
    type: 'arrow',
    x: 100,
    y: 100,
    width: 100,
    height: 50,
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    roughness: 1,
    opacity: 100,
    angle: 0,
    groupIds: [],
    roundness: null,
    seed: Math.floor(Math.random() * 1000000),
    versionNonce: Math.floor(Math.random() * 1000000),
    isDeleted: false,
    updated: Date.now(),
    link: null,
    locked: false,
    startBinding: fromId ? { elementId: fromId, focus: 0.5, gap: 0 } : null,
    endBinding: toId ? { elementId: toId, focus: 0.5, gap: 0 } : null,
    lastCommittedPoint: null,
    startArrowhead: null,
    endArrowhead: 'arrow',
    points: [[0, 0], [100, 50]]
  };
}

// Tests
async function testHealthCheck() {
  console.log('Testing health check...');
  const result = await get('/health');
  assert.equal(result.status, 200);
  assert.equal(result.data.status, 'ok');
  console.log('✓ Health check passed');
}

async function testSessionList() {
  console.log('Testing session list...');
  const result = await get('/api/sessions');
  assert.equal(result.status, 200);
  assert(Array.isArray(result.data));
  console.log('✓ Session list works');
}

async function testElementPersistence() {
  console.log('Testing element persistence...');
  const sessionId = `test-session-${Date.now()}`;
  const elements = createTestElements(3);
  
  // Push elements
  const pushResult = await post(`/api/session/${sessionId}/elements`, { elements });
  assert.equal(pushResult.status, 200);
  assert.equal(pushResult.data.success, true);
  assert.equal(pushResult.data.elementCount, 3);
  
  // Retrieve elements
  const getResult = await get(`/api/session/${sessionId}`);
  assert.equal(getResult.status, 200);
  assert.equal(getResult.data.elements.length, 3);
  assert.equal(getResult.data.elements[0].id, 'test-rect-0');
  assert.equal(getResult.data.elements[1].id, 'test-rect-1');
  assert.equal(getResult.data.elements[2].id, 'test-rect-2');
  
  console.log('✓ Element persistence works');
}

async function testElementAppend() {
  console.log('Testing element append...');
  const sessionId = `test-append-${Date.now()}`;
  
  // Start with 2 elements
  const initialElements = createTestElements(2);
  await post(`/api/session/${sessionId}/elements`, { elements: initialElements });
  
  // Append 1 more
  const appendElements = createTestElements(1).map(el => ({ ...el, id: 'test-rect-append' }));
  const appendResult = await post(`/api/session/${sessionId}/append`, { elements: appendElements });
  assert.equal(appendResult.status, 200);
  assert.equal(appendResult.data.elementCount, 3);
  
  // Verify all 3 elements exist
  const getResult = await get(`/api/session/${sessionId}`);
  assert.equal(getResult.data.elements.length, 3);
  assert(getResult.data.elements.some(el => el.id === 'test-rect-append'));
  
  console.log('✓ Element append works');
}

async function testSessionIsolation() {
  console.log('Testing session isolation...');
  const sessionA = `test-session-a-${Date.now()}`;
  const sessionB = `test-session-b-${Date.now()}`;
  
  // Push different elements to each session
  const elementsA = createTestElements(2).map(el => ({ ...el, id: el.id + '-A' }));
  const elementsB = createTestElements(3).map(el => ({ ...el, id: el.id + '-B' }));
  
  await post(`/api/session/${sessionA}/elements`, { elements: elementsA });
  await post(`/api/session/${sessionB}/elements`, { elements: elementsB });
  
  // Verify isolation
  const resultA = await get(`/api/session/${sessionA}`);
  const resultB = await get(`/api/session/${sessionB}`);
  
  assert.equal(resultA.data.elements.length, 2);
  assert.equal(resultB.data.elements.length, 3);
  assert(resultA.data.elements[0].id.endsWith('-A'));
  assert(resultB.data.elements[0].id.endsWith('-B'));
  
  console.log('✓ Session isolation works');
}

async function testElementUpdate() {
  console.log('Testing element update/replace...');
  const sessionId = `test-update-${Date.now()}`;
  
  // Create initial element
  const element = createTestElements(1)[0];
  element.id = 'updatable-rect';
  element.backgroundColor = '#ff0000';
  
  await post(`/api/session/${sessionId}/elements`, { elements: [element] });
  
  // Update the same element (same ID, different color)
  const updatedElement = { ...element, backgroundColor: '#00ff00', x: 200 };
  await post(`/api/session/${sessionId}/elements`, { elements: [updatedElement] });
  
  // Verify update
  const result = await get(`/api/session/${sessionId}`);
  assert.equal(result.data.elements.length, 1);
  assert.equal(result.data.elements[0].backgroundColor, '#00ff00');
  assert.equal(result.data.elements[0].x, 200);
  
  console.log('✓ Element update/replace works');
}

async function testWebSocketConnection() {
  console.log('Testing WebSocket connection...');
  const sessionId = `test-ws-${Date.now()}`;
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}/ws/${sessionId}`);
    let messageReceived = false;
    
    const timeout = setTimeout(() => {
      if (!messageReceived) {
        ws.close();
        reject(new Error('WebSocket test timed out'));
      }
    }, 5000);
    
    ws.on('open', async () => {
      // Push elements via HTTP API
      const elements = createTestElements(1);
      await post(`/api/session/${sessionId}/elements`, { elements });
    });
    
    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'elements' && msg.elements.length === 1) {
        clearTimeout(timeout);
        messageReceived = true;
        ws.close();
        console.log('✓ WebSocket connection and element push works');
        resolve();
      }
    });
    
    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function testClearSession() {
  console.log('Testing session clear...');
  const sessionId = `test-clear-${Date.now()}`;
  
  // Add elements
  const elements = createTestElements(3);
  await post(`/api/session/${sessionId}/elements`, { elements });
  
  // Verify they exist
  let result = await get(`/api/session/${sessionId}`);
  assert.equal(result.data.elements.length, 3);
  
  // Clear session
  const clearResult = await post(`/api/session/${sessionId}/clear`, {});
  assert.equal(clearResult.status, 200);
  assert.equal(clearResult.data.success, true);
  
  // Verify empty
  result = await get(`/api/session/${sessionId}`);
  assert.equal(result.data.elements.length, 0);
  
  console.log('✓ Session clear works');
}

async function testViewportUpdate() {
  console.log('Testing viewport update...');
  const sessionId = `test-viewport-${Date.now()}`;
  
  // Set viewport
  const viewport = { x: 100, y: 200, width: 1024, height: 768 };
  const result = await post(`/api/session/${sessionId}/viewport`, viewport);
  assert.equal(result.status, 200);
  assert.equal(result.data.success, true);
  
  // Verify viewport was saved
  const getResult = await get(`/api/session/${sessionId}`);
  assert.deepEqual(getResult.data.viewport, viewport);
  
  console.log('✓ Viewport update works');
}

async function testComplexDiagram() {
  console.log('Testing complex diagram creation...');
  const sessionId = `test-complex-${Date.now()}`;
  
  // Create boxes and arrows
  const boxes = createTestElements(3);
  const arrow1 = createTestArrow(boxes[0].id, boxes[1].id);
  const arrow2 = createTestArrow(boxes[1].id, boxes[2].id);
  
  const allElements = [...boxes, arrow1, arrow2];
  
  const result = await post(`/api/session/${sessionId}/elements`, { elements: allElements });
  assert.equal(result.status, 200);
  assert.equal(result.data.elementCount, 5);
  
  // Verify retrieval
  const getResult = await get(`/api/session/${sessionId}`);
  assert.equal(getResult.data.elements.length, 5);
  
  // Check that arrows have proper bindings
  const arrows = getResult.data.elements.filter(el => el.type === 'arrow');
  assert.equal(arrows.length, 2);
  assert(arrows[0].startBinding?.elementId);
  assert(arrows[0].endBinding?.elementId);
  
  console.log('✓ Complex diagram creation works');
}

// Test runner
async function runTests() {
  console.log('Starting Drawbridge API tests...\n');
  
  // Wait for server to be ready
  console.log('Waiting for server...');
  let retries = 10;
  while (retries > 0) {
    try {
      await get('/health');
      break;
    } catch {
      retries--;
      if (retries === 0) throw new Error('Server not ready after 10 attempts');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  try {
    await testHealthCheck();
    await testSessionList();
    await testElementPersistence();
    await testElementAppend();
    await testSessionIsolation();
    await testElementUpdate();
    await testWebSocketConnection();
    await testClearSession();
    await testViewportUpdate();
    await testComplexDiagram();
    
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();