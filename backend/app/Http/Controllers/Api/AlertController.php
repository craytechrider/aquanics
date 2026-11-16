<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\AlertRecipient;
use Illuminate\Http\Request;

class AlertController extends Controller
{
    /**
     * Get the latest alerts for the authenticated user.
     */
    public function index(Request $request)
    {
        $alerts = AlertRecipient::query()
            ->with('alert')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->limit(50)
            ->get()
            ->map(function (AlertRecipient $recipient): array {
                $alert = $recipient->alert->toArray();
                $alert['is_read'] = $recipient->is_read;

                return $alert;
            });

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
        $recipient = AlertRecipient::query()
            ->where('alert_id', $alert->id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $recipient->update([
            'is_read' => true,
        ]);

        return response()->json([
            'message' => 'Alert marked as read',
            'alert' => array_merge($alert->toArray(), ['is_read' => true]),
        ]);
    }
}
