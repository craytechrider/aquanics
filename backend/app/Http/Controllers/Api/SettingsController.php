<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $iotDevices = $user->iotDevices()->get()->map(function ($device) {
            return [
                'id' => $device->id,
                'name' => $device->name,
                'device_id' => $device->device_id,
                'status' => $device->status,
                'last_active' => $device->last_active ? $device->last_active->diffForHumans() : 'Never',
            ];
        });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone ?? '',
                'avatar' => $user->avatar ?? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
                'email_alerts' => (bool) $user->email_alerts,
                'sms_alerts' => (bool) $user->sms_alerts,
                'weekly_reports' => (bool) $user->weekly_reports,
            ],
            'iotDevices' => $iotDevices,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'phone' => 'sometimes|nullable|string',
            'avatar' => 'sometimes|nullable',
        ]);

        $data = $request->only(['name', 'email', 'phone']);

        if ($request->hasFile('avatar')) {
            $request->validate([
                'avatar' => 'image|max:800',
            ]);
            $file = $request->file('avatar');
            $mime = $file->getMimeType();
            $contents = base64_encode(file_get_contents($file->getRealPath()));
            $data['avatar'] = "data:{$mime};base64,{$contents}";
        } elseif ($request->filled('avatar')) {
            $data['avatar'] = $request->input('avatar');
        }

        $user->update($data);

        return response()->json($user);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => $request->new_password]);

        return response()->json(['message' => 'Password updated successfully.']);
    }

    public function addDevice(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'device_id' => 'required|string|unique:iot_devices,device_id',
        ]);

        $device = $request->user()->iotDevices()->create([
            'name' => $request->name,
            'device_id' => $request->device_id,
            'status' => 'online',
            'last_active' => now(),
        ]);

        return response()->json([
            'id' => $device->id,
            'name' => $device->name,
            'device_id' => $device->device_id,
            'status' => $device->status,
            'last_active' => 'just now',
        ], 201);
    }
    public function updateNotifications(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'email_alerts' => 'sometimes|boolean',
            'sms_alerts' => 'sometimes|boolean',
            'weekly_reports' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Notification preferences saved successfully.',
            'notifications' => [
                'email_alerts' => (bool) $user->email_alerts,
                'sms_alerts' => (bool) $user->sms_alerts,
                'weekly_reports' => (bool) $user->weekly_reports,
            ],
        ]);
    }

    public function savePushToken(Request $request)
    {
        $request->validate([
            'token' => 'required|string|max:512',
            'device_name' => 'nullable|string|max:255',
        ]);

        $user = $request->user();

        $pushToken = $user->pushTokens()->updateOrCreate(
            [
                'token' => $request->token,
            ],
            [
                'device_name' => $request->device_name
                    ?? 'Aquanics Web',
            ]
        );

        return response()->json([
            'message' => 'Push notification token saved successfully.',
            'pushToken' => [
                'id' => $pushToken->id,
                'device_name' => $pushToken->device_name,
            ],
        ]);
    }
}
