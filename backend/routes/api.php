
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SensorController;
use App\Http\Controllers\Api\AutomationController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\AdminController;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/auth/google/exchange', [GoogleAuthController::class, 'exchange'])
    ->middleware('throttle:10,1');

Route::post(
    '/guest-activity',
    [AdminController::class, 'logGuestActivity']
)->middleware('throttle:30,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::patch('/devices/{id}/toggle', [DashboardController::class, 'toggleDevice']);

    // Sensors
    Route::get('/sensors', [SensorController::class, 'index']);
    Route::put('/sensors/{id}', [SensorController::class, 'update']);

    // Automation
    Route::get('/automation', [AutomationController::class, 'index']);
    Route::post('/automation/rules', [AutomationController::class, 'storeRule']);
    Route::patch('/automation/rules/{id}/toggle', [AutomationController::class, 'toggleRule']);
    Route::delete('/automation/rules/{id}', [AutomationController::class, 'deleteRule']);
    Route::put('/automation/schedules/{id}', [AutomationController::class, 'updateSchedule']);

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index']);

    // Reports
    Route::get('/reports', [ReportController::class, 'index']);
    Route::post('/reports', [ReportController::class, 'store']);

    // Settings
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::put('/settings/profile', [SettingsController::class, 'updateProfile']);
    Route::put('/settings/password', [SettingsController::class, 'changePassword']);
    Route::post('/settings/devices', [SettingsController::class, 'addDevice']);
    Route::put('/settings/notifications', [SettingsController::class, 'updateNotifications']);
    Route::post('/push-tokens', [SettingsController::class, 'savePushToken']);

    // Alerts
    Route::get('/alerts', [AlertController::class, 'index']);
    Route::patch('/alerts/{alert}/read', [AlertController::class, 'markRead']);

    // Admin routes
    Route::prefix('admin')->middleware('admin')->group(function () {

        Route::get('/dashboard', [AdminController::class, 'dashboard']);

        // User management
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'createUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}', [AdminController::class, 'deleteUser']);

        // Sensors
        Route::get('/sensors', [AdminController::class, 'sensors']);
        Route::put('/sensors/{id}', [AdminController::class, 'updateSensor']);

        // Devices
        Route::get('/devices', [AdminController::class, 'devices']);
        Route::patch('/devices/{id}/toggle', [AdminController::class, 'toggleDevice']);

        // Alerts
        Route::get('/alerts', [AdminController::class, 'alerts']);
        Route::delete('/alerts/{id}', [AdminController::class, 'deleteAlert']);

        // Activity logs
        Route::get('/activity-logs', [AdminController::class, 'activityLogs']);

        // System settings
        Route::get('/settings', [AdminController::class, 'getSettings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
    });
});
