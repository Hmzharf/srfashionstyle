<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\EmailOtpMail;
use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $throttleKey = 'register:' . Str::lower($request->email) . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return response()->json([
                'message' => 'Terlalu banyak percobaan register. Silakan coba lagi beberapa saat.',
            ], 429);
        }

        RateLimiter::hit($throttleKey, 60);

        $user = User::create([
            'name' => $request->name,
            'email' => Str::lower($request->email),
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => 'customer',
            'email_verified_at' => null,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        $this->issueEmailOtp($user);

        return response()->json([
            'message' => 'Register berhasil. Kode OTP verifikasi telah dikirim ke email.',
            'token' => $token,
            'user' => $user->fresh(),
            'requires_email_verification' => true,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $email = Str::lower($request->email);
        $throttleKey = 'login:' . $email . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return response()->json([
                'message' => 'Terlalu banyak percobaan login. Silakan coba lagi beberapa saat.',
            ], 429);
        }

        $user = User::where('email', $email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        // Jika email belum terverifikasi, izinkan token tapi tandai perlu verifikasi
        if (is_null($user->email_verified_at)) {
            $user->tokens()->delete();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Email belum diverifikasi.',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'email_verified_at' => $user->email_verified_at,
                    'requires_email_verification' => true,
                ],
                'requires_email_verification' => true,
            ], 403);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'email_verified_at' => $user->email_verified_at,
                'requires_email_verification' => false,
            ],
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $email = Str::lower($request->email);
        $throttleKey = 'forgot-password:' . $email . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            return response()->json([
                'message' => 'Terlalu banyak percobaan. Silakan coba lagi beberapa saat.',
            ], 429);
        }

        RateLimiter::hit($throttleKey, 60);

        Password::sendResetLink([
            'email' => $email,
        ]);

        return response()->json([
            'message' => 'Jika email terdaftar, link reset password telah dikirim.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            [
                'email' => Str::lower($request->email),
                'password' => $request->password,
                'password_confirmation' => $request->password_confirmation,
                'token' => $request->token,
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'message' => 'Password berhasil direset.',
        ]);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required'],
            'new_password' => ['required', 'confirmed', 'min:8', 'different:current_password'],
        ]);

        $user = $request->user();

        if (!$user || !Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Password saat ini tidak sesuai.',
            ], 422);
        }

        $user->password = Hash::make($request->new_password);
        $user->setRememberToken(Str::random(60));
        $user->save();

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }

    public function sendEmailOtp(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 401);
        }

        if (!is_null($user->email_verified_at)) {
            return response()->json([
                'message' => 'Email sudah terverifikasi.',
            ], 422);
        }

        $throttleKey = 'send-email-otp:' . $user->id . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, 3)) {
            return response()->json([
                'message' => 'Terlalu banyak permintaan OTP. Coba lagi nanti.',
            ], 429);
        }

        $existing = EmailOtp::where('email', $user->email)
            ->where('purpose', 'verify_email')
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if ($existing && !$existing->isResendAllowed(60)) {
            return response()->json([
                'message' => 'Tunggu 60 detik sebelum meminta OTP baru.',
            ], 429);
        }

        $this->issueEmailOtp($user);
        RateLimiter::hit($throttleKey, 60);

        return response()->json([
            'message' => 'OTP verifikasi berhasil dikirim ke email.',
        ]);
    }

    public function resendEmailOtp(Request $request)
    {
        return $this->sendEmailOtp($request);
    }

public function verifyEmailOtp(Request $request)
{
    $request->validate([
        'code' => ['required', 'digits:6'],
    ]);

    $user = $request->user();

    if (!$user) {
        return response()->json([
            'message' => 'Unauthorized.',
        ], 401);
    }

    if (!is_null($user->email_verified_at)) {
        return response()->json([
            'message' => 'Email sudah terverifikasi.',
        ], 422);
    }

    $otp = EmailOtp::where('email', $user->email)
        ->where('purpose', 'verify_email')
        ->whereNull('verified_at')
        ->latest()
        ->first();

    if (!$otp) {
        return response()->json([
            'message' => 'OTP tidak ditemukan. Silakan minta kode baru.',
        ], 404);
    }

    if ($otp->isExpired()) {
        return response()->json([
            'message' => 'OTP sudah kedaluwarsa. Silakan minta kode baru.',
        ], 422);
    }

    if ($otp->attempt_count >= 5) {
        return response()->json([
            'message' => 'Terlalu banyak percobaan. Silakan minta kode baru.',
        ], 429);
    }

    if (!Hash::check($request->code, $otp->code_hash)) {
        $otp->increment('attempt_count');

        return response()->json([
            'message' => 'Kode OTP tidak valid.',
        ], 422);
    }

    DB::transaction(function () use ($user, $otp) {
        $otp->verified_at = now();
        $otp->save();

        $user->email_verified_at = now();
        $user->save();
    });

    return response()->json([
        'message' => 'Email berhasil diverifikasi.',
        'user' => $user->fresh(),
    ]);
}

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:10'],
        ]);

        $emailChanged = Str::lower($user->email) !== Str::lower($validated['email']);

        $user->update([
            ...$validated,
            'email' => Str::lower($validated['email']),
            'email_verified_at' => $emailChanged ? null : $user->email_verified_at,
        ]);

        if ($emailChanged) {
            $this->issueEmailOtp($user->fresh());
        }

        return response()->json([
            'message' => 'Profil berhasil diperbarui',
            'user' => $user->fresh(),
            'requires_email_verification' => is_null($user->fresh()->email_verified_at),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json([
            'message' => 'Logout berhasil',
        ]);
    }

    private function issueEmailOtp(User $user): void
    {
        $code = $this->generateOtpCode();

        DB::transaction(function () use ($user, $code) {
            EmailOtp::where('email', $user->email)
                ->where('purpose', 'verify_email')
                ->whereNull('verified_at')
                ->delete();

            EmailOtp::create([
                'user_id' => $user->id,
                'email' => $user->email,
                'purpose' => 'verify_email',
                'code_hash' => Hash::make($code),
                'attempt_count' => 0,
                'expires_at' => now()->addMinutes(10),
                'last_sent_at' => now(),
            ]);
        });

        Mail::to($user->email)->send(new EmailOtpMail($code, $user->name));
    }

    private function generateOtpCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }
}