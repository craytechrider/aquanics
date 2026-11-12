import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Crown,
  UserCheck,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Save,
  RefreshCw,
  Mail,
  Phone,
  CalendarDays,
} from "lucide-react";
import { adminApi } from "../../lib/api";
import { cn } from "../../lib/utils";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  sensors: number;
  devices: number;
  created_at: string;
}

const ROLES = ["Admin", "Farmer", "Technician"];

const inputClass =
  "w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:rounded-xl sm:px-4";

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  const emptyForm = {
    name: "",
    email: "",
    password: "",
    role: "Farmer",
    phone: "",
  };

  const [form, setForm] = useState(emptyForm);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setPageError("");

    try {
      const response = await adminApi.getUsers({});
      const data = response.data;
      setUsers(Array.isArray(data) ? data : (data.data ?? []));
    } catch (err) {
      console.error("Failed to load users:", err);
      setPageError("Unable to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (user: UserRow) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone ?? "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        const payload: Record<string, unknown> = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          phone: form.phone.trim() || null,
        };

        if (form.password) payload.password = form.password;

        await adminApi.updateUser(editing.id, payload);
      } else {
        await adminApi.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          phone: form.phone.trim() || undefined,
        });
      }

      setShowModal(false);
      await fetchUsers();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          Object.values(err.response?.data?.errors || {})
            .flat()
            .join(", ") ||
          "Unable to save user. Please check your input.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: UserRow) => {
    if (
      !window.confirm(
        `Delete the account for ${user.name}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setPageError("");

    try {
      await adminApi.deleteUser(user.id);
      await fetchUsers();
    } catch (err: any) {
      setPageError(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const getInitials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const adminCount = users.filter((user) => user.role === "Admin").length;
  const standardCount = users.length - adminCount;

  const stats = [
    {
      title: "Total Users",
      value: users.length,
      subtitle: "Registered accounts",
      icon: Users,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Admin Users",
      value: adminCount,
      subtitle: "Administrator accounts",
      icon: Crown,
      color: "bg-amber-50 text-amber-700",
    },
    {
      title: "User Accounts",
      value: standardCount,
      subtitle: "Non-admin accounts",
      icon: UserCheck,
      color: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Activity Rate",
      value: "—",
      subtitle: "Requires activity data",
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-700",
    },
  ];

  const roleClass = (role: string) => {
    if (role === "Admin") return "bg-emerald-50 text-emerald-700";
    if (role === "Technician") return "bg-cyan-50 text-cyan-700";
    return "bg-blue-50 text-blue-700";
  };

  return (
    <div className="min-w-0 space-y-4 pb-6 sm:space-y-6">
      <header className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900 sm:gap-3 sm:text-3xl">
            <Users
              size={24}
              className="shrink-0 text-emerald-600 sm:h-8 sm:w-8"
            />
            User Management
          </h1>
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Manage user accounts, roles, and permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-4 sm:text-sm"
        >
          <Plus size={16} />
          <span className="sm:hidden">Add User</span>
          <span className="hidden sm:inline">Add New User</span>
        </button>
      </header>

      {pageError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700 sm:text-sm">
          <p>{pageError}</p>
          <button
            type="button"
            onClick={() => void fetchUsers()}
            className="shrink-0 font-bold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-2 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.title}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:rounded-2xl sm:p-5"
            >
              <div className="flex items-start justify-between gap-1.5">
                <p className="min-w-0 text-[11px] font-semibold leading-tight text-slate-500 sm:text-sm">
                  {stat.title}
                </p>
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 sm:rounded-xl",
                    stat.color,
                  )}
                >
                  <Icon size={17} />
                </span>
              </div>
              <p className="mt-2 break-words text-2xl font-black leading-none text-slate-900 sm:mt-3 sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-2 text-[9px] leading-4 text-slate-400 sm:mt-3 sm:text-xs">
                {stat.subtitle}
              </p>
            </article>
          );
        })}
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm sm:rounded-2xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-white px-3 py-3 sm:px-5 sm:py-4">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 sm:text-base">
            <Users size={17} />
            All Users
          </h2>
          <button
            type="button"
            onClick={() => void fetchUsers()}
            disabled={loading}
            aria-label="Refresh users"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-700 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loader2 className="animate-spin text-emerald-600" size={26} />
          </div>
        ) : users.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Users size={28} className="mx-auto text-slate-300" />
            <p className="mt-2 text-sm font-bold text-slate-600">
              No users found
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Add a user to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Compact mobile user cards */}
            <div className="divide-y divide-slate-100 sm:hidden">
              {users.map((user) => (
                <article key={user.id} className="min-w-0 p-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                      {getInitials(user.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-xs font-extrabold text-slate-800">
                        {user.name}
                      </p>
                      <p className="mt-0.5 break-all text-[10px] text-slate-500">
                        {user.email}
                      </p>
                      <span
                        className={cn(
                          "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold",
                          roleClass(user.role),
                        )}
                      >
                        {user.role === "Admin" ? (
                          <Crown size={11} />
                        ) : (
                          <UserCheck size={11} />
                        )}
                        {user.role}
                      </span>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        aria-label={`Edit ${user.name}`}
                        className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"
                      >
                        <Pencil size={14} />
                      </button>
                      {user.role !== "Admin" && (
                        <button
                          type="button"
                          onClick={() => void handleDelete(user)}
                          aria-label={`Delete ${user.name}`}
                          className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
                    {user.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={11} />
                        {user.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarDays size={11} />
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "Date unavailable"}
                    </span>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[650px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    {["User", "Email", "Role", "Joined", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-600"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-50 transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                            {getInitials(user.name)}
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[220px] break-all px-4 py-3 text-xs text-slate-500">
                        {user.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold",
                            roleClass(user.role),
                          )}
                        >
                          {user.role === "Admin" ? (
                            <Crown size={11} />
                          ) : (
                            <UserCheck size={11} />
                          )}
                          {user.role}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            aria-label={`Edit ${user.name}`}
                            className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"
                          >
                            <Pencil size={14} />
                          </button>
                          {user.role !== "Admin" && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(user)}
                              aria-label={`Delete ${user.name}`}
                              className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="border-t border-slate-100 px-3 py-3 text-[10px] text-slate-500 sm:px-5 sm:text-xs">
          {users.length} registered account{users.length === 1 ? "" : "s"}
        </div>
      </section>

      {/* Create/edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close user form"
            onClick={() => setShowModal(false)}
            className="absolute inset-0"
          />

          <form
            onSubmit={handleSave}
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl sm:p-6"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 sm:text-xl">
                  {editing ? "Edit User" : "Create New User"}
                </h2>
                <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                  Enter the account details below.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-3 rounded-lg border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700"
              >
                {error}
              </div>
            )}

            <div className="space-y-3">
              <FormField label="Full Name">
                <input
                  required
                  maxLength={255}
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="Juan Dela Cruz"
                />
              </FormField>

              <FormField label="Email Address">
                <input
                  required
                  type="email"
                  maxLength={255}
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  placeholder="juan@example.com"
                />
              </FormField>

              <FormField
                label={editing ? "New Password (optional)" : "Password"}
              >
                <input
                  required={!editing}
                  type="password"
                  minLength={8}
                  autoComplete={editing ? "new-password" : "new-password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className={inputClass}
                  placeholder={
                    editing
                      ? "Leave blank to keep current"
                      : "At least 8 characters"
                  }
                />
              </FormField>

              <FormField label="Role">
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputClass}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Phone (optional)">
                <input
                  type="tel"
                  maxLength={30}
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputClass}
                  placeholder="+63 9xx xxx xxxx"
                />
              </FormField>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="min-h-10 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 sm:rounded-xl sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60 sm:rounded-xl sm:text-sm"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {editing ? "Save Changes" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm">
        {label}
      </span>
      {children}
    </label>
  );
}
