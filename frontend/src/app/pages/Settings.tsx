import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Toggle } from "../components/ui/Toggle";
import { Badge } from "../components/ui/Badge";
import { User, Bell, Radio, Wifi, Shield } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          Settings
        </h2>
        <Badge variant="outline" className="text-slate-500">
          v1.2.0
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <User className="w-5 h-5 text-cyan-500" />
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    First Name
                  </label>
                  <Input placeholder="John" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Last Name
                  </label>
                  <Input placeholder="Doe" className="mt-1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end pt-4">
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Wifi className="w-5 h-5 text-cyan-500" />
              <CardTitle>Device Pairing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 text-green-600 rounded-full">
                    <Radio size={20} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      ESP32 Main Controller
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      Connected (Signal: Strong)
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
              <Button
                className="w-full border-dashed border-2 bg-slate-50 hover:bg-slate-100 text-slate-500"
                variant="outline"
              >
                + Add New IoT Device
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Push Notifications
                </span>
                <Toggle isOn={true} onToggle={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  Email Alerts
                </span>
                <Toggle isOn={false} onToggle={() => {}} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  SMS Alerts (Critical)
                </span>
                <Toggle
                  isOn={true}
                  onToggle={() => {}}
                  activeColor="bg-red-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <CardTitle>Role Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-3 bg-purple-50 text-purple-900 rounded-lg text-sm border border-purple-100">
                Current Role: <strong>Farmer (Owner)</strong>
              </div>
              <p className="text-xs text-slate-500">
                You have full access to automation and settings.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
