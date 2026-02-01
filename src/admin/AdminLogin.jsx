import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Mail, Lock, Loader2, AlertCircle, ArrowLeft, Play } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Check if Supabase is configured
const isSupabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        navigate('/admin');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Navigate to admin - it will auto-enable demo mode
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-bone flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to website */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-charcoal/60 hover:text-charcoal font-inter text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to website
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sage/10 mb-4">
              <Leaf className="w-8 h-8 text-sage" />
            </div>
            <h1 className="font-playfair text-2xl font-semibold text-charcoal mb-2">
              Admin Portal
            </h1>
            <p className="text-charcoal/60 font-inter text-sm">
              Sign in to manage Willow & Water
            </p>
          </div>

          {/* Demo Mode Banner - shown when Supabase not configured */}
          {!isSupabaseConfigured && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm font-inter text-yellow-800 font-medium mb-2">
                Supabase not configured
              </p>
              <p className="text-xs text-yellow-700 mb-3">
                You can explore the admin portal in demo mode, or connect Supabase for full functionality.
              </p>
              <button
                onClick={handleDemoMode}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 
                           hover:bg-yellow-600 text-white rounded-lg font-inter text-sm font-medium transition-colors"
              >
                <Play className="w-4 h-4" />
                Enter Demo Mode
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label 
                htmlFor="email" 
                className="block font-inter text-sm font-medium text-charcoal mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required={isSupabaseConfigured}
                  placeholder="admin@willowandwater.com"
                  className="w-full px-4 py-3 pl-11 bg-bone/50 border border-charcoal/10 rounded-xl
                             font-inter text-charcoal placeholder:text-charcoal/40
                             focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                             transition-shadow"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block font-inter text-sm font-medium text-charcoal mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={isSupabaseConfigured}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-11 bg-bone/50 border border-charcoal/10 rounded-xl
                             font-inter text-charcoal placeholder:text-charcoal/40
                             focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent
                             transition-shadow"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-inter">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !isSupabaseConfigured}
              className="btn-primary w-full flex items-center justify-center gap-2
                         disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Help text */}
          <p className="mt-6 text-center text-xs text-charcoal/50 font-inter">
            {isSupabaseConfigured 
              ? 'Need admin access? Contact the system administrator.'
              : 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
