import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  Check,
  Cpu,
  Droplets,
  Fish,
  Gauge,
  Leaf,
  Menu,
  Shield,
  Thermometer,
  Waves,
  X,
} from "lucide-react";
import logo from "../../../assets/bf2f001026d6edc1e3beec70ce5240dc1734a24f.png";
import aquaponicsIllustration from "../../../assets/236227259a39f8fc98372b0db000196c5ed358d0.png";
import { logGuestActivity } from "../../../lib/guestActivity";

const navigation = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

const features = [
  {
    title: "Real-Time Monitoring",
    description:
      "See the latest available readings from the connected aquaponics system.",
    icon: Activity,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Water Measurements",
    description:
      "Review configured measurements such as pH, dissolved oxygen, temperature, ammonia, and water level.",
    icon: Droplets,
    tone: "bg-cyan-50 text-cyan-700",
  },
  {
    title: "Intelligent Alerts",
    description:
      "Review alerts raised when readings cross the system's configured sensor limits.",
    icon: BellRing,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Device Management",
    description:
      "Authorized users can view and operate the devices connected to their system.",
    icon: Cpu,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Trends and History",
    description:
      "Explore available historical readings and charts to understand changes over time.",
    icon: Gauge,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    title: "Role-Based Access",
    description:
      "Admin and Farmer accounts see the system tools and information permitted for their role.",
    icon: Shield,
    tone: "bg-teal-50 text-teal-700",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect",
    description:
      "The deployed IoT device collects the water measurements supported by its connected sensors.",
    icon: Cpu,
  },
  {
    number: "02",
    title: "Transmit",
    description:
      "Available readings are sent to the AQUANICS platform through its connected data services.",
    icon: Waves,
  },
  {
    number: "03",
    title: "Monitor",
    description:
      "Farmers and administrators review current measurements, status, and historical information.",
    icon: Gauge,
  },
  {
    number: "04",
    title: "Respond",
    description:
      "Users review system alerts and take appropriate action for their aquaponics setup.",
    icon: BellRing,
  },
];

const accessRoles = [
  {
    title: "Admin",
    description: "Full administrative access to manage the platform.",
    icon: Shield,
    tone: "bg-slate-900 text-emerald-300",
    permissions: [
      "Manage user accounts",
      "Manage system devices and sensors",
      "Review alerts and activity logs",
      "Configure available system settings",
    ],
  },
  {
    title: "Farmer",
    description: "A focused workspace for day-to-day aquaponics management.",
    icon: Leaf,
    tone: "bg-emerald-700 text-white",
    permissions: [
      "Access the Farmer dashboard",
      "View available monitoring information",
      "Review relevant alerts and system details",
      "Use the tools enabled for the account",
    ],
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    root.style.scrollBehavior = prefersReducedMotion ? "auto" : "smooth";
    void logGuestActivity(
      "Viewed Home Page",
      "Guest opened the AQUANICS landing page.",
    );

    return () => {
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm shadow-slate-900/[0.03] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="AQUANICS home"
            className="flex min-w-0 items-center gap-2.5"
            onClick={closeMobileMenu}
          >
            <img
              src={logo}
              alt=""
              className="h-11 w-11 shrink-0 rounded-xl object-contain"
            />
            <span className="min-w-0">
              <span className="block font-display text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                AQUANICS
              </span>
              <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.13em] text-emerald-700 sm:text-[10px]">
                Smart Aquaponics
              </span>
            </span>
          </Link>

          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-1 lg:flex"
          >
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/guest/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Explore
              <ArrowUpRight size={15} />
            </Link>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
            >
              Sign In
              <ArrowRight size={16} />
            </Link>
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-controls="mobile-navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="animate-in fade-in slide-in-from-top-2 border-t border-slate-100 bg-white px-4 pb-4 pt-2 shadow-lg shadow-slate-900/5 lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <Link
                  to="/guest/dashboard"
                  onClick={closeMobileMenu}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Explore
                  <ArrowUpRight size={15} />
                </Link>
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Sign In
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main>
        <section
          id="home"
          className="relative isolate scroll-mt-24 overflow-hidden border-b border-emerald-950/5 bg-white"
        >
          <div className="pointer-events-none absolute -left-40 top-12 -z-10 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -right-36 bottom-0 -z-10 h-96 w-96 rounded-full bg-cyan-50 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-8 lg:py-24">
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-800 sm:text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                IoT Aquaponics Monitoring
              </div>

              <h1 className="max-w-2xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Smarter Aquaponics.
                <span className="mt-2 block text-emerald-700">
                  Healthier Ecosystems.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
                Monitor your aquaponics system with connected IoT technology.
                Explore available water measurements, review alerts, and manage
                your system through one integrated platform.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/25"
                >
                  Sign In to AQUANICS
                  <ArrowRight size={17} />
                </Link>
                <a
                  href="#features"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800"
                >
                  Explore Features
                  <ArrowDown size={16} />
                </a>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-medium text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Check size={15} className="text-emerald-700" />
                  Public read-only monitoring
                </span>
                <span className="inline-flex items-center gap-2">
                  <Shield size={15} className="text-emerald-700" />
                  Secure role-based access
                </span>
              </div>
            </div>

            <div className="relative animate-in fade-in zoom-in-95 duration-700 motion-safe:delay-150">
              <div className="absolute -inset-3 rounded-[2rem] bg-emerald-100/60 blur-2xl" />
              <figure className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 shadow-xl shadow-slate-900/10 sm:rounded-[1.75rem] sm:p-3">
                <img
                  src={aquaponicsIllustration}
                  alt="Illustration of plants growing above a fish-filled aquaponics water system"
                  className="aspect-[1.35/1] w-full rounded-xl object-cover sm:rounded-[1.25rem]"
                />
                <figcaption className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3 rounded-xl border border-white/60 bg-white/95 p-3 shadow-lg backdrop-blur sm:bottom-7 sm:left-7 sm:right-7 sm:p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <Waves size={21} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-slate-900 sm:text-sm">
                        A connected growing system
                      </span>
                      <span className="mt-1 block truncate text-[10px] text-slate-500 sm:text-xs">
                        Water · Plants · Fish
                      </span>
                    </span>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-800 sm:inline-flex">
                    <Activity size={13} />
                    AQUANICS
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="scroll-mt-24 border-b border-slate-200/70 bg-slate-50"
        >
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8">
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                About AQUANICS
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                A clearer view of your aquaponics system.
              </h2>
              <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
                AQUANICS is an IoT-based aquaponics monitoring platform. It
                brings connected sensor information, system alerts, and
                educational resources into one place to help people understand
                and manage an integrated fish-and-plant growing system.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                The platform presents the measurements available from the
                deployed setup. What appears depends on connected sensors and
                incoming system data.
              </p>
              <Link
                to="/guest/learning"
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-800"
              >
                Visit the Learning Center
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  title: "Water",
                  text: "Measurements help describe changing system conditions.",
                  icon: Droplets,
                  iconClass: "bg-cyan-50 text-cyan-700",
                },
                {
                  title: "Plants",
                  text: "Plant growth is part of the shared aquaponics cycle.",
                  icon: Leaf,
                  iconClass: "bg-emerald-50 text-emerald-700",
                },
                {
                  title: "Fish",
                  text: "Fish and beneficial bacteria support the nutrient cycle.",
                  icon: Fish,
                  iconClass: "bg-amber-50 text-amber-700",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                  >
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClass}`}
                    >
                      <Icon size={22} />
                    </span>
                    <h3 className="mt-5 font-display text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                      {item.text}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-24 bg-white"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Platform Features
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                The tools to stay informed.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                AQUANICS combines available monitoring data with practical
                system tools for authorized users.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <article
                    key={feature.title}
                    className="group animate-in fade-in slide-in-from-bottom-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-900/[0.06] sm:p-6"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-105 ${feature.tone}`}
                    >
                      <Icon size={23} />
                    </span>
                    <h3 className="mt-5 font-display text-base font-semibold text-slate-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {feature.description}
                    </p>
                    <Link
                      to="/guest/dashboard"
                      className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 transition group-hover:gap-3"
                    >
                      Explore public monitoring
                      <ArrowRight size={15} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-24 border-y border-slate-200 bg-slate-50"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                How It Works
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                From sensor reading to informed action.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                A straightforward view of the data path and the tools available
                in the AQUANICS platform.
              </p>
            </div>

            <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.number}
                    className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tracking-widest text-emerald-700">
                        {step.number}
                      </span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <Icon size={21} />
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {step.description}
                    </p>
                    {index < steps.length - 1 && (
                      <ArrowRight
                        aria-hidden="true"
                        size={18}
                        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-emerald-600 lg:block"
                      />
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-14 lg:px-8">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 shadow-lg shadow-slate-900/[0.06] sm:rounded-[1.75rem] sm:p-3">
              <img
                src={aquaponicsIllustration}
                alt="Aquaponics illustration showing leafy plants growing above a fish tank"
                loading="lazy"
                className="aspect-[1.65/1] w-full rounded-xl object-cover sm:rounded-[1.25rem]"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Explore the Platform
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Take a closer look at AQUANICS.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                Open the public dashboard to view the readings currently
                available to guests, or visit the Learning Center for
                aquaponics resources. Account holders can sign in to access the
                dashboard and management tools for their role.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/guest/dashboard"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  Open Guest Dashboard
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/guest/learning"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50/60 hover:text-emerald-800"
                >
                  <BookOpen size={16} />
                  Learning Center
                </Link>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                The image is an aquaponics illustration, not a screenshot of
                live dashboard data.
              </p>
            </div>
          </div>
        </section>

        <section
          id="account-access"
          className="border-y border-slate-200 bg-slate-50"
        >
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                Account Access
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                The right tools for each role.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                Sign in to open the AQUANICS workspace associated with your
                account.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
              {accessRoles.map((role) => {
                const Icon = role.icon;
                return (
                  <article
                    key={role.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${role.tone}`}
                      >
                        <Icon size={22} />
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold text-slate-900">
                          {role.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {role.description}
                        </p>
                      </div>
                    </div>
                    <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                      {role.permissions.map((permission) => (
                        <li
                          key={permission}
                          className="flex items-start gap-2.5 text-sm text-slate-600"
                        >
                          <Check
                            size={16}
                            className="mt-0.5 shrink-0 text-emerald-700"
                          />
                          <span>{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-slate-900 px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950 p-6 text-white shadow-xl shadow-slate-950/10 sm:rounded-[1.75rem] sm:p-10 lg:p-14">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[38px] border-emerald-400/[0.08]" />
            <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Get Started
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Take control of your aquaponics system.
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                  Stay informed about available system measurements with the
                  AQUANICS monitoring platform.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/30"
                >
                  Sign In to AQUANICS
                  <ArrowRight size={17} />
                </Link>
                <Link
                  to="/guest/dashboard"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
                >
                  Explore as Guest
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8 lg:py-11">
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src={logo}
                alt=""
                className="h-10 w-10 rounded-xl object-contain"
              />
              <span>
                <span className="block font-display text-base font-bold text-slate-900">
                  AQUANICS
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  Smart Aquaponics
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-500">
              An IoT-based platform for aquaponics monitoring, system
              information, and learning resources.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">Explore</h2>
            <div className="mt-3 grid gap-2">
              {navigation.slice(0, 4).map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="w-fit text-sm text-slate-500 transition hover:text-emerald-800"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-900">Platform</h2>
            <div className="mt-3 grid gap-2">
              <Link
                to="/guest/dashboard"
                className="w-fit text-sm text-slate-500 transition hover:text-emerald-800"
              >
                Guest Dashboard
              </Link>
              <Link
                to="/guest/learning"
                className="w-fit text-sm text-slate-500 transition hover:text-emerald-800"
              >
                Learning Center
              </Link>
              <Link
                to="/login"
                className="w-fit text-sm text-slate-500 transition hover:text-emerald-800"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>© {new Date().getFullYear()} AQUANICS Systems</span>
            <span>Connected aquaponics monitoring</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
