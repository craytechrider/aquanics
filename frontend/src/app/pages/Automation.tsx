import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Toggle } from '../components/ui/Toggle';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Clock, Plus, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Automation() {
  const [schedules, setSchedules] = useState([
    { id: 1, time: "08:00", amount: "50g", type: "Slow Sinking", active: true },
    { id: 2, time: "16:00", amount: "50g", type: "Slow Sinking", active: true },
  ]);

  const [rules, setRules] = useState([
    { id: 1, trigger: "Water Temp > 28°C", action: "Turn on Cooling Fan", active: true },
    { id: 2, trigger: "Water Level < 50%", action: "Send Alert to Farmer", active: true },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Automation</h2>
        <p className="text-slate-500">Configure smart schedules and triggers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feeding Schedule */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Smart Feeding</CardTitle>
              <CardDescription>Automated fish feeding schedule</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Time
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-cyan-100 p-2 rounded-full text-cyan-600">
                    <Clock size={20} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">{schedule.time}</div>
                    <div className="text-xs text-slate-500">{schedule.amount} • {schedule.type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Toggle isOn={schedule.active} onToggle={() => {
                    setSchedules(schedules.map(s => s.id === schedule.id ? { ...s, active: !s.active } : s));
                  }} />
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Automation Rules */}
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Rules Builder</CardTitle>
              <CardDescription>If This Then That logic for sensors</CardDescription>
            </div>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" /> New Rule
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 border border-slate-100 rounded-lg bg-white shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700">Rule #{rule.id}</Badge>
                  <Toggle isOn={rule.active} onToggle={() => {
                     setRules(rules.map(r => r.id === rule.id ? { ...r, active: !r.active } : r));
                  }} activeColor="bg-cyan-500" />
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-md border border-orange-100">
                    {rule.trigger}
                  </div>
                  <ArrowRight size={16} className="text-slate-400" />
                  <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md border border-blue-100">
                    {rule.action}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Feeding Time">
        <div className="space-y-4">
          <div>
             <label className="text-sm font-medium text-slate-700">Time</label>
             <Input type="time" className="mt-1" />
          </div>
          <div>
             <label className="text-sm font-medium text-slate-700">Amount (grams)</label>
             <Input type="number" placeholder="50" className="mt-1" />
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsModalOpen(false)}>Save Schedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
