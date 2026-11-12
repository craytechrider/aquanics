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
        $request->validate([
            'name' => 'required|string',
            'type' => 'sometimes|string|in:PDF,CSV',
        ]);

        $report = $request->user()->reports()->create([
            'name' => $request->name,
            'date_label' => now()->format('M Y'),
            'size' => '0.1 MB',
            'type' => $request->type ?? 'PDF',
        ]);

        return response()->json($report, 201);
    }
}
