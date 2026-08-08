import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, X, Radio } from 'lucide-react';

interface PublicMatchLinkModalProps {
  matchId?: string;
  onClose: () => void;
}

export const PublicMatchLinkModal: React.FC<PublicMatchLinkModalProps> = ({
  matchId = 'match-live-1',
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const matchUrl = `${window.location.origin}/match/${matchId}`;

  const handleCopy = async () => {
    setError('');
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(matchUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = matchUrl;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        const success = document.execCommand('copy');
        document.body.removeChild(input);
        if (!success) throw new Error('Copy failed');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy failed. Please select the link and copy it manually.');
    }
  };

  const handleNativeShare = async () => {
    setError('');
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: 'Live College Cricket Match',
        text: 'Watch the live score, ball-by-ball commentary and match stats.',
        url: matchUrl,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      await handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0F172A] border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <h3 className="font-bold text-base text-white">Share Live Match Score</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Anyone with this public link can view live ball-by-ball commentary, real-time scorecards, and match stats without creating an account.
        </p>

        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/80 p-2.5 rounded-xl">
          <input
            type="text"
            readOnly
            value={matchUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="bg-transparent text-xs text-slate-200 flex-1 outline-none font-mono truncate"
            aria-label="Public match URL"
          />
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
              copied ? 'bg-lime-500 text-slate-900' : 'bg-lime-500 hover:bg-lime-400 text-slate-900'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleNativeShare}
          className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share Live Match
        </button>

        <button
          type="button"
          onClick={() => window.open(matchUrl, '_blank', 'noopener,noreferrer')}
          className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs font-semibold flex items-center justify-center gap-2"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Public Match
        </button>

        {error && <p className="text-xs text-red-300 text-center">{error}</p>}

        <div className="bg-lime-500/10 border border-lime-500/20 p-3 rounded-xl text-center">
          <p className="text-[11px] text-lime-400 font-semibold">
            ⚡ Low-latency Supabase Realtime synchronization enabled.
          </p>
        </div>
      </div>
    </div>
  );
};
