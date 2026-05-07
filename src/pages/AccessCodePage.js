import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAccessCode } from '../utils/api';
import { saveTeamSession } from '../utils/session';

export default function AccessCodePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      const team = await verifyAccessCode(code);
      saveTeamSession(team);
      navigate('/catalog');
    } catch {
      setError("That access code doesn't match any team. Please check with your coach.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F5F7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-height: 100vh; }
        .access-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: linear-gradient(160deg, #f0f4ff 0%, #F5F5F7 60%); }
        .access-card { background: #fff; border-radius: 24px; box-shadow: 0 2px 40px rgba(0,0,0,0.09); padding: 52px 48px 48px; width: 100%; max-width: 420px; text-align: center; }
        .access-logo { width: 56px; height: 56px; background: #1a1a2e; border-radius: 16px; display: flex; align-items: center; justify-content: center; margin: 0 auto 28px; }
        .access-logo svg { width: 30px; height: 30px; }
        .access-title { font-size: 26px; font-weight: 700; color: #1a1a2e; letter-spacing: -0.5px; margin-bottom: 8px; }
        .access-subtitle { font-size: 15px; color: #6e6e73; margin-bottom: 36px; line-height: 1.5; }
        .access-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #6e6e73; text-align: left; margin-bottom: 8px; }
        .access-input { width: 100%; padding: 14px 18px; border-radius: 12px; border: 1.5px solid #e0e0e5; font-size: 22px; font-weight: 700; letter-spacing: 0.15em; text-align: center; color: #1a1a2e; background: #fafafa; outline: none; transition: border-color 0.15s; font-family: inherit; text-transform: uppercase; }
        .access-input:focus { border-color: #1a1a2e; background: #fff; }
        .access-input::placeholder { color: #c0c0c8; letter-spacing: 0.05em; font-weight: 400; }
        .access-error { margin-top: 12px; font-size: 13px; color: #c0392b; text-align: left; min-height: 18px; }
        .access-btn { margin-top: 24px; width: 100%; padding: 15px; border-radius: 12px; border: none; background: #1a1a2e; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity 0.15s, transform 0.1s; font-family: inherit; }
        .access-btn:hover:not(:disabled) { opacity: 0.88; }
        .access-btn:active:not(:disabled) { transform: scale(0.98); }
        .access-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .access-hint { margin-top: 28px; font-size: 13px; color: #aeaeb2; line-height: 1.5; }
        @media (max-width: 480px) { .access-card { padding: 40px 28px 36px; } .access-title { font-size: 22px; } }
      `}</style>
      <div className="access-root">
        <div className="access-card">
          <div className="access-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19 C4 19 8 13 12 13 C16 13 20 19 20 19" />
              <path d="M2 17 L22 17" />
              <circle cx="12" cy="8" r="3" />
            </svg>
          </div>
          <h1 className="access-title">Team Store</h1>
          <p className="access-subtitle">Enter your team's access code to browse and order sticks.</p>
          <form onSubmit={handleSubmit}>
            <label className="access-label">Access Code</label>
            <input
              className="access-input"
              type="text"
              placeholder="TEAM-CODE"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              maxLength={32}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
            />
            {error && <div className="access-error">{error}</div>}
            <button className="access-btn" type="submit" disabled={loading || !code.trim()}>
              {loading ? 'Checking…' : 'Enter Store →'}
            </button>
          </form>
          <p className="access-hint">Don't have a code? Contact your coach or team manager.</p>
        </div>
      </div>
    </>
  );
}
