import { useState, useEffect, useRef } from "react";
import {
  User,
  Bell,
  Shield,
  Wifi,
  Smartphone,
  Save,
  Loader2,
  CheckCircle2,
  Camera,
  UserPlus,
  Eye,
  EyeOff,
} from "lucide-react";

import { Toggle } from "../../components/ui/Toggle";
import { settingsApi, authApi } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { cn } from "../../lib/utils";
import { registerPushToken } from "../../../firebaseMessaging";

export default function Settings() {
  const { user, setUser } = useAuth();

  // ============================================================
  // FARMER CAN REGISTER ACCOUNT
  // ============================================================

  const canRegisterAccount =
    String(user?.role || "")
      .trim()
      .toLowerCase() === "farmer" && user?.can_manage_users === true;
  // ============================================================
  // GENERAL
  // ============================================================

  const [profile, setProfile] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");

  const [activeSection, setActiveSection] = useState<
    "profile" | "iot" | "notifications" | "security" | "register"
  >("profile");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);

  // ============================================================
  // IOT DEVICE
  // ============================================================

  const [iotOnline, setIotOnline] = useState(false);
  const [lastActive, setLastActive] = useState("");

  // ============================================================
  // PROFILE
  // ============================================================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // ============================================================
  // SECURITY
  // ============================================================

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ============================================================
  // REGISTER ACCOUNT
  // ============================================================

  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");

  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] =
    useState(false);

  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const defaultAvatar =
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80";

  // ============================================================
  // LOAD SETTINGS
  // ============================================================

  useEffect(() => {
    loadSettings();
  }, []);

  // ============================================================
  // PUSH NOTIFICATIONS
  // ============================================================

  useEffect(() => {
    if (!user || !pushNotifications) {
      return;
    }

    const setupPushNotifications = async () => {
      try {
        console.log("Setting up Aquanics push notifications for:", user.email);

        await registerPushToken();

        console.log("Aquanics push notification registration completed.");
      } catch (err) {
        console.error("Failed to register Aquanics push notifications:", err);
      }
    };

    setupPushNotifications();
  }, [user, pushNotifications]);

  // ============================================================
  // LOAD SETTINGS
  // ============================================================

  const loadSettings = async () => {
    try {
      const res = await settingsApi.getData();

      const loadedUser = res.data.user;

      setProfile(loadedUser);

      setName(loadedUser.name || "");
      setEmail(loadedUser.email || "");
      setPhone(loadedUser.phone || "");
      setAvatarPreview(loadedUser.avatar || "");

      checkIotStatus();
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // IOT STATUS
  // ============================================================

  const checkIotStatus = async () => {
    try {
      const res = await settingsApi.getData();

      const device = res.data?.iotDevice;

      if (device) {
        setIotOnline(device.status === "online" || device.online === true);

        setLastActive(device.last_active || "");
      }
    } catch (err) {
      console.error("Failed to check Aquanics ESP32 status:", err);

      setIotOnline(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    checkIotStatus();

    const interval = setInterval(() => {
      checkIotStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, [loading]);

  // ============================================================
  // SUCCESS MESSAGE
  // ============================================================

  const showSuccessToast = (msg: string) => {
    setSaveSuccess(msg);

    setTimeout(() => {
      setSaveSuccess("");
    }, 3000);
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSaveProfile = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const res = await settingsApi.updateProfile({
        name,
        email,
        phone,
      });

      const nextAvatar = res.data.avatar || profile?.avatar || user?.avatar;

      setProfile((prev: any) => ({
        ...prev,
        ...res.data,
        avatar: nextAvatar,
      }));

      setUser({
        ...(user || {}),
        ...res.data,
        avatar: nextAvatar,
      });

      if (nextAvatar) {
        setAvatarPreview(nextAvatar);
      }

      showSuccessToast("Profile saved successfully!");
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // AVATAR
  // ============================================================

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Max file size is 5MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarPreview(previewUrl);
    setAvatarUploading(true);

    settingsApi
      .updateAvatar(file)
      .then((res) => {
        const serverAvatar = res.data.avatar as string | undefined;

        setProfile((prev: any) => ({
          ...prev,
          avatar: serverAvatar,
        }));

        if (serverAvatar) {
          const img = new Image();

          img.onload = () => {
            setAvatarPreview(serverAvatar);

            setUser({
              ...(user || {}),
              ...res.data,
              avatar: serverAvatar,
            });

            showSuccessToast("Avatar updated!");

            setAvatarUploading(false);
          };

          img.onerror = () => {
            setAvatarPreview(previewUrl);

            setUser({
              ...(user || {}),
              ...res.data,
              avatar: previewUrl,
            });

            setAvatarUploading(false);
          };

          img.src = serverAvatar;
        } else {
          setAvatarPreview(previewUrl);

          setUser({
            ...(user || {}),
            ...res.data,
            avatar: previewUrl,
          });

          showSuccessToast("Avatar updated!");

          setAvatarUploading(false);
        }
      })
      .catch((err) => {
        console.error("Avatar upload failed:", err);

        setAvatarUploading(false);

        alert("Failed to upload avatar.");
      });
  };

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const handleSaveNotifications = () => {
    setNotifSaved(true);

    showSuccessToast("Notification preferences saved!");

    setTimeout(() => {
      setNotifSaved(false);
    }, 2000);
  };

  // ============================================================
  // PASSWORD
  // ============================================================

  const handleChangePassword = async () => {
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match");
      return;
    }

    if (!currentPassword || !newPassword) {
      setPasswordMessage("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      await settingsApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setPasswordMessage("success: Password updated successfully!");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMessage(
        err.response?.data?.message ||
          "Failed to update password. Check your current password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ============================================================
  // REGISTER ACCOUNT
  // ============================================================

  const handleRegisterAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    setRegisterError("");
    setRegisterSuccess("");

    if (!registerFirstName.trim() || !registerLastName.trim()) {
      setRegisterError("Please enter the user's first and last name.");
      return;
    }

    if (!registerEmail.trim()) {
      setRegisterError("Please enter an email address.");
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError("Password must be at least 6 characters.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError("Passwords do not match.");
      return;
    }

    setRegisterLoading(true);

    try {
      /*
       * Use the same legitimate registration API
       * that your existing Register page uses.
       *
       * No password_confirmation.
       * No role field.
       *
       * The backend's normal registration process
       * determines the new account's default role.
       */

      await authApi.register({
        name: `${registerFirstName} ${registerLastName}`.trim(),
        email: registerEmail,
        password: registerPassword,
      });

      setRegisterSuccess("Account created successfully!");

      setRegisterFirstName("");
      setRegisterLastName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");

      showSuccessToast("New account created successfully!");
    } catch (err: any) {
      console.error("Failed to create account:", err);

      const validationErrors = err.response?.data?.errors;

      let errorMessage =
        err.response?.data?.message ||
        "Failed to create account. Please try again.";

      if (validationErrors) {
        const firstError = Object.values(validationErrors).flat().find(Boolean);

        if (firstError) {
          errorMessage = String(firstError);
        }
      }

      setRegisterError(errorMessage);
    } finally {
      setRegisterLoading(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-0 space-y-5 sm:space-y-8">
      {/* ========================================================
          SUCCESS TOAST
      ======================================================== */}

      {saveSuccess && (
        <div className="fixed right-3 sm:right-6 top-3 sm:top-6 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-xl bg-emerald-600 px-3.5 sm:px-5 py-2.5 sm:py-3 text-white shadow-lg shadow-emerald-200">
          <CheckCircle2 size={18} />

          <span className="text-sm font-bold">{saveSuccess}</span>
        </div>
      )}

      {/* ========================================================
          HEADER
      ======================================================== */}

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto mb-5 sm:mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
          Settings
        </h1>

        <p className="mt-1 text-sm sm:text-base font-medium text-slate-500 leading-relaxed">
          Manage your profile, devices, and preferences
        </p>
      </div>

      {/* ========================================================
          SETTINGS LAYOUT
      ======================================================== */}

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto grid grid-cols-1 gap-5 sm:gap-8 lg:grid-cols-12">
        {/* ======================================================
            SETTINGS MENU
        ====================================================== */}

        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:block lg:space-y-2 lg:col-span-3">
          {/* PROFILE */}

          <button
            type="button"
            onClick={() => setActiveSection("profile")}
            className={cn(
              "flex w-full items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-xl border px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all",
              activeSection === "profile"
                ? "border-emerald-100 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-50"
                : "border-transparent bg-transparent font-medium text-slate-600 hover:border-slate-200 hover:bg-white",
            )}
          >
            <User size={18} />

            <span>Profile & Account</span>
          </button>

          {/* IOT */}

          <button
            type="button"
            onClick={() => setActiveSection("iot")}
            className={cn(
              "flex w-full items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-xl border px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all",
              activeSection === "iot"
                ? "border-emerald-100 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-50"
                : "border-transparent bg-transparent font-medium text-slate-600 hover:border-slate-200 hover:bg-white",
            )}
          >
            <Wifi size={18} />

            <span>IoT Devices</span>
          </button>

          {/* NOTIFICATIONS */}

          <button
            type="button"
            onClick={() => setActiveSection("notifications")}
            className={cn(
              "flex w-full items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-xl border px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all",
              activeSection === "notifications"
                ? "border-emerald-100 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-50"
                : "border-transparent bg-transparent font-medium text-slate-600 hover:border-slate-200 hover:bg-white",
            )}
          >
            <Bell size={18} />

            <span>Notifications</span>
          </button>

          {/* SECURITY */}

          <button
            type="button"
            onClick={() => setActiveSection("security")}
            className={cn(
              "flex w-full items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-xl border px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all",
              activeSection === "security"
                ? "border-emerald-100 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-50"
                : "border-transparent bg-transparent font-medium text-slate-600 hover:border-slate-200 hover:bg-white",
            )}
          >
            <Shield size={18} />

            <span>Security</span>
          </button>

          {/* ==================================================
              REGISTER ACCOUNT
              FARMER ONLY
          ================================================== */}

          {canRegisterAccount && (
            <button
              type="button"
              onClick={() => {
                setActiveSection("register");
                setRegisterError("");
                setRegisterSuccess("");
              }}
              className={cn(
                "flex w-full items-center justify-center sm:justify-start gap-2 sm:gap-3 rounded-xl border px-2.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-all",
                activeSection === "register"
                  ? "border-emerald-100 bg-white text-emerald-700 shadow-sm ring-2 ring-emerald-50"
                  : "border-transparent bg-transparent font-medium text-slate-600 hover:border-slate-200 hover:bg-white",
              )}
            >
              <UserPlus size={18} />

              <span>Register Account</span>
            </button>
          )}
        </div>

        {/* ======================================================
            MAIN CONTENT
        ====================================================== */}

        <div className="space-y-5 sm:space-y-8 lg:col-span-9">
          {/* ==================================================
              PROFILE
          ================================================== */}

          {activeSection === "profile" && (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 lg:p-8 shadow-xl shadow-slate-200/50">
              <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-800">
                  <User size={20} className="text-slate-400" />
                  Profile Information
                </h3>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="self-start sm:self-auto flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                >
                  <Save size={16} />

                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {/* AVATAR */}

              <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 sm:p-4 text-center sm:text-left">
                <div className="group relative">
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-200 shadow-md ring-4 ring-white">
                    <img
                      src={avatarPreview || profile?.avatar || defaultAvatar}
                      alt="Profile"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = defaultAvatar;
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    {avatarUploading ? (
                      <Loader2 size={20} className="animate-spin text-white" />
                    ) : (
                      <Camera size={20} className="text-white" />
                    )}
                  </button>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    {avatarUploading ? "Uploading..." : "Change Avatar"}
                  </button>

                  <p className="mt-2 text-xs font-medium text-slate-400">
                    JPG, GIF or PNG. Max size of 5MB
                  </p>
                </div>
              </div>

              {/* PROFILE FIELDS */}

              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Role
                  </label>

                  <input
                    type="text"
                    value={profile?.role || ""}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 font-medium text-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              IOT DEVICES
          ================================================== */}

          {activeSection === "iot" && (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 lg:p-8 shadow-xl shadow-slate-200/50">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-800">
                  <Wifi size={20} className="text-slate-400" />
                  Connected Devices
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-400">
                  Aquanics IoT monitoring device
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 sm:p-5 transition-all duration-300 hover:bg-white hover:shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 text-slate-600 shadow-sm">
                      <Smartphone size={22} />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        Aquanics ESP32
                      </p>

                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        IoT Monitoring Controller
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Sensors: pH • Temperature • Battery • Current • Water
                        Level
                      </p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5",
                      iotOnline
                        ? "border-emerald-100 bg-emerald-50"
                        : "border-slate-200 bg-slate-50",
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        iotOnline
                          ? "animate-pulse bg-emerald-500"
                          : "bg-slate-400",
                      )}
                    />

                    <span
                      className={cn(
                        "text-xs font-bold",
                        iotOnline ? "text-emerald-700" : "text-slate-500",
                      )}
                    >
                      {iotOnline ? "Online" : "Offline"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4 border-t border-slate-200 pt-3 sm:pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <span className="text-xs font-medium text-slate-400">
                      Last activity
                    </span>

                    <span className="text-xs font-bold text-slate-600">
                      {lastActive || "Checking..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          {activeSection === "notifications" && (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 lg:p-8 shadow-xl shadow-slate-200/50">
              <h3 className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-slate-800">
                <Bell size={20} className="text-slate-400" />
                Notifications
              </h3>

              <div className="space-y-5 sm:space-y-6">
                <Toggle
                  isOn={emailAlerts}
                  onToggle={() => setEmailAlerts((prev) => !prev)}
                  label="Email Alerts for Critical Levels"
                />

                <div className="h-px w-full bg-slate-100" />

                <Toggle
                  isOn={pushNotifications}
                  onToggle={() => setPushNotifications((prev) => !prev)}
                  label="Push Notifications for Device Status"
                />

                <div className="h-px w-full bg-slate-100" />

                <Toggle
                  isOn={weeklyReports}
                  onToggle={() => setWeeklyReports((prev) => !prev)}
                  label="Weekly Report Summary"
                />

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 sm:px-6 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200"
                  >
                    <Save size={16} />

                    {notifSaved ? "Saved!" : "Save Preferences"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================
              SECURITY
          ================================================== */}

          {activeSection === "security" && (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 lg:p-8 shadow-xl shadow-slate-200/50">
              <h3 className="mb-6 flex items-center gap-2 font-display text-lg font-bold text-slate-800">
                <Shield size={20} className="text-slate-400" />
                Security
              </h3>

              <div className="space-y-5 sm:space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Current Password
                  </label>

                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    New Password
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Confirm New Password
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    placeholder="Confirm new password"
                  />
                </div>

                {passwordMessage && (
                  <p
                    className={cn(
                      "text-sm font-medium",
                      passwordMessage.includes("success")
                        ? "text-emerald-600"
                        : "text-red-600",
                    )}
                  >
                    {passwordMessage.replace("success: ", "")}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 sm:px-6 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}

                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </div>
          )}

          {/* ==================================================
              REGISTER ACCOUNT
              FARMER ONLY
          ================================================== */}

          {activeSection === "register" && canRegisterAccount && (
            <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-4 sm:p-6 lg:p-8 shadow-xl shadow-slate-200/50">
              <div className="mb-6">
                <h3 className="flex items-center gap-2 font-display text-lg font-bold text-slate-800">
                  <UserPlus size={20} className="text-slate-400" />
                  Register Account
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-400">
                  Create a new Aquanics account.
                </p>
              </div>

              {/* ERROR */}

              {registerError && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {registerError}
                </div>
              )}

              {/* SUCCESS */}

              {registerSuccess && (
                <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 size={18} />

                  {registerSuccess}
                </div>
              )}

              <form onSubmit={handleRegisterAccount} className="space-y-5">
                {/* NAME */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">
                      First Name
                    </label>

                    <input
                      type="text"
                      value={registerFirstName}
                      onChange={(e) => setRegisterFirstName(e.target.value)}
                      required
                      placeholder="Juan"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700">
                      Last Name
                    </label>

                    <input
                      type="text"
                      value={registerLastName}
                      onChange={(e) => setRegisterLastName(e.target.value)}
                      required
                      placeholder="Dela Cruz"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                {/* EMAIL */}

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    placeholder="farmer@gmail.com"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                {/* PASSWORD */}

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegisterPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      value={registerConfirmPassword}
                      onChange={(e) =>
                        setRegisterConfirmPassword(e.target.value)
                      }
                      required
                      minLength={6}
                      placeholder="Re-enter password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-11 font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowRegisterConfirmPassword((prev) => !prev)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showRegisterConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* ACCOUNT ROLE INFORMATION */}

                <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-semibold text-emerald-700">
                    New accounts created here use the normal Aquanics
                    registration process.
                  </p>
                </div>

                {/* CREATE ACCOUNT */}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {registerLoading ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <UserPlus size={17} />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
