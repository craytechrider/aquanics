<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    public function index(Request $request)
    {
        $rules = $request->user()->automationRules()->orderBy('created_at', 'desc')->get();
        $schedules = $request->user()->feedingSchedules()->get();

        return response()->json([
            'rules' => $rules,
            'schedules' => $schedules,
        ]);
    }

    public function storeRule(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'sensor' => 'nullable|string',
            'condition_operator' => 'nullable|string',
            'condition_value' => 'nullable|numeric',
            'action' => 'required|string',
        ]);

        $conditionText = '';
        if ($request->sensor && $request->condition_operator && $request->condition_value !== null) {
            $op = $request->condition_operator === 'Greater than' ? '>' : ($request->condition_operator === 'Less than' ? '<' : '=');
            $conditionText = "If {$request->sensor} {$op} {$request->condition_value}";
        }

        $rule = $request->user()->automationRules()->create([
            'name' => $request->name,
            'sensor' => $request->sensor,
            'condition_operator' => $request->condition_operator,
            'condition_value' => $request->condition_value,
            'condition_text' => $conditionText ?: $request->condition_text ?? '',
            'action' => $request->action,
            'active' => true,
        ]);

        return response()->json($rule, 201);
    }

    public function toggleRule(Request $request, $id)
    {
        $rule = $request->user()->automationRules()->findOrFail($id);
        $rule->update(['active' => !$rule->active]);

        return response()->json($rule);
    }

    public function deleteRule(Request $request, $id)
    {
        $rule = $request->user()->automationRules()->findOrFail($id);
        $rule->delete();

        return response()->json(['message' => 'Rule deleted']);
    }

    public function updateSchedule(Request $request, $id)
    {
        $schedule = $request->user()->feedingSchedules()->findOrFail($id);

        $request->validate([
            'time' => 'sometimes|date_format:H:i',
            'active' => 'sometimes|boolean',
            'species' => 'sometimes|string',
            'fish_age_weeks' => 'sometimes|integer',
        ]);

        $schedule->update($request->only(['time', 'active', 'species', 'fish_age_weeks']));

        return response()->json($schedule);
    }
}
