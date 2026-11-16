import { FormEvent, useState } from "react";
import { Link, useLocation } from "react-router";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import logo from "../../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import { authApi } from "../../lib/api";

export default function ResetPassword() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token") ?? "";
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState(
    token ? "" : "This password reset link is invalid or has expired.",
  );
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Your password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmation) {
      setError("The password confirmation does not match.");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({
        email,
        token,
        password,
        password_confirmation: confirmation,
      });
      setSuccess(true);
    } catch (requestError: unknown) {
      const responseMessage =
        axios.isAxiosError(requestError) &&
        typeof requestError.response?.data?.message === "string"
          ? requestError.response.data.message
          : "";
      const validationErrors =
        axios.isAxiosError(requestError) &&
        requestError.response?.data?.errors &&
        typeof requestError.response.data.errors === "object"
          ? Object.values(
              requestError.response.data.errors as Record<string, string[]>,
            )
              .flat()
              .join(" ")
          : "";
      setError(
        validationErrors ||
          responseMessage ||
          "Unable to reset your password. Please request a new reset link.",
      );
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
              Reset Your Password
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Choose a new password for your Aquanics account.
            </p>
          </div>

          {success ? (
            <div className="space-y-4 text-center">
              <p role="status" className="rounded-xl bg-emerald-500/15 p-4 text-sm leading-6 text-emerald-50">
                Your password has been changed. You can now sign in with your
                new password.
              </p>
              <Link
                to="/login"
                className="block w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3.5 text-center text-sm font-bold uppercase tracking-widest text-white transition hover:shadow-lg"
              >
                Return to Login
              </Link>
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
              {token && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="reset-email" className="ml-1 block text-sm font-semibold text-white/90">
                      Email Address
                    </label>
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm font-medium text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <PasswordInput
                    id="new-password"
                    label="New Password"
                    value={password}
                    onChange={setPassword}
                    visible={showPassword}
                    onToggle={() => setShowPassword((visible) => !visible)}
                  />
                  <PasswordInput
                    id="confirm-password"
                    label="Confirm New Password"
                    value={confirmation}
                    onChange={setConfirmation}
                    visible={showConfirmation}
                    onToggle={() => setShowConfirmation((visible) => !visible)}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3.5 text-sm font-bold uppercase tracking-widest text-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="ml-1 block text-sm font-semibold text-white/90">
        {label}
      </label>
      <div className="relative">
        <Lock
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          minLength={8}
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-10 pr-11 text-sm font-medium text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
