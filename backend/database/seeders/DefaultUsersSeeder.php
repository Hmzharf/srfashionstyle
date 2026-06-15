<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DefaultUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'     => 'Owner Toko',
                'email'    => 'owner@toko.com',
                'password' => Hash::make('password123'),
                'role'     => 'owner',
            ],
            [
                'name'     => 'Admin Toko',
                'email'    => 'admin@toko.com',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
            ],
            [
                'name'     => 'Kasir 1',
                'email'    => 'kasir@toko.com',
                'password' => Hash::make('password123'),
                'role'     => 'cashier',
            ],
            [
                'name'     => 'Customer Test',
                'email'    => 'customer@gmail.com',
                'password' => Hash::make('password123'),
                'role'     => 'customer',
            ],
        ];

        foreach ($users as $data) {
            User::firstOrCreate(
                ['email' => $data['email']],
                $data
            );
        }
    }
}