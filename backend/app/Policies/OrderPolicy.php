<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'owner', 'cashier']);
    }

    public function view(User $user, Order $order): bool
    {
        if (in_array($user->role, ['admin', 'owner', 'cashier'])) {
            return true;
        }

        return $user->role === 'customer' && (int) $order->user_id === (int) $user->id;
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'owner']);
    }

    public function update(User $user, Order $order): bool
    {
        return in_array($user->role, ['admin', 'owner']);
    }

    public function delete(User $user, Order $order): bool
    {
        return in_array($user->role, ['admin', 'owner']);
    }

    public function updateStatus(User $user, Order $order): bool
    {
        return in_array($user->role, ['admin', 'owner', 'cashier']);
    }
}