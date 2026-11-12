import { useState } from "react";
import { Link } from "react-router";
import {
  BookOpen,
  Users,
  Cpu,
  Settings,
  Activity,
  Shield,
  LayoutDashboard,
  Bell,
  AlertTriangle,
  Database,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Leaf,
  Thermometer,
  Search,
  ExternalLink,
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
      "Use the summary cards to review backend-reported system statistics. Administration cards link to user, device, sensor, alert, settings, and activity pages.",
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
      "Assign roles carefully. Admin is the full system administrator role. Farmer is the regular farmer role; use other roles only where they are available and intended.",
    ],
  },
  {
    title: "Device Management",
    icon: Cpu,
    description: "Review and control connected system devices.",
    content: [
      "Device Management shows the device records returned by the backend, including each device's name, reported mode, and schedule where available.",
      "Search the list by device name. Use the device control button to switch its reported on/off state; the page updates the device state after the backend confirms the action.",
      "If a device cannot be loaded or controlled, use the displayed retry/error message and check the connection.",
    ],
  },
  {
    title: "Sensor Management",
    icon: Thermometer,
    description: "Review sensor measurements and status.",
    content: [
      "Sensor Management displays measurement records returned by the backend for the deployed sensor setup. It shows each measurement key once and does not create placeholder readings.",
      "Available measurement types can include pH, dissolved oxygen, temperature, ammonia, and water level. The list and count reflect the unique measurement records actually returned by the backend.",
      "Search by sensor name. Filter by Stable, Warning, Critical, No Data, Offline, or Unconfigured to narrow the measurements.",
      "The status is calculated using the sensor's Firebase configuration. Select Edit to update the measurement record's name, value, or trend where supported. Threshold configuration is not edited from System Settings.",
    ],
  },
  {
    title: "System Settings",
    icon: Settings,
    description: "Configure system preferences.",
    content: [
      "The Settings page has General, Alerts, and Security tabs.",
      "General contains the system name and description, read-only system information, and notification/data-logging preferences.",
      "Alerts contains the configured email recipient, alert frequency, daily limit, email/SMS options, and critical-only preference.",
      "Security contains the session, password, login-attempt, IP whitelist, multi-factor, and audit-logging settings exposed by the page. Saving stores these values; enforcement depends on the backend and deployment.",
      "Select Save Settings after changing a tab. Sensor thresholds and telemetry configuration are managed outside System Settings.",
    ],
  },
  {
    title: "Alert Management",
    icon: AlertTriangle,
    description: "Filter and review system alerts.",
    content: [
      "Alert Management lists alerts returned by the backend, including title, message, severity, type, date and time, and read/unread state.",
      "Use the Critical, Warning, Success, and Info filters to view a severity category, or search matching alert text or type.",
      "Use the delete action to remove an alert after confirming. The current page does not provide a separate resolve or mark-as-read action.",
    ],
  },
  {
    title: "Activity Logs",
    icon: Activity,
    description: "Review user actions and audit records.",
    content: [
      "Activity Logs provide paginated records returned by the backend.",
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
    label: "Manage Devices",
    description: "Connected equipment",
    path: "/admin/devices",
    icon: Cpu,
  },
  {
    label: "Manage Sensors",
    description: "Readings and thresholds",
    path: "/admin/sensors",
    icon: Thermometer,
  },
  {
    label: "Manage Alerts",
    description: "System notifications",
    path: "/admin/alerts",
    icon: AlertTriangle,
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
      <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
            <Leaf size={15} className="text-emerald-700" />
            ADMINISTRATION
          </div>

          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            <BookOpen className="shrink-0 text-emerald-600" size={28} />
            Admin Guide
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Your reference for managing accounts, monitoring system activity,
            configuring settings, and maintaining AQUANICS.
          </p>
        </div>

        <div className="flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-2xl bg-emerald-50 text-emerald-700 sm:h-20 sm:w-20 sm:self-center">
          <Shield size={36} />
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
                className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md sm:p-5"
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
