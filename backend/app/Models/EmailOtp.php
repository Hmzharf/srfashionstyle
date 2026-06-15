<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class EmailOtp extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'purpose',
        'code_hash',
        'attempt_count',
        'expires_at',
        'last_sent_at',
        'verified_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'last_sent_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at instanceof Carbon
            ? $this->expires_at->isPast()
            : now()->gt($this->expires_at);
    }

    public function isUsed(): bool
    {
        return !is_null($this->verified_at);
    }

    public function isActive(): bool
    {
        return !$this->isUsed() && !$this->isExpired();
    }

    public function isResendAllowed(int $cooldownSeconds = 60): bool
    {
        if (!$this->last_sent_at) {
            return true;
        }

        return $this->last_sent_at->copy()->addSeconds($cooldownSeconds)->isPast();
    }

    public function hasExceededAttempts(int $maxAttempts = 5): bool
    {
        return $this->attempt_count >= $maxAttempts;
    }
}