<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $sensors = $user->sensors->mapWithKeys(function ($sensor) {
            return [$sensor->key => [
                'value' => $sensor->value,
                'status' => $sensor->status,
                'trend' => $sensor->trend,
                'history' => $sensor->history,
            ]];
        });

        $devices = $user->systemDevices->mapWithKeys(function ($device) {
            return [$device->key => [
                'id' => $device->id,
                'name' => $device->name,
                'isOn' => $device->is_on,
                'mode' => $device->mode,
                'schedule' => $device->schedule,
                'lastFed' => $device->last_fed,
                'nextFeed' => $device->next_feed,
            ]];
        });

        $alerts = $user->alerts()->latest()->limit(5)->get()->map(function ($alert) {
            return [
                'id' => $alert->id,
                'title' => $alert->title,
                'message' => $alert->message,
                'severity' => $alert->severity,
                'time' => $alert->created_at->diffForHumans(),
            ];
        });

        return response()->json([
            'sensors' => $sensors,
            'devices' => $devices,
            'alerts' => $alerts,
        ]);
    }

    public function toggleDevice(Request $request, $id)
    {
        $device = $request->user()->systemDevices()->findOrFail($id);
        $device->update(['is_on' => !$device->is_on]);

        return response()->json([
            'id' => $device->id,
            'isOn' => $device->is_on,
        ]);
    }
}
