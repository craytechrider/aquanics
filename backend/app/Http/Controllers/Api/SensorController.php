<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SensorController extends Controller
{
    public function index(Request $request)
    {
        $sensors = $request->user()->sensors->mapWithKeys(function ($sensor) {
            return [$sensor->key => [
                'id' => $sensor->id,
                'key' => $sensor->key,
                'name' => $sensor->name,
                'value' => $sensor->value,
                'unit' => $sensor->unit,
                'status' => $sensor->status,
                'trend' => $sensor->trend,
                'history' => $sensor->history,
            ]];
        });

        return response()->json($sensors);
    }

    public function update(Request $request, $id)
    {
        $sensor = $request->user()->sensors()->findOrFail($id);

        $request->validate([
            'value' => 'sometimes|numeric',
            'status' => 'sometimes|string',
            'trend' => 'sometimes|string',
        ]);

        $sensor->update($request->only(['value', 'status', 'trend']));

        // Add to history
        if ($request->has('value')) {
            $history = $sensor->history ?? [];
            $history[] = $request->value;
            if (count($history) > 7) {
                $history = array_slice($history, -7);
            }
            $sensor->update(['history' => array_values($history)]);
        }

        return response()->json($sensor);
    }
}
