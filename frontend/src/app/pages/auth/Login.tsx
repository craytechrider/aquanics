import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import axios from "axios";
import logo from "../../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../lib/api";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const oauthCallbackHandled = useRef(false);

  const { login, completeGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (oauthCallbackHandled.current) return;

    const params = new URLSearchParams(location.search);
    const code = params.get("oauth_code");
    const oauthError = params.get("oauth_error");

    if (!code && !oauthError) return;

    oauthCallbackHandled.current = true;
    navigate("/login", { replace: true });

    if (oauthError) {
      const messages: Record<string, string> = {
        google_cancelled: "Google sign-in was cancelled.",
        google_email_missing: "Google did not provide an email address. Try another sign-in method.",
        google_unverified: "Your Google email must be verified before you can sign in.",
        google_account_not_found: "No AQUANICS account exists for this Google email. Please contact your administrator to get an account.",
        google_account_conflict: "This Google account is linked to a different AQUANICS account. Contact your administrator.",
        google_account_disabled: "This account is disabled. Contact your system administrator.",
        google_config: "Google sign-in is not configured yet. Please use email and password.",
        google_failed: "Google sign-in could not be completed. Please try again.",
      };
      setError(messages[oauthError] ?? messages.google_failed);
      return;
    }

    setGoogleLoading(true);
    completeGoogleLogin(code)
      .then((userData) => {
        navigate(userData.role === "Admin" ? "/admin/dashboard" : "/dashboard", {
          replace: true,
        });
      })
      .catch((err: unknown) => {
        setError(
          axios.isAxiosError(err) && err.response?.status === 422
            ? "Google sign-in expired or was already used. Please try again."
            : "Unable to complete Google sign-in. Check your connection and try again.",
        );
      })
      .finally(() => setGoogleLoading(false));
  }, [completeGoogleLogin, location.search, navigate]);

  const handleGoogleLogin = () => {
    setError("");
    setGoogleLoading(true);
    authApi.startGoogleLogin();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(email, password);

      navigate(userData?.role === "Admin" ? "/admin/dashboard" : "/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[88%] max-w-[340px] mx-auto">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft size={17} />
        Back to Home
      </Link>

      <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
      <div className="px-5 py-6 sm:px-6 sm:py-7">
        {/* Logo / Header */}
        <div className="text-center mb-7">
          <div className="inline-flex justify-center items-center p-2.5 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl mb-3 shadow-inner">
            <img src={logo} alt="Logo" className="h-11 w-11 object-contain" />
          </div>

          <h2 className="text-3xl font-heading font-bold text-gradient-gold tracking-tight italic">
            Welcome Back!
          </h2>

          <p className="text-white/70 mt-2 font-display font-medium tracking-widest uppercase text-[10px]">
            Aquanics System
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-2.5 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-white/90 ml-1">
              Email Address
            </label>

            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={18} />
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all font-medium text-white placeholder:text-white/50 text-sm"
                placeholder="farmer@gmail.com"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between ml-1">
              <label className="block text-xs sm:text-sm font-semibold text-white/90">
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs font-bold text-emerald-300 hover:text-emerald-200"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={18} />
              </div>

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-3 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all font-medium text-white placeholder:text-white/50 text-sm"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember */}
          <div className="flex items-center ml-1">
            <input
              id="remember"
              type="checkbox"
              className="h-4 w-4 rounded-md border-white/30 bg-white/10 text-emerald-500 focus:ring-emerald-500"
            />

            <label
              htmlFor="remember"
              className="ml-2.5 text-xs font-medium text-white/80"
            >
              Keep me logged in
            </label>
          </div>

          {/* Login */}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="block w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all text-center tracking-widest uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3" aria-hidden="true">
          <div className="h-px flex-1 bg-white/25" />
          <span className="text-[10px] font-semibold tracking-widest text-white/65">
            OR
          </span>
          <div className="h-px flex-1 bg-white/25" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleLoading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
          ) : (
            <svg aria-hidden="true" viewBox="0 0 48 48" className="h-5 w-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.62 5.91c4.45-4.11 7.15-10.16 7.15-17.56Z" />
              <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.62-5.91c-2.12 1.42-4.84 2.26-8.29 2.26-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
            </svg>
          )}
          {googleLoading ? "Connecting to Google..." : "Continue with Google"}
        </button>

        {/* Register
        <div className="mt-6 text-center">
          <p className="text-xs font-medium text-white/70">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-emerald-300 hover:text-emerald-200 hover:underline"
            >
              Register now
            </Link>
          </p>
        </div> */}
      </div>
      </div>
    </div>
  );
}
