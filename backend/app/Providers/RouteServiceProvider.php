<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

class RouteServiceProvider extends ServiceProvider
{
    public const HOME = '/home';

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            $email = Str::lower((string) $request->input('email'));

            return [
                Limit::perMinute(5)->by($request->ip() . '|' . $email),
                Limit::perMinute(20)->by($request->ip()),
            ];
        });

        RateLimiter::for('otp', function (Request $request) {
            $userId = $request->user()?->id;

            return $userId
                ? Limit::perMinute(6)->by('otp-user:' . $userId)
                : Limit::perMinute(3)->by('otp-ip:' . $request->ip());
        });

        RateLimiter::for('password-recovery', function (Request $request) {
            $email = Str::lower((string) $request->input('email'));

            return [
                Limit::perMinute(5)->by('recovery:' . $request->ip() . '|' . $email),
                Limit::perMinute(10)->by('recovery-ip:' . $request->ip()),
            ];
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}