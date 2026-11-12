<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->frontendRedirect('google_config');
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'email', 'profile'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        if ($request->filled('error')) {
            return $this->frontendRedirect(
                $request->input('error') === 'access_denied'
                    ? 'google_cancelled'
                    : 'google_failed'
            );
        }

        if (! $this->isConfigured()) {
            return $this->frontendRedirect('google_config');
        }

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (InvalidStateException) {
            return $this->frontendRedirect('google_failed');
        } catch (Throwable $exception) {
            Log::warning('Google OAuth callback failed.', [
                'exception' => $exception::class,
            ]);

            return $this->frontendRedirect('google_failed');
        }

        $email = $googleUser->getEmail();
        $googleId = $googleUser->getId();
        $verified = ($googleUser->user['verified_email'] ?? false) === true;

        if (! $email || ! $googleId) {
            return $this->frontendRedirect('google_email_missing');
        }

        if (! $verified) {
            return $this->frontendRedirect('google_unverified');
        }

        try {
            $user = DB::transaction(function () use ($email, $googleId, $googleUser) {
                $account = User::where('google_id', $googleId)->first();

                if ($account && strcasecmp($account->email, $email) !== 0) {
                    throw new GoogleAccountConflictException;
                }

                if (! $account) {
                    $account = User::whereRaw('LOWER(email) = ?', [mb_strtolower($email)])->first();
                }

                if (! $account) {
                    throw new GoogleAccountNotFoundException;
                }

                if ($account->google_id && $account->google_id !== $googleId) {
                    throw new GoogleAccountConflictException;
                }

                if (! $account->is_active) {
                    throw new InactiveGoogleAccountException;
                }

                $updates = ['google_id' => $googleId];
                if (! $account->avatar && $googleUser->getAvatar()) {
                    $updates['avatar'] = $googleUser->getAvatar();
                }
                $account->forceFill($updates)->save();

                return $account;
            });
        } catch (GoogleAccountNotFoundException) {
            return $this->frontendRedirect('google_account_not_found');
        } catch (GoogleAccountConflictException) {
            return $this->frontendRedirect('google_account_conflict');
        } catch (InactiveGoogleAccountException) {
            return $this->frontendRedirect('google_account_disabled');
        } catch (Throwable $exception) {
            Log::error('Google OAuth account processing failed.', [
                'exception' => $exception::class,
            ]);

            return $this->frontendRedirect('google_failed');
        }

        $exchangeCode = Str::random(64);
        try {
            $stored = Cache::add(
                $this->exchangeCacheKey($exchangeCode),
                $user->getKey(),
                now()->addMinutes(2),
            );
        } catch (Throwable $exception) {
            Log::error('Google OAuth exchange code could not be stored.', [
                'exception' => $exception::class,
            ]);

            return $this->frontendRedirect('google_failed');
        }

        if (! $stored) {
            Log::error('Google OAuth exchange code collision occurred.');

            return $this->frontendRedirect('google_failed');
        }

        return $this->frontendRedirect(null, $exchangeCode);
    }

    public function exchange(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'size:64'],
        ]);

        $cacheKey = $this->exchangeCacheKey($validated['code']);
        try {
            $userId = Cache::lock($cacheKey.':lock', 5)->block(
                2,
                fn () => Cache::pull($cacheKey),
            );
        } catch (LockTimeoutException) {
            return response()->json([
                'message' => 'This Google sign-in link has expired or was already used. Please try again.',
            ], 422);
        }
        if (! $userId) {
            return response()->json([
                'message' => 'This Google sign-in link has expired or was already used. Please try again.',
            ], 422);
        }

        $user = User::find($userId);
        if (! $user || ! $user->is_active) {
            return response()->json([
                'message' => 'This account is unavailable. Contact your system administrator.',
            ], 403);
        }

        try {
            $token = DB::transaction(function () use ($user, $request) {
                $token = $user->createToken('auth-token')->plainTextToken;

                ActivityLog::create([
                    'user_id' => $user->id,
                    'activity' => 'Logged into System with Google',
                    'type' => 'Login',
                    'status' => 'Success',
                    'ip_address' => $request->ip(),
                ]);

                return $token;
            });
        } catch (Throwable $exception) {
            Log::error('Google OAuth token issuance failed.', [
                'exception' => $exception::class,
                'user_id' => $user->id,
            ]);

            return response()->json([
                'message' => 'Unable to complete sign-in. Please try again.',
            ], 500);
        }

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    private function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect'));
    }

    private function frontendRedirect(?string $error = null, ?string $code = null): RedirectResponse
    {
        $query = array_filter([
            'oauth_error' => $error,
            'oauth_code' => $code,
        ]);

        return redirect()->away(
            rtrim((string) config('services.frontend_url'), '/').'/login?'.http_build_query($query)
        );
    }

    private function exchangeCacheKey(string $code): string
    {
        return 'google-oauth-exchange:'.hash('sha256', $code);
    }
}

class GoogleAccountConflictException extends \RuntimeException {}

class GoogleAccountNotFoundException extends \RuntimeException {}

class InactiveGoogleAccountException extends \RuntimeException {}
