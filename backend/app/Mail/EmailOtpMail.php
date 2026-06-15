<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmailOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $code;
    public string $name;

    public function __construct(string $code, string $name = 'User')
    {
        $this->code = $code;
        $this->name = $name;
    }

    public function build()
    {
        return $this->subject('Kode Verifikasi Email')
            ->html("
                <div style='font-family:Arial,sans-serif;line-height:1.6;color:#222'>
                    <h2>Verifikasi Email</h2>
                    <p>Halo, {$this->name}</p>
                    <p>Gunakan kode OTP berikut untuk verifikasi email akun kamu:</p>
                    <div style='font-size:32px;font-weight:700;letter-spacing:8px;margin:20px 0;color:#0f766e'>
                        {$this->code}
                    </div>
                    <p>Kode ini berlaku selama 10 menit dan hanya bisa digunakan satu kali.</p>
                </div>
            ");
    }
}