import { useEffect, useState } from "react";
import { Plus, Clock, Settings, Trash2, Save, Loader2 } from "lucide-react";

import { Toggle } from "../../components/ui/Toggle";
import { Modal } from "../../components/ui/Modal";

import { ref, onValue, push, set, update, remove } from "firebase/database";

import { db } from "../../../firebase";

/* =========================================================
   TYPES
========================================================= */

interface AutomationRule {
  id: string;
  name: string;
  sensor: string;
  condition: string;
  value: number;
  action: string;
  active: boolean;
}

interface FeedingSchedule {
  id: string;
  name: string;
  time: string;
  frequency: string;
  active: boolean;
}

/* =========================================================
   AUTOMATION
========================================================= */

export default function Automation() {
  /* =======================================================
     GENERAL STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);

  const [automations, setAutomations] = useState<AutomationRule[]>([]);

  const [schedules, setSchedules] = useState<FeedingSchedule[]>([]);

  /* =======================================================
     RULE MODAL
  ======================================================= */

  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const [ruleName, setRuleName] = useState("");

  const [ruleSensor, setRuleSensor] = useState("pH Level");

  const [ruleCondition, setRuleCondition] = useState("Greater than");

  const [ruleValue, setRuleValue] = useState("");

  const [ruleAction, setRuleAction] = useState("Turn On Pump");

  const [savingRule, setSavingRule] = useState(false);

  /* =======================================================
     FEEDING SCHEDULE MODAL
  ======================================================= */

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [scheduleName, setScheduleName] = useState("Feeding Schedule");

  const [scheduleTime, setScheduleTime] = useState("08:00");

  const [scheduleFrequency, setScheduleFrequency] = useState("Daily");

  const [savingSchedule, setSavingSchedule] = useState(false);

  /* =======================================================
     FISH DETAILS
  ======================================================= */

  const [fishSpecies, setFishSpecies] = useState("Tilapia");

  const [fishAge, setFishAge] = useState(12);

  const [fishSaving, setFishSaving] = useState(false);

  /* =======================================================
     LOAD FIREBASE DATA
  ======================================================= */

  useEffect(() => {
    const automationsRef = ref(db, "automations");

    const schedulesRef = ref(db, "schedules");

    const unsubscribeAutomations = onValue(
      automationsRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setAutomations([]);
          return;
        }

        const rules: AutomationRule[] = Object.entries(data).map(
          ([id, value]: [string, any]) => ({
            id,
            name: value.name || "Automation Rule",
            sensor: value.sensor || "pH Level",
            condition: value.condition || "Greater than",
            value:
              typeof value.value === "number"
                ? value.value
                : Number(value.value) || 0,
            action: value.action || "Turn On Pump",
            active: value.active !== false,
          }),
        );

        setAutomations(rules);
      },
      (error) => {
        console.error("Firebase automations error:", error);
      },
    );

    const unsubscribeSchedules = onValue(
      schedulesRef,
      (snapshot) => {
        const data = snapshot.val();

        if (!data) {
          setSchedules([]);
          setLoading(false);
          return;
        }

        const scheduleList: FeedingSchedule[] = Object.entries(data)
          .map(([id, value]: [string, any]) => ({
            id,
            name: value.name || "Feeding Schedule",
            time: value.time || "08:00",
            frequency: value.frequency || "Daily",
            active: value.active !== false,
          }))
          .filter((schedule) => schedule.name !== "Fish Details");

        setSchedules(scheduleList);

        setLoading(false);
      },
      (error) => {
        console.error("Firebase schedules error:", error);

        setLoading(false);
      },
    );

    return () => {
      unsubscribeAutomations();
      unsubscribeSchedules();
    };
  }, []);

  /* =======================================================
     CREATE AUTOMATION RULE
  ======================================================= */

  const handleCreateRule = async () => {
    if (!ruleName.trim()) {
      return;
    }

    if (!ruleValue) {
      return;
    }

    setSavingRule(true);

    try {
      const automationsRef = ref(db, "automations");

      const newRuleRef = push(automationsRef);

      await set(newRuleRef, {
        name: ruleName.trim(),

        sensor: ruleSensor,

        condition: ruleCondition,

        value: Number(ruleValue),

        action: ruleAction,

        active: true,

        createdAt: Date.now(),
      });

      setRuleName("");

      setRuleSensor("pH Level");

      setRuleCondition("Greater than");

      setRuleValue("");

      setRuleAction("Turn On Pump");

      setIsRuleModalOpen(false);
    } catch (error) {
      console.error("Failed to create automation rule:", error);
    } finally {
      setSavingRule(false);
    }
  };

  /* =======================================================
     TOGGLE AUTOMATION RULE
  ======================================================= */

  const handleToggleRule = async (rule: AutomationRule) => {
    try {
      const ruleRef = ref(db, `automations/${rule.id}`);

      await update(ruleRef, {
        active: !rule.active,
      });
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  /* =======================================================
     DELETE AUTOMATION RULE
  ======================================================= */

  const handleDeleteRule = async (id: string) => {
    try {
      const ruleRef = ref(db, `automations/${id}`);

      await remove(ruleRef);
    } catch (error) {
      console.error("Failed to delete rule:", error);
    }
  };

  /* =======================================================
     CREATE FEEDING SCHEDULE
  ======================================================= */

  const handleCreateSchedule = async () => {
    if (!scheduleTime) {
      return;
    }

    setSavingSchedule(true);

    try {
      const schedulesRef = ref(db, "schedules");

      const newScheduleRef = push(schedulesRef);

      await set(newScheduleRef, {
        name: scheduleName.trim() || "Feeding Schedule",

        time: scheduleTime,

        frequency: scheduleFrequency,

        active: true,

        createdAt: Date.now(),
      });

      setScheduleName("Feeding Schedule");

      setScheduleTime("08:00");

      setScheduleFrequency("Daily");

      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error("Failed to create feeding schedule:", error);
    } finally {
      setSavingSchedule(false);
    }
  };

  /* =======================================================
     TOGGLE FEEDING SCHEDULE
  ======================================================= */

  const handleToggleSchedule = async (schedule: FeedingSchedule) => {
    try {
      const scheduleRef = ref(db, `schedules/${schedule.id}`);

      await update(scheduleRef, {
        active: !schedule.active,
      });
    } catch (error) {
      console.error("Failed to toggle schedule:", error);
    }
  };

  /* =======================================================
     CHANGE FEEDING TIME
  ======================================================= */

  const handleTimeChange = async (
    schedule: FeedingSchedule,
    newTime: string,
  ) => {
    if (!newTime) {
      return;
    }

    try {
      const scheduleRef = ref(db, `schedules/${schedule.id}`);

      await update(scheduleRef, {
        time: newTime,
      });
    } catch (error) {
      console.error("Failed to update schedule time:", error);
    }
  };

  /* =======================================================
     DELETE FEEDING SCHEDULE
  ======================================================= */

  const handleDeleteSchedule = async (id: string) => {
    try {
      const scheduleRef = ref(db, `schedules/${id}`);

      await remove(scheduleRef);
    } catch (error) {
      console.error("Failed to delete feeding schedule:", error);
    }
  };

  /* =======================================================
     SAVE FISH DETAILS
  ======================================================= */

  const handleSaveFishDetails = async () => {
    setFishSaving(true);

    try {
      const updates: Record<string, any> = {};

      schedules.forEach((schedule) => {
        updates[`schedules/${schedule.id}/species`] = fishSpecies;

        updates[`schedules/${schedule.id}/fish_age_weeks`] = fishAge;
      });

      if (schedules.length > 0) {
        await update(ref(db), updates);
      }
    } catch (error) {
      console.error("Failed to save fish details:", error);
    } finally {
      setTimeout(() => {
        setFishSaving(false);
      }, 800);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 size={22} className="animate-spin" />

          <p className="text-sm font-medium">Loading automation settings...</p>
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
              Automation
              <span className="text-emerald-500">.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-500 font-medium mt-1">
              Configure smart rules and feeding schedules
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 px-2 sm:px-4 lg:px-0">
        {/* =================================================
            FEEDING SCHEDULES
        ================================================= */}

        <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-white p-5 sm:p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock size={24} />
              </div>

              <div>
                <h3 className="font-display font-bold text-slate-800 text-lg">
                  Smart Feeding Schedule
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  Automatic feeding times
                </p>
              </div>
            </div>

            {/* PLUS BUTTON */}

            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 hover:scale-105 transition-all"
              title="Add Feeding Schedule"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-5">
            {schedules.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                <Clock size={28} className="mx-auto text-slate-300 mb-3" />

                <p className="text-sm font-bold text-slate-500">
                  No feeding schedules yet
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Click the + button to add one.
                </p>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-800">
                      {schedule.name}
                    </span>

                    <div className="flex items-center gap-3">
                      <Toggle
                        isOn={schedule.active}
                        onToggle={() => handleToggleSchedule(schedule)}
                      />

                      <button
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete schedule"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(e) =>
                        handleTimeChange(schedule, e.target.value)
                      }
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-amber-400"
                    />

                    <span className="text-xs text-slate-400 font-medium">
                      {schedule.frequency || "Daily"}
                    </span>
                  </div>
                </div>
              ))
            )}

            {/* FISH DETAILS */}

            <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-800">
                  Fish Details
                </span>

                <button
                  onClick={handleSaveFishDetails}
                  disabled={fishSaving}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Save size={14} />

                  {fishSaving ? "Saved!" : "Save"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Species
                  </label>

                  <select
                    value={fishSpecies}
                    onChange={(e) => setFishSpecies(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-emerald-400"
                  >
                    <option value="Tilapia">Tilapia</option>

                    <option value="Catfish">Catfish</option>

                    <option value="Trout">Trout</option>

                    <option value="Koi">Koi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Age (Weeks)
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={fishAge}
                    onChange={(e) => setFishAge(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            AUTOMATION RULES
        ================================================= */}

        <div className="w-[94%] sm:w-[92%] lg:w-full mx-auto bg-white p-5 sm:p-6 lg:p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Settings size={24} />
              </div>

              <h3 className="font-display font-bold text-slate-800 text-lg">
                Active Rules
              </h3>
            </div>

            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 hover:scale-105 transition-all"
              title="Add automation rule"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {automations.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                <Settings size={28} className="mx-auto text-slate-300 mb-3" />

                <p className="text-sm font-bold text-slate-500">
                  No automation rules
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Create a rule to automate your system.
                </p>
              </div>
            ) : (
              automations.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group"
                >
                  <div>
                    <p className="font-bold text-slate-800">{rule.name}</p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-300">
                        {rule.sensor} {rule.condition} {rule.value}
                      </span>

                      <span className="text-slate-300">→</span>

                      <span className="text-xs font-bold bg-sky-100 text-sky-700 px-2.5 py-1 rounded-lg border border-sky-200">
                        {rule.action}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Toggle
                      isOn={rule.active}
                      onToggle={() => handleToggleRule(rule)}
                    />

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}

            <button
              onClick={() => setIsRuleModalOpen(true)}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-sm hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Add New Rule
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================
          CREATE RULE MODAL
      =================================================== */}

      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Create Automation Rule"
      >
        <form
          className="space-y-4 mt-2 font-sans"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateRule();
          }}
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Rule Name
            </label>

            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="e.g. High Temperature"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                If Sensor
              </label>

              <select
                value={ruleSensor}
                onChange={(e) => setRuleSensor(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 bg-white"
              >
                <option>pH Level</option>

                <option>Temperature</option>

                <option>Dissolved Oxygen</option>

                <option>Ammonia</option>

                <option>Water Level</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Condition
              </label>

              <select
                value={ruleCondition}
                onChange={(e) => setRuleCondition(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 bg-white"
              >
                <option>Greater than</option>

                <option>Less than</option>

                <option>Equals</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Value
              </label>

              <input
                type="number"
                step="any"
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                placeholder="0.0"
                required
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Then Action
            </label>

            <select
              value={ruleAction}
              onChange={(e) => setRuleAction(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 bg-white"
            >
              <option>Turn On Pump</option>

              <option>Turn Off Pump</option>

              <option>Turn On Aerator</option>

              <option>Turn Off Aerator</option>

              <option>Turn On Lights</option>

              <option>Turn Off Lights</option>

              <option>Activate Feeder</option>

              <option>Send Notification</option>
            </select>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsRuleModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingRule}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {savingRule ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Rule
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================
          ADD FEEDING SCHEDULE MODAL
      =================================================== */}

      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Add Feeding Schedule"
      >
        <form
          className="space-y-5 mt-2 font-sans"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateSchedule();
          }}
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Schedule Name
            </label>

            <input
              type="text"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              placeholder="e.g. Morning Feeding"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Feeding Time
            </label>

            <input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold text-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Frequency
            </label>

            <select
              value={scheduleFrequency}
              onChange={(e) => setScheduleFrequency(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-amber-500 bg-white"
            >
              <option value="Daily">Daily</option>

              <option value="Weekdays">Weekdays</option>

              <option value="Weekends">Weekends</option>

              <option value="Weekly">Weekly</option>
            </select>
          </div>

          <div className="pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={savingSchedule}
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-200 hover:-translate-y-0.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-60"
            >
              {savingSchedule ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
