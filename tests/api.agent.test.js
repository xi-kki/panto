import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Tests for the /api/agent Vercel function.
 * Covers: method/body validation, demo-mode streaming, LLM-failure fallback,
 * and SSE passthrough with the (previously buggy) data: parsing.
 */

function mockRes() {
  return {
    statusCode: null,
    headers: {},
    body: '',
    ended: false,
    status(c) {
      this.statusCode = c
      return this
    },
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v
      return this
    },
    write(s) {
      this.body += s
      return true
    },
    end() {
      this.ended = true
    },
    json(o) {
      this.body = JSON.stringify(o)
      this.ended = true
      return this
    },
  }
}

function mockReq({ method = 'POST', body } = {}) {
  return { method, body }
}

function sseResponse(frames) {
  const enc = new TextEncoder()
  return {
    ok: true,
    body: new ReadableStream({
      start(ctrl) {
        for (const f of frames) ctrl.enqueue(enc.encode(f))
        ctrl.close()
      },
    }),
  }
}

async function importFresh(env = {}) {
  vi.resetModules()
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v)
  return import('../api/agent.js')
}

beforeEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('GET /api/agent', () => {
  it('returns 405 for non-POST', async () => {
    const { default: handler } = await importFresh({})
    const res = mockRes()
    await handler(mockReq({ method: 'GET' }), res)
    expect(res.statusCode).toBe(405)
  })
})

describe('body validation', () => {
  it('returns 400 for invalid JSON', async () => {
    const { default: handler } = await importFresh({})
    const res = mockRes()
    await handler(mockReq({ body: 'not-json{{' }), res)
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for empty message', async () => {
    const { default: handler } = await importFresh({})
    const res = mockRes()
    await handler(mockReq({ body: { message: '   ' } }), res)
    expect(res.statusCode).toBe(400)
  })
})

describe('demo mode (no LLM key)', () => {
  it('streams simulated reply as SSE data chunks and ends', async () => {
    const { default: handler } = await importFresh({}) // no keys → demo
    const res = mockRes()
    await handler(mockReq({ body: { message: 'I need seeds', role: 'buying' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.ended).toBe(true)
    expect(res.headers['content-type']).toContain('text/event-stream')

    const lines = res.body.split('\n').filter((l) => l.startsWith('data: '))
    expect(lines.length).toBeGreaterThan(3)
    // Reassemble the JSON-encoded chunks → should contain the demo text
    const text = lines
      .map((l) => { try { return JSON.parse(l.slice(6)) } catch { return '' } })
      .join('')
    expect(text).toContain('Opening the door')
    expect(text).toContain('Demo mode')
  })
})

describe('live mode', () => {
  it('falls back to simulated reply when LLM returns an error status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, text: () => Promise.resolve('boom') })
    vi.stubGlobal('fetch', fetchMock)
    const { default: handler } = await importFresh({ GROQ_API_KEY: 'test-key' })

    const res = mockRes()
    await handler(mockReq({ body: { message: 'hello', role: 'buying' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('Opening the door')
    // The attempted model + error should be exposed for debugging
    expect(res.headers['x-panto-debug']).toContain('no-upstream')
  })

  it('streams LLM deltas through, parsing each data: frame exactly once', async () => {
    // Two content frames + [DONE]. Regression test for the double-strip bug:
    // payloads must arrive intact as "Hello" / " world", not mangled JSON.
    const frames = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n\n',
    ]
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(frames))
    vi.stubGlobal('fetch', fetchMock)
    const { default: handler } = await importFresh({ GROQ_API_KEY: 'test-key' })

    const res = mockRes()
    await handler(mockReq({ body: { message: 'hi', role: 'buying' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toContain('data: "Hello"')
    expect(res.body).toContain('data: " world"')
    expect(res.body).not.toContain('{\\"choices') // no mangled frames
    expect(res.headers['content-type']).toContain('text/event-stream')
  })

  it('sends reasoning_effort low for gpt-oss models and includes history', async () => {
    const frames = ['data: {"choices":[{"delta":{"content":"ok"}}]}\n\n', 'data: [DONE]\n\n']
    const fetchMock = vi.fn().mockResolvedValue(sseResponse(frames))
    vi.stubGlobal('fetch', fetchMock)
    const { default: handler } = await importFresh({ GROQ_API_KEY: 'test-key' })

    const res = mockRes()
    await handler(
      mockReq({
        body: {
          message: 'find suppliers',
          role: 'selling',
          history: [
            { role: 'user', content: 'first' },
            { role: 'assistant', content: 'second' },
          ],
        },
      }),
      res
    )

    expect(res.body).toContain('data: "ok"')
    // Find the LLM request among all fetch calls (robust to ordering)
    const bodies = fetchMock.mock.calls.map((c) => c[1]?.body).filter(Boolean)
    expect(bodies.length).toBeGreaterThan(0)
    const sent = JSON.parse(bodies[bodies.length - 1])
    expect(sent.model).toBe('openai/gpt-oss-120b')
    expect(sent.reasoning_effort).toBe('low')
    // system + 2 history + 1 user
    expect(sent.messages).toHaveLength(4)
    expect(sent.messages[1].content).toBe('first')
    expect(sent.stream).toBe(true)
  })
})
