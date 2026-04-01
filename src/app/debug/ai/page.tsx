'use client';
import { useState } from 'react';

interface AiTest {
  tier: string;
  status: 'untested' | 'running' | 'ok' | 'error';
  response: string;
  tokens: { input: number; output: number } | null;
  cost: number | null;
  elapsed: number | null;
  model: string | null;
}

const TIERS = [
  { tier: 'fast', label: 'Fast (GPT-3.5-turbo)', desc: 'OpenRouter - $0.50/$1.50 per 1M tokens' },
  { tier: 'balanced', label: 'Balanced (Claude Haiku)', desc: 'OpenRouter - $0.80/$4.00 per 1M tokens' },
  { tier: 'premium', label: 'Premium (Claude Sonnet)', desc: 'Anthropic - $3.00/$15.00 per 1M tokens' },
];

export default function DebugAi() {
  const [tests, setTests] = useState<AiTest[]>(
    TIERS.map(t => ({ tier: t.tier, status: 'untested', response: '', tokens: null, cost: null, elapsed: null, model: null }))
  );
  const [customPrompt, setCustomPrompt] = useState('Write a single sentence about CIPHER platform.');

  const testTier = async (tierIndex: number) => {
    const tier = TIERS[tierIndex].tier;
    const start = performance.now();

    setTests(prev => {
      const next = [...prev];
      next[tierIndex] = { ...next[tierIndex], status: 'running', response: '' };
      return next;
    });

    try {
      const resp = await fetch('/api/ai/ghostwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: customPrompt, tier }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        setTests(prev => {
          const next = [...prev];
          next[tierIndex] = { ...next[tierIndex], status: 'error', response: `HTTP ${resp.status}: ${errText}`, elapsed: Math.round(performance.now() - start) };
          return next;
        });
        return;
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullResponse += parsed.delta.text;
                }
              } catch {}
            }
          }
        }
      }

      const elapsed = Math.round(performance.now() - start);
      setTests(prev => {
        const next = [...prev];
        next[tierIndex] = {
          ...next[tierIndex],
          status: 'ok',
          response: fullResponse || '(empty response)',
          elapsed,
          model: resp.headers.get('x-model') || tier,
        };
        return next;
      });
    } catch (e: any) {
      setTests(prev => {
        const next = [...prev];
        next[tierIndex] = { ...next[tierIndex], status: 'error', response: e.message, elapsed: Math.round(performance.now() - start) };
        return next;
      });
    }
  };

  const testAllTiers = async () => {
    for (let i = 0; i < TIERS.length; i++) {
      await testTier(i);
      await new Promise(r => setTimeout(r, 1000));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#020203', color: 'rgba(255,255,255,0.92)', padding: '48px 24px', fontFamily: 'var(--font-body, Outfit), sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <a href="/debug" style={{ fontSize: 12, color: 'rgba(200,169,110,0.6)', textDecoration: 'none', fontFamily: 'var(--font-mono, DM Mono), monospace' }}>&larr; Back to Debug</a>
        <h1 style={{ fontSize: 32, fontWeight: 300, fontFamily: 'var(--font-display, Cormorant), serif', color: '#c8a96e', marginTop: 16, marginBottom: 8 }}>AI Router Debug</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono, DM Mono), monospace', marginBottom: 32 }}>
          Test Anthropic/OpenRouter tiers, streaming, and cost estimation
        </p>

        {/* Prompt input */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono, DM Mono), monospace', display: 'block', marginBottom: 8 }}>Test Prompt</label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            rows={3}
            style={{
              width: '100%', padding: '12px 16px', background: '#0d0d18', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, color: 'rgba(255,255,255,0.9)', fontSize: 13, fontFamily: 'var(--font-mono, DM Mono), monospace',
              resize: 'vertical', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button onClick={testAllTiers} style={{ padding: '10px 20px', background: 'rgba(200,169,110,0.15)', border: '1px solid rgba(200,169,110,0.3)', borderRadius: 6, color: '#c8a96e', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-mono, DM Mono), monospace' }}>
            Test All Tiers
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TIERS.map((tierDef, i) => {
            const test = tests[i];
            return (
              <div key={tierDef.tier} style={{
                padding: '20px', background: '#0d0d18',
                border: `1px solid ${test.status === 'ok' ? 'rgba(34,197,94,0.2)' : test.status === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.055)'}`,
                borderRadius: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>{tierDef.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono, DM Mono), monospace' }}>{tierDef.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {test.elapsed !== null && (
                      <span style={{ fontSize: 11, color: 'rgba(200,169,110,0.5)', fontFamily: 'var(--font-mono, DM Mono), monospace' }}>{test.elapsed}ms</span>
                    )}
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: test.status === 'ok' ? '#22c55e' : test.status === 'error' ? '#ef4444' : test.status === 'running' ? '#eab308' : 'rgba(255,255,255,0.2)',
                      boxShadow: test.status === 'running' ? '0 0 6px rgba(234,179,8,0.5)' : 'none',
                    }} />
                    <button onClick={() => testTier(i)} style={{
                      padding: '4px 12px', background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
                      borderRadius: 4, color: '#c8a96e', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono, DM Mono), monospace',
                    }}>
                      Test
                    </button>
                  </div>
                </div>
                {test.response && (
                  <div style={{
                    padding: '12px 16px', background: test.status === 'error' ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)', borderRadius: 6,
                    fontSize: 12, color: test.status === 'error' ? '#ef4444' : 'rgba(255,255,255,0.7)',
                    fontFamily: 'var(--font-mono, DM Mono), monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                  }}>
                    {test.response}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
