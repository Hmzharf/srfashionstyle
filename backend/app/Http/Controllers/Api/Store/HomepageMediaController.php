<?php

namespace App\Http\Controllers\Api\Store;

use App\Http\Controllers\Controller;
use App\Models\PromotionMedia;
use Illuminate\Http\JsonResponse;

class HomepageMediaController extends Controller
{
    public function index(): JsonResponse
    {
        $heroDesktop = PromotionMedia::where('active_for', 'hero_desktop')
            ->latest()
            ->first();

        if (!$heroDesktop) {
            $heroDesktop = PromotionMedia::where('placement', 'hero_desktop')
                ->latest()
                ->first();
        }

        $heroMobile = PromotionMedia::where('active_for', 'hero_mobile')
            ->latest()
            ->first();

        if (!$heroMobile) {
            $heroMobile = PromotionMedia::where('placement', 'hero_mobile')
                ->latest()
                ->first();
        }

        $promo = PromotionMedia::where('active_for', 'promo')
            ->latest()
            ->first();

        if (!$promo) {
            $promo = PromotionMedia::where('placement', 'promo')
                ->latest()
                ->first();
        }

        return response()->json([
            'hero_desktop' => $heroDesktop,
            'hero_mobile'  => $heroMobile,
            'promo'        => $promo,
        ]);
    }
}