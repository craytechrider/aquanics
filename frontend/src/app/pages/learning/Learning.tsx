import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router";
import {
  ArrowLeft,
  Home,
  BookOpen,
  Play,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Clock,
  GraduationCap,
  Video,
  Link2,
  ChevronRight,
  Sparkles,
  Leaf,
  Fish,
  Droplets,
  Wrench,
  Layers,
  HelpCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  LEARNING_MODULES,
  LEARNING_CATEGORIES,
  type LearningModule,
  type ModuleType,
} from "./learningData";

/* Category icon map */
const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "Getting Started": <Sparkles size={16} />,
  "Water Chemistry": <Droplets size={16} />,
  "Fish Care": <Fish size={16} />,
  "Plant Growth": <Leaf size={16} />,
  "System Design": <Layers size={16} />,
  Troubleshooting: <Wrench size={16} />,
};

/* Type badge */
function TypeBadge({ type }: { type: ModuleType }) {
  const cfg = {
    video: {
      icon: <Video size={14} />,
      label: "Video",
      cls: "bg-red-50 text-red-600 border-red-100",
    },
    article: {
      icon: <FileText size={14} />,
      label: "Article",
      cls: "bg-blue-50 text-blue-600 border-blue-100",
    },
    link: {
      icon: <Link2 size={14} />,
      label: "Resource",
      cls: "bg-violet-50 text-violet-600 border-violet-100",
    },
  }[type];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border uppercase tracking-wider",
        cfg.cls,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* Difficulty badge */
function DifficultyBadge({ level }: { level: string }) {
  const cls =
    {
      Beginner: "bg-emerald-50 text-emerald-700 border-emerald-100",
      Intermediate: "bg-amber-50 text-amber-700 border-amber-100",
      Advanced: "bg-rose-50 text-rose-700 border-rose-100",
    }[level] ?? "bg-slate-50 text-slate-600 border-slate-100";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border",
        cls,
      )}
    >
      <GraduationCap size={12} />
      {level}
    </span>
  );
}

/* Module Card */
function ModuleCard({ module }: { module: LearningModule }) {
  return (
    <a
      href={module.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-100/40"
    >
      <div className="relative h-36 overflow-hidden bg-slate-100 sm:h-40 lg:h-44">
        <img
          src={module.thumbnail}
          alt={module.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {module.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
              <Play
                size={24}
                className="ml-1 text-red-600"
                fill="currentColor"
              />
            </div>
          </div>
        )}

        <div className="absolute left-3 top-3">
          <TypeBadge type={module.type} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <DifficultyBadge level={module.difficulty} />
          {(module.duration || module.readTime) && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
              <Clock size={12} />
              {module.duration || module.readTime}
            </span>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-[13px] font-bold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-[15px]">
          {module.title}
        </h3>

        <p className="mb-3 line-clamp-3 flex-1 text-[11px] leading-relaxed text-slate-500 sm:mb-4 sm:text-sm">
          {module.description}
        </p>

        <div className="flex items-center justify-between border-t border-slate-50 pt-3">
          <span className="max-w-[58%] truncate text-[10px] font-medium text-slate-400 sm:text-xs">
            {module.source}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 transition-all group-hover:gap-2 sm:text-xs">
            {module.type === "video" ? "Watch" : "Read"}
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </a>
  );
}

/* Main Learning Page */
export default function Learning() {
  const location = useLocation();
  const isGuestPage = location.pathname === "/guest/learning";

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeType, setActiveType] = useState<ModuleType | "all">("all");

  const filtered = useMemo(() => {
    return LEARNING_MODULES.filter((m) => {
      const matchCategory =
        activeCategory === "All" || m.category === activeCategory;
      const matchType = activeType === "all" || m.type === activeType;
      const searchTerm = search.trim().toLowerCase();

      const matchSearch =
        searchTerm === "" ||
        m.title.toLowerCase().includes(searchTerm) ||
        m.description.toLowerCase().includes(searchTerm) ||
        m.tags.some((tag) => tag.toLowerCase().includes(searchTerm));

      return matchCategory && matchType && matchSearch;
    });
  }, [search, activeCategory, activeType]);

  const counts = {
    all: LEARNING_MODULES.length,
    video: LEARNING_MODULES.filter((m) => m.type === "video").length,
    article: LEARNING_MODULES.filter((m) => m.type === "article").length,
    link: LEARNING_MODULES.filter((m) => m.type === "link").length,
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 px-3 sm:space-y-7 sm:px-4 lg:space-y-8 lg:px-0">
      {/* Guest-only navigation header */}
      {isGuestPage && (
        <header className="sticky top-0 z-40 -mx-3 -mt-3 mb-5 border-b border-emerald-100 bg-white/95 shadow-sm backdrop-blur-md sm:-mx-4 sm:-mt-4 lg:mx-0 lg:mt-0">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5">
            <Link
              to="/guest/dashboard"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </Link>

            <div className="hidden items-center gap-2 text-sm font-extrabold text-slate-700 md:flex">
              <BookOpen size={18} className="text-emerald-600" />
              AQUANICS Learning Center
            </div>

            <Link
              to="/"
              aria-label="Return to landing page"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-emerald-800 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-900"
            >
              <Home size={17} />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </header>
      )}

      {/* Learning Center heading */}
      <div className="mx-auto flex w-[94%] flex-col justify-between gap-3 sm:w-[92%] sm:gap-4 md:flex-row md:items-end lg:w-full">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:gap-3 sm:text-3xl">
            <BookOpen
              className="text-emerald-600"
              size={26}
              strokeWidth={2.5}
            />
            Learning Center
          </h1>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
            Videos, articles &amp; resources to master aquanics
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-emerald-100 bg-emerald-50/50 px-3.5 py-2.5 text-xs font-bold text-emerald-700 shadow-sm sm:px-5 sm:text-sm md:self-auto">
          <GraduationCap size={18} />
          {LEARNING_MODULES.length} Modules Available
        </div>
      </div>

      {/* Featured banner */}
      <div className="relative mx-auto w-[94%] overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 p-5 text-white shadow-xl shadow-emerald-200 sm:w-[92%] sm:rounded-3xl sm:p-6 lg:w-full lg:p-8">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="absolute right-4 top-5 rotate-12 opacity-15 sm:right-8 sm:top-6 sm:opacity-20">
          <BookOpen
            size={90}
            className="sm:h-[120px] sm:w-[120px] lg:h-[140px] lg:w-[140px]"
          />
        </div>

        <div className="relative z-10 max-w-2xl pr-0 sm:pr-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-lg border border-white/10 bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              Learn Aquanics
            </span>
          </div>

          <h2 className="mb-3 text-xl font-bold leading-snug sm:text-2xl md:text-3xl">
            Master the Art &amp; Science of Aquanics
          </h2>

          <p className="text-xs font-medium leading-relaxed text-emerald-50 sm:text-sm md:text-base">
            Aquanics combines fish farming and soilless plant cultivation into
            one integrated system. Fish waste provides natural fertilizer for
            plants, while plants filter and clean the water for fish — creating
            a sustainable, closed-loop ecosystem. Explore our curated modules
            below to learn everything from the basics to advanced system design.
          </p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mx-auto w-[94%] space-y-3 sm:w-[92%] sm:space-y-4 lg:w-full">
        <div className="relative w-full max-w-xl">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search modules... (e.g. pH, tilapia, nitrogen cycle)"
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-3 text-sm font-medium text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:py-3.5 sm:pl-12 sm:pr-4"
          />
        </div>

        {/* Type filter tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(
            [
              { key: "all", label: "All", icon: <Filter size={14} /> },
              { key: "video", label: "Videos", icon: <Video size={14} /> },
              {
                key: "article",
                label: "Articles",
                icon: <FileText size={14} />,
              },
              {
                key: "link",
                label: "Resources",
                icon: <ExternalLink size={14} />,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveType(tab.key)}
              className={cn(
                "inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all duration-200 sm:px-4 sm:text-sm",
                activeType === tab.key
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-200"
                  : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700",
              )}
            >
              {tab.icon}
              {tab.label}
              <span
                className={cn(
                  "ml-1 rounded-md px-1.5 py-0.5 text-xs",
                  activeType === tab.key
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500",
                )}
              >
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {LEARNING_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200 sm:px-4 sm:text-sm",
                activeCategory === category
                  ? "border-slate-900 bg-slate-900 text-white shadow-md"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              {category !== "All" && CATEGORY_ICON[category]}
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Module grid */}
      {filtered.length > 0 ? (
        <div className="mx-auto grid w-[94%] grid-cols-2 gap-3 sm:w-[92%] sm:gap-5 md:grid-cols-2 lg:w-full lg:grid-cols-3 lg:gap-6">
          {filtered.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      ) : (
        <div className="mx-auto flex w-[94%] flex-col items-center justify-center py-14 text-center sm:w-[92%] sm:py-20 lg:w-full">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 sm:h-20 sm:w-20">
            <HelpCircle size={30} className="text-slate-400" />
          </div>

          <h3 className="mb-1 text-lg font-bold text-slate-700">
            No modules found
          </h3>
          <p className="max-w-sm text-sm text-slate-500">
            Try adjusting your search or filters to find what you are looking
            for.
          </p>

          <button
            onClick={() => {
              setSearch("");
              setActiveCategory("All");
              setActiveType("all");
            }}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-emerald-700"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Quick reference section */}
      <div className="mx-auto w-[94%] rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-slate-200/50 sm:w-[92%] sm:rounded-3xl sm:p-6 lg:w-full lg:p-8">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-900 sm:mb-6 sm:text-xl">
          <Sparkles size={22} className="text-amber-500" />
          Quick Reference: How Aquanics Works
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-center sm:p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 sm:h-14 sm:w-14">
              <Fish size={24} className="text-blue-600" />
            </div>
            <h4 className="mb-2 text-sm font-bold text-slate-800 sm:text-base">
              1. Fish Produce Waste
            </h4>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Fish excrete ammonia (NH₃) through their gills and waste. In
              traditional aquaculture this is toxic, but in aquanics it becomes
              valuable plant nutrition.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center sm:p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 sm:h-14 sm:w-14">
              <Droplets size={24} className="text-emerald-600" />
            </div>
            <h4 className="mb-2 text-sm font-bold text-slate-800 sm:text-base">
              2. Bacteria Convert
            </h4>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Beneficial bacteria (Nitrosomonas &amp; Nitrobacter) convert toxic
              ammonia → nitrites → nitrates through the nitrogen cycle. This is
              called nitrification.
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-green-50/50 p-4 text-center sm:p-6">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 sm:h-14 sm:w-14">
              <Leaf size={24} className="text-green-600" />
            </div>
            <h4 className="mb-2 text-sm font-bold text-slate-800 sm:text-base">
              3. Plants Absorb &amp; Filter
            </h4>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Plants absorb nitrates as fertilizer, growing without soil. The
              cleaned water cycles back to the fish tank — creating a
              sustainable closed-loop ecosystem.
            </p>
          </div>
        </div>
      </div>

      {/* Guest-only footer navigation */}
      {isGuestPage && (
        <div className="mx-auto flex w-[94%] flex-col items-start justify-between gap-3 border-t border-slate-200 py-5 sm:w-[92%] sm:flex-row sm:items-center lg:w-full">
          <p className="text-xs text-slate-400">
            AQUANICS • Public Learning Center
          </p>
          <Link
            to="/guest/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-900"
          >
            <ArrowLeft size={16} />
            Return to Guest Dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
