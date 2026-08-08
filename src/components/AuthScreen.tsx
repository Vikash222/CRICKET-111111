import React, { useState } from 'react';
import { Mail, Lock, User, Trophy, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthScreenProps {
  onAuthenticated: () => Promise<void> | void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'signup') {
        if (fullName.trim().length < 2) throw new Error('Please enter your full name.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setMessage('Account created. Check your email to confirm your account, then log in.');
          setMode('login');
        } else {
          await onAuthenticated();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        await onAuthenticated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    setMessage('');

    try {
      const redirectTo = `${window.location.origin}/`;
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      if (googleError) throw googleError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070D19] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-lime-500 text-slate-950 flex items-center justify-center shadow-xl shadow-lime-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight">CollegeCricket<span className="text-lime-400">.live</span></h1>
          <p className="mt-2 text-sm text-slate-400">College cricket scoring, players & tournaments</p>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="grid grid-cols-2 bg-slate-900 rounded-xl p-1 mb-6">
            <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className={`py-2.5 rounded-lg text-sm font-bold ${mode === 'login' ? 'bg-lime-500 text-slate-950' : 'text-slate-400'}`}>Login</button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); setMessage(''); }} className={`py-2.5 rounded-lg text-sm font-bold ${mode === 'signup' ? 'bg-lime-500 text-slate-950' : 'text-slate-400'}`}>Create account</button>
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={googleLoading || loading}
            className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold flex items-center justify-center gap-3"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="font-black text-lg">G</span>}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500 font-semibold">OR EMAIL</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="text-xs font-bold text-slate-400">FULL NAME</span>
                <div className="mt-1.5 relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-3 outline-none focus:border-lime-500" placeholder="Your name" required />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-bold text-slate-400">EMAIL</span>
              <div className="mt-1.5 relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-3 outline-none focus:border-lime-500" placeholder="you@example.com" required />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-bold text-slate-400">PASSWORD</span>
              <div className="mt-1.5 relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-11 outline-none focus:border-lime-500" placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-3.5 text-slate-500"><>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</></button>
              </div>
            </label>

            {error && <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2.5 text-sm text-red-300">{error}</div>}
            {message && <div className="rounded-xl bg-lime-500/10 border border-lime-500/30 px-3 py-2.5 text-sm text-lime-300">{message}</div>}

            <button disabled={loading || googleLoading} className="w-full py-3 rounded-xl bg-lime-500 hover:bg-lime-400 disabled:opacity-60 text-slate-950 font-black flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Login' : 'Create Player Account'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">New accounts start as <span className="text-slate-300 font-semibold">Player</span>. Admins assign elevated roles.</p>
        </div>
      </div>
    </div>
  );
};
