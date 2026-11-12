<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Get the latest alerts for the authenticated user.
     */
    public function index(Request $request)
    {
        $alerts = Alert::query()
            ->where(function ($query) use ($request) {
                $query->whereNull('user_id')
                    ->orWhere(
                        'user_id',
                        $request->user()->id
                    );
            })
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'alerts' => $alerts,
        ]);
    }

    /**
     * Mark an alert as read.
     */
    public function markRead(
        Request $request,
        Alert $alert
    ) {
        if (
            $alert->user_id !== null &&
            $alert->user_id !== $request->user()->id
        ) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        $alert->update([
            'is_read' => true,
        ]);

        return response()->json([
            'message' => 'Alert marked as read',
            'alert' => $alert,
        ]);
    }
}
