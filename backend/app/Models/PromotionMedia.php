<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromotionMedia extends Model
{
    protected $table = 'promotion_media';

    protected $fillable = [
        'title',
        'placement',
        'active_for',
        'image_path',
        'image_url',
    ];
}