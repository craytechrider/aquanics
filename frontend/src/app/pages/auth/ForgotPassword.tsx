import { FormEvent, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { ArrowLeft, Mail } from "lucide-react";
import logo from "../../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { authApi } from "../../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authApi.requestPasswordReset(email);
      setSubmitted(true);
    } catch (requestError: unknown) {
      const message =
        axios.isAxiosError(requestError) &&
        typeof requestError.response?.data?.message === "string"
          ? requestError.response.data.message
          : "Unable to send a reset link right now. Please try again later.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-[90%] max-w-[380px]">
      <Link
        to="/login"
        className="mb-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        <ArrowLeft size={17} />
        Back to Login
      </Link>

      <section className="overflow-hidden rounded-3xl border border-white/20 bg-white/15 shadow-2xl backdrop-blur-md">
        <div className="px-5 py-7 sm:px-7">
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 p-2.5 shadow-inner">
              <img src={logo} alt="Aquanics logo" className="h-11 w-11 object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Forgot Your Password?
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Enter your registered email address and we&apos;ll send you a link
              to reset your password.
            </p>
          </div>

          {submitted ? (
            <div
              role="status"
              className="rounded-xl border border-emerald-300/30 bg-emerald-500/15 p-4 text-sm leading-6 text-emerald-50"
            >
              If an account exists with this email address, a password reset
              link has been sent. Please check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-400/30 bg-red-500/20 p-3 text-center text-sm text-red-100"
                >
                  {error}
                </p>
              )}
              <div className="space-y-1.5">
                <label
                  htmlFor="reset-email"
                  className="ml-1 block text-sm font-semibold text-white/90"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    id="reset-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-white/50 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="farmer@example.com"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
