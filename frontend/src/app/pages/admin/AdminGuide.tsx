import { useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  Users,
  Settings,
  Activity,
  Shield,
  LayoutDashboard,
  Bell,
  Database,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Leaf,
  Search,
  ExternalLink,
  CircleCheck,
} from "lucide-react";

interface GuideSection {
  title: string;
  icon: typeof BookOpen;
  description: string;
  content: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: "Dashboard Overview",
    icon: LayoutDashboard,
    description: "Understand the main admin dashboard.",
    content: [
      "The Admin Dashboard provides an overview of the AQUANICS system, including registered users, active devices, system health, and recent alerts.",
      "Use the summary cards to review important system statistics. The navigation cards provide shortcuts to user management, system settings, and activity logs.",
      "Review System Alerts & Notifications regularly to identify problems that may need attention.",
    ],
  },
  {
    title: "User Management",
    icon: Users,
    description: "Create and manage user accounts.",
    content: [
      "Open User Management to view, create, edit, and delete user accounts.",
      "Select Add New User and enter the required name, email, password, and role information.",
      "Use the Edit button to update an account and the Delete button to remove an account when appropriate. Follow the application's restrictions on deleting administrator accounts.",
      "Assign roles carefully. Admin accounts have administrative privileges, while Farmer and Technician permissions should follow the access rules configured in the application.",
    ],
  },
  {
    title: "System Settings",
    icon: Settings,
    description: "Configure system preferences.",
    content: [
      "The Settings page includes General, Monitoring, Alerts, and Security sections.",
      "General settings manage system information, notifications, and data logging preferences.",
      "Monitoring settings include sensor reading intervals, data retention, temperature units, and configured sensor thresholds.",
      "Alert settings configure available alert preferences. Security settings contain the security options supported by the application.",
      "Select Save after making changes. Verify the result before leaving the page.",
    ],
  },
  {
    title: "Activity Logs",
    icon: Activity,
    description: "Review user actions and audit records.",
    content: [
      "Activity Logs provide records of actions performed within the system.",
      "Review the time, user, activity description, type, and status of each record.",
      "Select the details icon to inspect additional information when it is available.",
      "Use the pagination controls to navigate through available records. Investigate denied actions or unexpected changes when necessary.",
    ],
  },
  {
    title: "Security Best Practices",
    icon: Shield,
    description: "Protect administrative access.",
    content: [
      "Use a strong, unique administrator password and never share your credentials.",
      "Review activity logs for unfamiliar logins, denied requests, or unexpected changes.",
      "Use multi-factor authentication and session controls if these features are configured and supported by your deployment.",
      "Give each user only the permissions needed for their work.",
      "Ensure that backend authorization and database security rules enforce permissions. Hiding a button in the frontend is not sufficient protection.",
    ],
  },
  {
    title: "Notifications and Alerts",
    icon: Bell,
    description: "Understand monitoring alerts.",
    content: [
      "The system may generate alerts when sensor readings exceed configured thresholds or when a device encounters a problem.",
      "Review the severity, message, and associated reading when an alert appears.",
      "Critical alerts should be investigated promptly. Warning alerts should be reviewed according to your farm's monitoring procedures.",
      "Configure delivery methods and alert frequency only when the corresponding options are supported by your backend and deployment.",
    ],
  },
  {
    title: "Data and Backups",
    icon: Database,
    description: "Maintain reliable system data.",
    content: [
      "Sensor readings and application records are stored using the configured backend and database services.",
      "Data retention settings should match your monitoring and reporting requirements.",
      "Create regular backups using your actual database and hosting backup procedures, and verify that backups can be restored.",
      "Use available reports and exports to review data. Avoid manually deleting production records without authorization.",
    ],
  },
  {
    title: "Need Help?",
    icon: HelpCircle,
    description: "Find support and troubleshooting guidance.",
    content: [
      "If a page fails to load, check your connection and confirm that the backend service is running.",
      "If settings cannot be saved, check the browser console and backend logs for the actual error.",
      "If sensor readings are missing or outdated, check the device connection, Firebase data, and configured sensor paths.",
      "Contact your designated project administrator or support team when the issue cannot be resolved.",
    ],
  },
];

const QUICK_LINKS = [
  {
    label: "Manage Users",
    description: "Accounts and roles",
    path: "/admin/users",
    icon: Users,
  },
  {
    label: "System Settings",
    description: "Configuration",
    path: "/admin/settings",
    icon: Settings,
  },
  {
    label: "Activity Logs",
    description: "Audit records",
    path: "/admin/activity",
    icon: Activity,
  },
  {
    label: "Admin Dashboard",
    description: "System overview",
    path: "/admin/dashboard",
    icon: LayoutDashboard,
  },
];

export default function AdminGuide() {
  const [expanded, setExpanded] = useState<number[]>([0]);
  const [search, setSearch] = useState("");

  const filteredSections = GUIDE_SECTIONS.map((section, index) => ({
    ...section,
    originalIndex: index,
  })).filter((section) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      section.title.toLowerCase().includes(query) ||
      section.description.toLowerCase().includes(query) ||
      section.content.some((item) => item.toLowerCase().includes(query))
    );
  });

  const toggleSection = (index: number) => {
    setExpanded((previous) =>
      previous.includes(index)
        ? previous.filter((item) => item !== index)
        : [...previous, index],
    );
  };

  const expandAll = () => {
    setExpanded(GUIDE_SECTIONS.map((_, index) => index));
  };

  const collapseAll = () => {
    setExpanded([]);
  };

  return (
    <div className="min-w-0 space-y-6 pb-8 sm:space-y-8">
      {/* Page heading */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#123b2d] via-emerald-800 to-teal-700 p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full border-[28px] border-white/[0.07] sm:h-64 sm:w-64 sm:border-[38px]" />
        <div className="pointer-events-none absolute -bottom-16 right-1/4 h-36 w-36 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-emerald-100">
              <Leaf size={15} />
              AQUANICS ADMINISTRATION
            </div>

            <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              <BookOpen className="shrink-0 text-emerald-300" size={30} />
              Admin Guide
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-base sm:leading-7">
              Your reference for managing accounts, monitoring system activity,
              configuring settings, and maintaining AQUANICS.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-2xl border border-white/15 bg-white/10 text-emerald-200 sm:h-20 sm:w-20 sm:self-center">
            <Shield size={36} />
          </div>
        </div>

        <div className="relative z-10 mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-5">
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">
            <CircleCheck size={15} className="text-emerald-300" />
            Administration reference
          </span>
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/90">
            <BookOpen size={15} className="text-emerald-300" />
            {GUIDE_SECTIONS.length} Guide Sections
          </span>
        </div>
      </section>

      {/* Quick navigation */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            Quick Navigation
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Open an admin section directly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_LINKS.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-950/5 sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">
                  <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-800">
                    {item.label}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {item.description}
                  </p>
                </div>

                <ArrowRight
                  size={16}
                  className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-700"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Search and section controls */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-slate-900">
              Guide Topics
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search topics or expand a section to read the instructions.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={expandAll}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              Expand All
            </button>

            <button
              type="button"
              onClick={collapseAll}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search settings, users, alerts, security..."
            aria-label="Search admin guide topics"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
      </section>

      {/* Expandable guide sections */}
      <section className="space-y-3">
        {filteredSections.map((section) => {
          const Icon = section.icon;
          const isExpanded = expanded.includes(section.originalIndex);

          return (
            <article
              key={section.title}
              className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-emerald-100 hover:shadow-md"
            >
              <button
                type="button"
                aria-expanded={isExpanded}
                onClick={() => toggleSection(section.originalIndex)}
                className="flex w-full min-w-0 items-center gap-3 p-4 text-left transition hover:bg-emerald-50/40 sm:gap-4 sm:p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:h-12 sm:w-12">
                  <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-800 sm:text-base">
                    {section.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                    {section.description}
                  </p>
                </div>

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                  {isExpanded ? (
                    <ChevronDown size={18} />
                  ) : (
                    <ChevronRight size={18} />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
                  <ol className="space-y-3">
                    {section.content.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-600"
                      >
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-[11px] font-extrabold text-emerald-800">
                          {index + 1}
                        </span>
                        <span className="min-w-0">{item}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </article>
          );
        })}

        {filteredSections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <Search size={30} className="mx-auto text-slate-300" />
            <h3 className="mt-3 font-bold text-slate-800">
              No matching topics
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Try another search term.
            </p>
            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-4 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>

      {/* Support note */}
      <section className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
          <HelpCircle size={24} />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold text-slate-900">Still need help?</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Check the relevant guide section, inspect application errors, or
            contact your designated AQUANICS project administrator.
          </p>
        </div>

        <Link
          to="/admin/dashboard"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#123b2d] px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-900"
        >
          Admin Dashboard
          <ExternalLink size={15} />
        </Link>
      </section>
    </div>
  );
}
