import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Lock, Mail, User } from "lucide-react";
import logo from "../../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { useAuth } from "../../contexts/AuthContext";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
      });

      navigate("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Registration failed. Please try again.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[90%] max-w-[350px] mx-auto bg-white/15 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
      <div className="px-4 py-5 sm:px-6 sm:py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center items-center p-2.5 bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-2xl mb-3 shadow-inner">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-gradient-gold tracking-tight italic">
            Create Account
          </h2>

          <p className="text-white/70 mt-2 font-display font-medium tracking-widest uppercase text-[9px] sm:text-[10px]">
            Join the smart farming revolution
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-2.5 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* FIRST + LAST NAME — ALWAYS 2 COLUMNS */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* First Name */}
            <div className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-bold text-white/90 ml-1">
                First Name
              </label>

              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={16} />
                </div>

                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full pl-8 pr-2 py-2.5 bg-white/10 border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium text-white placeholder:text-white/50 text-xs"
                />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-bold text-white/90 ml-1">
                Last Name
              </label>

              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full px-2.5 py-2.5 bg-white/10 border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium text-white placeholder:text-white/50 text-xs"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-[11px] sm:text-xs font-bold text-white/90 ml-1">
              Email Address
            </label>

            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Mail size={16} />
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-8 pr-2.5 py-2.5 bg-white/10 border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium text-white placeholder:text-white/50 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-[11px] sm:text-xs font-bold text-white/90 ml-1">
              Password
            </label>

            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock size={16} />
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-8 pr-2.5 py-2.5 bg-white/10 border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium text-white placeholder:text-white/50 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Create Account */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="block w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all text-center tracking-widest uppercase text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </div>
        </form>

        {/* Login */}
        <div className="mt-5 text-center">
          <p className="text-xs font-medium text-white/70">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-emerald-300 hover:text-emerald-200 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
