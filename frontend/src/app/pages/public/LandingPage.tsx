import { useEffect } from "react";
import { Link } from "react-router";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Droplets,
  Fish,
  Gauge,
  Leaf,
  LogIn,
  ShieldCheck,
  Waves,
  Zap,
} from "lucide-react";
import { logGuestActivity } from "../../../lib/guestActivity";

const features = [
  {
    title: "Water Quality",
    description:
      "Explore available water sensor readings and understand important water conditions.",
    icon: Droplets,
    color: "bg-emerald-400/15 text-emerald-300",
  },
  {
    title: "Live Monitoring",
    description:
      "View current sensor readings and explore historical water quality trends.",
    icon: Activity,
    color: "bg-cyan-400/15 text-cyan-300",
  },
  {
    title: "Aquaponics Learning",
    description:
      "Discover educational resources about fish care, plant growth, and water systems.",
    icon: Leaf,
    color: "bg-lime-400/15 text-lime-300",
  },
  {
    title: "Water Circulation",
    description:
      "Learn how circulating water connects fish, beneficial bacteria, and plants.",
    icon: Waves,
    color: "bg-blue-400/15 text-blue-300",
  },
];

const benefits = [
  {
    number: "01",
    title: "Explore Sensor Readings",
    description:
      "View available monitoring data through a dedicated guest dashboard.",
    icon: Gauge,
  },
  {
    number: "02",
    title: "Understand Water Trends",
    description:
      "Explore historical readings and compare changes over selected time ranges.",
    icon: Activity,
  },
  {
    number: "03",
    title: "Learn Aquaponics",
    description:
      "Access educational materials about maintaining an integrated growing system.",
    icon: BookOpen,
  },
];

export default function LandingPage() {
  useEffect(() => {
    void logGuestActivity(
      "Viewed Home Page",
      "Guest opened the AQUANICS landing page.",
    );
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f7f5] text-slate-800">
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-emerald-950/10 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#123b2d] text-emerald-300 shadow-lg shadow-emerald-950/10">
              <Leaf size={25} />
            </div>

            <div className="min-w-0">
              <span className="block text-lg font-black tracking-wide text-[#123b2d] sm:text-xl">
                AQUANICS
              </span>
              <span className="block truncate text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-700 sm:text-xs sm:tracking-wider">
                Smart Aquaponics System
              </span>
            </div>
          </Link>

          <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              to="/guest/learning"
              className="hidden items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800 sm:inline-flex"
            >
              <BookOpen size={17} />
              Learning Center
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#123b2d] px-3.5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-900 sm:px-4"
            >
              <LogIn size={17} />
              Login
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-[#123b2d] text-white">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-[#123b2d] via-[#176449] to-[#0e3025]" />
          <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-96 w-96 rounded-full border-[50px] border-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-400/[0.08] blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:px-8 lg:py-24">
            {/* Hero text */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/20 bg-white/[0.08] px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-emerald-200 sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                Smart Aquaponics Monitoring
              </div>

              <h1 className="max-w-2xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                Grow smarter.
                <span className="mt-2 block text-emerald-300">
                  Monitor better.
                </span>
                <span className="mt-2 block">Grow sustainably.</span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-emerald-50/75 sm:text-base sm:leading-8 lg:text-lg">
                Welcome to AQUANICS, your window into aquaponics monitoring.
                Explore available water sensor readings, discover historical
                trends, and learn how fish and plants work together in a
                connected growing system.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/guest/dashboard"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-extrabold text-[#123b2d] shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-emerald-200"
                >
                  Explore Guest Dashboard
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/guest/learning"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.12]"
                >
                  <BookOpen size={18} />
                  Visit Learning Center
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-emerald-50/65">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-300" />
                  Public monitoring access
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck size={15} className="text-emerald-300" />
                  Read-only guest mode
                </span>
              </div>
            </div>

            {/* Overview panel */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-emerald-300/[0.06] blur-2xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.08] p-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-5">
                  <div>
                    <p className="text-base font-extrabold sm:text-lg">
                      Aquaponics Overview
                    </p>
                    <p className="mt-1 text-xs text-emerald-50/60 sm:text-sm">
                      Water · Fish · Plants
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-[10px] font-bold text-emerald-200 sm:text-xs">
                    <Activity size={14} />
                    Monitoring Portal
                  </div>
                </div>

                {/* Aquaponics illustration */}
                <div className="relative my-5 overflow-hidden rounded-2xl border border-white/10 bg-[#0d3025]/80 p-5 sm:p-7">
                  <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" />

                  <div className="relative grid grid-cols-3 items-center gap-2">
                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-300/10 text-cyan-200 sm:h-16 sm:w-16">
                        <Waves size={30} />
                      </div>
                      <span className="mt-3 text-xs font-bold sm:text-sm">
                        Water
                      </span>
                      <span className="mt-1 text-[10px] text-white/50">
                        Monitor
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-emerald-200">
                        <ArrowRight size={18} />
                      </div>
                    </div>

                    <div className="flex flex-col items-center text-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200/15 bg-emerald-300/10 text-emerald-200 sm:h-16 sm:w-16">
                        <Leaf size={30} />
                      </div>
                      <span className="mt-3 text-xs font-bold sm:text-sm">
                        Plants
                      </span>
                      <span className="mt-1 text-[10px] text-white/50">
                        Grow
                      </span>
                    </div>
                  </div>

                  <div className="my-5 flex items-center justify-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/70">
                      Connected ecosystem
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200">
                      <Fish size={23} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        Fish and beneficial bacteria
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/50">
                        Supporting the natural nutrient cycle
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature tiles */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Water Quality",
                      detail: "Sensor readings",
                      icon: Droplets,
                      color: "text-emerald-200 bg-emerald-300/10",
                    },
                    {
                      label: "Live Monitoring",
                      detail: "Available telemetry",
                      icon: Activity,
                      color: "text-cyan-200 bg-cyan-300/10",
                    },
                    {
                      label: "Learning Resources",
                      detail: "Guides and articles",
                      icon: BookOpen,
                      color: "text-lime-200 bg-lime-300/10",
                    },
                    {
                      label: "Smart Technology",
                      detail: "IoT-based system",
                      icon: Zap,
                      color: "text-amber-200 bg-amber-300/10",
                    },
                  ].map((feature) => {
                    const Icon = feature.icon;

                    return (
                      <div
                        key={feature.label}
                        className="rounded-2xl border border-white/10 bg-black/[0.12] p-3.5 transition hover:border-white/20 hover:bg-white/[0.06] sm:p-4"
                      >
                        <div
                          className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${feature.color}`}
                        >
                          <Icon size={19} />
                        </div>
                        <p className="text-xs font-extrabold sm:text-sm">
                          {feature.label}
                        </p>
                        <p className="mt-1 text-[10px] text-white/50 sm:text-xs">
                          {feature.detail}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-emerald-300"
                  />
                  <p className="text-xs leading-5 text-emerald-50/65">
                    Guests can explore available readings and educational
                    resources. Device controls and management tools require an
                    authorized account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              Discover AQUANICS
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Everything starts with understanding your system.
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
              Explore the information and educational resources available
              through the AQUANICS public portal.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/[0.05] sm:p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-100">
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-5 text-base font-extrabold text-slate-900">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>

                  <Link
                    to={
                      feature.title === "Aquaponics Learning"
                        ? "/guest/learning"
                        : "/guest/dashboard"
                    }
                    className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-emerald-800 transition group-hover:gap-3"
                  >
                    Explore
                    <ArrowRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        {/* How it helps */}
        <section className="border-y border-emerald-950/5 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-16">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                  <Leaf size={15} />
                  Learn and Explore
                </div>

                <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
                  A clearer view of your aquaponics system.
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
                  AQUANICS brings sensor information and learning materials
                  together to help visitors understand the role of water quality
                  in an integrated fish and plant growing system.
                </p>

                <Link
                  to="/guest/dashboard"
                  className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#123b2d] px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-900"
                >
                  Open Guest Dashboard
                  <ArrowRight size={17} />
                </Link>
              </div>

              <div className="space-y-4">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.number}
                      className="flex gap-4 rounded-2xl border border-slate-200/80 bg-[#f8faf9] p-5 transition hover:border-emerald-200 hover:bg-emerald-50/30 sm:gap-5 sm:p-6"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                        <Icon size={23} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black tracking-widest text-emerald-700">
                            {benefit.number}
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
                            {benefit.title}
                          </h3>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-gradient-to-br from-[#123b2d] via-[#176449] to-[#0e3025] p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-10 lg:p-14">
            <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border-[35px] border-white/[0.05]" />

            <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">
                  Start Exploring
                </p>

                <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
                  Curious about aquaponics?
                  <span className="block text-emerald-300">
                    Start with AQUANICS.
                  </span>
                </h2>

                <p className="mt-4 text-sm leading-7 text-emerald-50/70 sm:text-base">
                  Explore available monitoring data or visit the Learning
                  Center. No guest account is required to browse these pages.
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  to="/guest/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 py-3.5 text-sm font-extrabold text-[#123b2d] transition hover:bg-emerald-200"
                >
                  View Dashboard
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to="/guest/learning"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/[0.12]"
                >
                  <BookOpen size={17} />
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123b2d] text-emerald-300">
              <Leaf size={20} />
            </div>
            <div>
              <p className="text-sm font-black tracking-wide text-[#123b2d]">
                AQUANICS
              </p>
              <p className="text-[10px] text-slate-500">
                Smart Aquaponics Monitoring
              </p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            <Link
              to="/guest/dashboard"
              className="transition hover:text-emerald-800"
            >
              Guest Dashboard
            </Link>
            <Link
              to="/guest/learning"
              className="transition hover:text-emerald-800"
            >
              Learning Center
            </Link>
            <Link to="/login" className="transition hover:text-emerald-800">
              Login
            </Link>
          </div>

          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} AQUANICS Systems
          </p>
        </div>
      </footer>
    </div>
  );
}
