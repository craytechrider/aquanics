<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $reports = $request->user()->reports()->orderBy('created_at', 'desc')->get();

        return response()->json($reports);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date_label' => 'required|string|max:255',
            'size' => 'sometimes|string|max:32',
            'type' => 'sometimes|string|in:PDF,CSV',
        ]);

        $report = $request->user()->reports()->create([
            'name' => $validated['name'],
            'date_label' => $validated['date_label'],
            'size' => $validated['size'] ?? '0 MB',
            'type' => $validated['type'] ?? 'PDF',
        ]);

        return response()->json($report, 201);
    }
}
