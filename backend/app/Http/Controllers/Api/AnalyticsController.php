<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $predictiveData = $request->user()->predictiveData()->orderBy('id')->get();

        return response()->json([
            'predictiveData' => $predictiveData,
        ]);
    }
}
