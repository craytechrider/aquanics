<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Sensor;
use App\Models\SystemDevice;
use App\Models\Alert;
use App\Models\AutomationRule;
use App\Models\Report;
use App\Models\IotDevice;
use App\Models\ActivityLog;
use App\Models\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    /**
     * Log an admin activity.
     */
    private function logActivity(Request $request, string $activity, string $type = 'View', string $status = 'Success', ?string $details = null): void
    {
        ActivityLog::create([
            'user_id'    => $request->user()?->id,
            'activity'   => $activity,
            'type'       => $type,
            'status'     => $status,
            'ip_address' => $request->ip(),
            'details'    => $details,
        ]);
    }

    /**
     * Admin dashboard overview – aggregated stats across all users.
     */
    public function dashboard(Request $request)
    {
        // ============================================================
        // BASIC SYSTEM COUNTS
        // ============================================================

        $totalUsers = User::count();

        $totalSensors = Sensor::count();

        $totalDevices = SystemDevice::count();

        $totalAlerts = Alert::count();

        $activeDevices = SystemDevice::where('is_on', true)->count();

        $criticalAlerts = Alert::where('severity', 'critical')->count();

        $warningAlerts = Alert::where('severity', 'warning')->count();


        // ============================================================
        // SENSOR STATUS
        // ============================================================

        $safeSensors = Sensor::where('status', 'safe')->count();

        $warningSensors = Sensor::where('status', 'warning')->count();

        $criticalSensors = Sensor::where('status', 'critical')->count();


        // ============================================================
        // SYSTEM HEALTH
        // ============================================================

        /*
     * Sensor health
     *
     * If there are no sensors yet, consider the sensor portion
     * healthy instead of dividing by zero.
     */
        if ($totalSensors > 0) {
            $sensorHealth = ($safeSensors / $totalSensors) * 100;
        } else {
            $sensorHealth = 100;
        }


        /*
     * Device health
     *
     * If there are no devices yet, consider the device portion
     * healthy instead of dividing by zero.
     */
        if ($totalDevices > 0) {
            $deviceHealth = ($activeDevices / $totalDevices) * 100;
        } else {
            $deviceHealth = 100;
        }


        /*
     * Alert health
     *
     * Critical alerts reduce health more than warnings.
     */
        $alertHealth = 100;

        $alertHealth -= ($criticalAlerts * 10);

        $alertHealth -= ($warningAlerts * 3);

        $alertHealth = max(
            0,
            min(100, $alertHealth)
        );


        /*
     * Overall system health
     *
     * Sensor health  = 50%
     * Device health  = 30%
     * Alert health   = 20%
     */
        $systemHealth =
            ($sensorHealth * 0.50) +
            ($deviceHealth * 0.30) +
            ($alertHealth * 0.20);

        $systemHealth = round(
            max(0, min(100, $systemHealth))
        );


        // ============================================================
        // RECENT USERS
        // ============================================================

        $recentUsers = User::latest()
            ->take(10)
            ->get([
                'id',
                'name',
                'email',
                'role',
                'created_at'
            ]);


        // ============================================================
        // RECENT ALERTS
        // ============================================================

        $recentAlerts = Alert::with('user:id,name')
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'title' => $a->title,
                    'message' => $a->message,
                    'severity' => $a->severity,
                    'user' => $a->user->name ?? 'Unknown',
                    'time' => $a->created_at->diffForHumans(),
                ];
            });


        // ============================================================
        // SENSOR STATUS BREAKDOWN
        // ============================================================

        $sensorStatus = [
            'safe' => $safeSensors,
            'warning' => $warningSensors,
            'critical' => $criticalSensors,
        ];


        // ============================================================
        // USER ROLE DISTRIBUTION
        // ============================================================

        $roleDistribution = User::select(
            'role',
            DB::raw('count(*) as count')
        )
            ->groupBy('role')
            ->pluck('count', 'role');


        // ============================================================
        // RESPONSE
        // ============================================================

        return response()->json([
            'stats' => [
                'totalUsers' => $totalUsers,
                'totalSensors' => $totalSensors,
                'totalDevices' => $totalDevices,
                'activeDevices' => $activeDevices,
                'totalAlerts' => $totalAlerts,
                'criticalAlerts' => $criticalAlerts,
                'warningAlerts' => $warningAlerts,

                // Calculated from actual database data
                'systemHealth' => $systemHealth,

                // Optional detailed health values
                'sensorHealth' => round($sensorHealth),
                'deviceHealth' => round($deviceHealth),
                'alertHealth' => round($alertHealth),
            ],

            'recentUsers' => $recentUsers,

            'recentAlerts' => $recentAlerts,

            'sensorStatus' => $sensorStatus,

            'roleDistribution' => $roleDistribution,
        ]);
    }

    /* ─── USER MANAGEMENT ────────────────────────────────────────── */

    public function users(Request $request)
    {
        $query = User::query();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->input('role')) {
            $query->where('role', $role);
        }

        $users = $query->latest()
            ->get()
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role,
                'phone'      => $u->phone,
                'avatar'     => $u->avatar,
                'sensors'    => $u->sensors()->count(),
                'devices'    => $u->systemDevices()->count(),
                'created_at' => $u->created_at->toDateString(),
            ]);

        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:Admin,Farmer,Technician',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'phone'    => $request->phone,
        ]);

        $this->logActivity($request, "Created user: {$user->name} ({$user->role})", 'User Creation');

        return response()->json($user, 201);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role'  => 'sometimes|in:Admin,Farmer,Technician',
            'phone' => 'sometimes|nullable|string',
        ]);

        $user->update($request->only(['name', 'email', 'role', 'phone']));

        if ($request->filled('password')) {
            $user->update(['password' => Hash::make($request->password)]);
        }

        $this->logActivity($request, "Updated user: {$user->name}", 'Modified');

        return response()->json($user);
    }

    public function deleteUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // Don't delete yourself
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 403);
        }

        $this->logActivity($request, "Deleted user: {$user->name} ({$user->email})", 'Modified');

        $user->delete();

        return response()->json(['message' => 'User deleted']);
    }

    /* ─── SENSOR MANAGEMENT ──────────────────────────────────────── */

    public function sensors(Request $request)
    {
        $query = Sensor::with('user:id,name');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $sensors = $query->latest()
            ->get()
            ->map(fn($s) => [
                'id'     => $s->id,
                'key'    => $s->key,
                'name'   => $s->name,
                'value'  => $s->value,
                'unit'   => $s->unit,
                'status' => $s->status,
                'trend'  => $s->trend,
                'user'   => $s->user->name ?? 'N/A',
                'userId' => $s->user_id,
            ]);

        return response()->json($sensors);
    }

    public function updateSensor(Request $request, $id)
    {
        $sensor = Sensor::findOrFail($id);

        $request->validate([
            'name'   => 'sometimes|string',
            'value'  => 'sometimes|numeric',
            'status' => 'sometimes|in:safe,warning,critical',
            'trend'  => 'sometimes|in:up,down,stable',
        ]);

        $sensor->update($request->only(['name', 'value', 'status', 'trend']));

        $this->logActivity($request, "Updated sensor: {$sensor->name}", 'Modified');

        return response()->json($sensor);
    }

    /* ─── DEVICE MANAGEMENT ──────────────────────────────────────── */

    public function devices(Request $request)
    {
        $query = SystemDevice::with('user:id,name');

        if ($search = $request->input('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $devices = $query->latest()
            ->get()
            ->map(fn($d) => [
                'id'       => $d->id,
                'key'      => $d->key,
                'name'     => $d->name,
                'isOn'     => $d->is_on,
                'mode'     => $d->mode,
                'schedule' => $d->schedule,
                'user'     => $d->user->name ?? 'N/A',
                'userId'   => $d->user_id,
            ]);

        return response()->json($devices);
    }

    public function toggleDevice(Request $request, $id)
    {
        $device = SystemDevice::findOrFail($id);
        $device->update(['is_on' => !$device->is_on]);

        $state = $device->is_on ? 'ON' : 'OFF';
        $this->logActivity($request, "Toggled device: {$device->name} → {$state}", 'Modified');

        return response()->json([
            'id'   => $device->id,
            'isOn' => $device->is_on,
        ]);
    }


    /**
     * Record an approved public guest activity.
     */
    public function logGuestActivity(Request $request)
    {
        $validated = $request->validate([
            'activity' => [
                'required',
                'string',
                'in:Viewed Home Page,Viewed Public Guide,Viewed Public Information,Attempted Admin Access',
            ],
            'details' => ['nullable', 'string', 'max:500'],
        ]);

        $isDenied = $validated['activity'] === 'Attempted Admin Access';

        ActivityLog::create([
            'user_id'    => null,
            'activity'   => $validated['activity'],
            'type'       => $isDenied ? 'Security' : 'View',
            'status'     => $isDenied ? 'Denied' : 'Success',
            'ip_address' => $request->ip(),
            'details'    => $validated['details'] ?? 'Guest visitor',
        ]);

        return response()->json([
            'message' => 'Guest activity recorded successfully.',
        ], 201);
    }


    /* ─── ALERTS MANAGEMENT ──────────────────────────────────────── */

    public function alerts(Request $request)
    {
        $query = Alert::with('user:id,name');

        if ($severity = $request->input('severity')) {
            $query->where('severity', $severity);
        }

        $alerts = $query->latest()
            ->take(50)
            ->get()
            ->map(fn($a) => [
                'id'       => $a->id,
                'title'    => $a->title,
                'message'  => $a->message,
                'severity' => $a->severity,
                'user'     => $a->user->name ?? 'Unknown',
                'userId'   => $a->user_id,
                'time'     => $a->created_at->diffForHumans(),
                'read'     => $a->is_read,
            ]);

        return response()->json($alerts);
    }

    public function deleteAlert(Request $request, $id)
    {
        $alert = Alert::findOrFail($id);
        $this->logActivity($request, "Deleted alert: {$alert->title}", 'Modified');
        $alert->delete();

        return response()->json(['message' => 'Alert deleted']);
    }

    /* ─── ACTIVITY LOGS ──────────────────────────────────────────── */


    /**
     * Return paginated activity logs for the admin page.
     */

    public function activityLogs(Request $request)
    {
        $request->validate([
            'type'     => 'nullable|string|max:50',
            'status'   => 'nullable|string|max:50',
            'per_page' => 'nullable|integer|min:1|max:100',
            'page'     => 'nullable|integer|min:1',
        ]);

        $query = ActivityLog::with('user:id,name,email');

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $logs = $query
            ->latest()
            ->paginate($request->integer('per_page', 20))
            ->through(function ($log) {
                return [
                    'id'        => $log->id,
                    'time'      => $log->created_at
                        ? $log->created_at->format('M d, H:i')
                        : '-',
                    'userName'  => $log->user_id
                        ? ($log->user?->name ?? 'Unknown User')
                        : 'Guest',
                    'userEmail' => $log->user_id
                        ? ($log->user?->email ?? '-')
                        : '-',
                    'activity'  => $log->activity,
                    'type'      => $log->type,
                    'status'    => $log->status,
                    'ip'        => $log->ip_address,
                    'details'   => $log->details,
                ];
            });

        // Count all matching activity records, not just the current page.
        $stats = [
            'total_site_views' => ActivityLog::where(
                'activity',
                'Viewed Home Page'
            )->count(),

            'guest_visits' => ActivityLog::whereNull('user_id')
                ->where('activity', 'Viewed Home Page')
                ->count(),

            'registered_logins' => ActivityLog::where(
                'activity',
                'Logged into System'
            )
                ->whereNotNull('user_id')
                ->where('status', 'Success')
                ->count(),

            'security_alerts' => ActivityLog::where(
                'status',
                'Denied'
            )->count(),
        ];

        $response = $logs->toArray();
        $response['stats'] = $stats;

        return response()->json($response);
    }


    /* ─── SYSTEM SETTINGS ────────────────────────────────────────── */

    public function getSettings()
    {
        $settings = SystemSetting::allGrouped();

        // Provide defaults for first load
        $defaults = [
            'general' => [
                'systemName'          => 'AQUAPONICS System',
                'systemVersion'       => 'v2.1.0',
                'installDate'         => 'February 15, 2026',
                'systemStatus'        => 'Operational',
                'description'         => 'IoT-based smart aquaponics monitoring and management system with real-time sensor data collection, analytics, and automated alerts.',
                'enableNotifications' => 'true',
                'enableDataLogging'   => 'true',
            ],
            'monitoring' => [
                'sensorInterval'  => '30',
                'dataRetention'   => '90',
                'autoCalibrate'   => 'true',
                'temperatureUnit' => 'Celsius',
                'phThreshold'     => '7.0',
                'doThreshold'     => '5.0',
            ],
            'alerts' => [
                'emailAlerts'    => 'true',
                'smsAlerts'      => 'false',
                'criticalOnly'   => 'false',
                'alertFrequency' => 'immediate',
                'emailRecipient' => 'admin@aquaponics.com',
                'maxAlertsPerDay' => '50',
            ],
            'security' => [
                'sessionTimeout' => '30',
                'requireMFA'     => 'false',
                'passwordExpiry' => '90',
                'loginAttempts'  => '5',
                'ipWhitelist'    => '',
                'auditLogging'   => 'true',
            ],
        ];

        // Merge defaults with saved values
        foreach ($defaults as $group => $keys) {
            foreach ($keys as $key => $default) {
                if (!isset($settings[$group][$key])) {
                    $settings[$group][$key] = $default;
                }
            }
        }

        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'group'    => 'required|string|in:general,monitoring,alerts,security',
            'settings' => 'required|array',
        ]);

        $group = $request->input('group');
        $items = $request->input('settings');

        foreach ($items as $key => $value) {
            SystemSetting::set($group, $key, is_bool($value) ? ($value ? 'true' : 'false') : (string) $value);
        }

        $this->logActivity($request, "Updated {$group} settings", 'Modified');

        return response()->json(['message' => 'Settings saved successfully']);
    }
}
