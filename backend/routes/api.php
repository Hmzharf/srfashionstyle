<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PayAtStoreController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProductVariantController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\ShippingController;

use App\Http\Controllers\Api\Admin\AdminReportsController;
use App\Http\Controllers\Api\Admin\CashierStaffAdminController;
use App\Http\Controllers\Api\Admin\FeaturedProductController;
use App\Http\Controllers\Api\Admin\PosSummaryController;
use App\Http\Controllers\Api\Admin\PromotionMediaController;
use App\Http\Controllers\Api\Admin\TopProductsController;

use App\Http\Controllers\Api\Pos\CashierStaffController;
use App\Http\Controllers\Api\Pos\ShiftController;
use App\Http\Controllers\Api\Pos\TransactionController;

use App\Http\Controllers\Api\Store\BestProductsController;
use App\Http\Controllers\Api\Store\HomepageMediaController;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

Route::get('/health', fn () => response()->json([
    'message' => 'Backend Laravel terkoneksi',
]));

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-recovery');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-recovery');

/*
|--------------------------------------------------------------------------
| Public Store / Catalog
|--------------------------------------------------------------------------
*/

Route::prefix('store')->group(function () {
    Route::get('/best-products', [BestProductsController::class, 'index']);
    Route::get('/homepage-media', [HomepageMediaController::class, 'index']);
});

Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('/{category}', [CategoryController::class, 'show']);
});

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{product}', [ProductController::class, 'show']);
    Route::get('/{product}/reviews', [ReviewController::class, 'productReviews']);
});

Route::prefix('catalog-products')->group(function () {
    Route::get('/', [ProductController::class, 'catalog']);
    Route::get('/{product}', [ProductController::class, 'catalogShow']);
});

Route::prefix('product-variants')->group(function () {
    Route::get('/', [ProductVariantController::class, 'index']);
    Route::get('/{productVariant}', [ProductVariantController::class, 'show']);
});

Route::prefix('inventories')->group(function () {
    Route::get('/', [InventoryController::class, 'index']);
    Route::get('/{inventory}', [InventoryController::class, 'show']);
});

/*
|--------------------------------------------------------------------------
| Checkout / Shipping / Payment
|--------------------------------------------------------------------------
*/

Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders-summary', [OrderController::class, 'summary']);
Route::post('/shipping/rates', [ShippingController::class, 'rates']);
Route::post('/orders/midtrans-callback', [OrderController::class, 'midtransCallback']);
Route::post('/orders/{id}/payment-token', [OrderController::class, 'createPaymentToken']);
Route::get('/midtrans-test', [OrderController::class, 'testMidtrans']);

/*
|--------------------------------------------------------------------------
| Authenticated
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    /*
    |--------------------------------------------------------------------------
    | Authenticated User
    |--------------------------------------------------------------------------
    */

    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me/profile', [AuthController::class, 'updateProfile']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::post('/email-verification/send-otp', [AuthController::class, 'sendEmailOtp'])
        ->middleware('throttle:otp');

    Route::post('/email-verification/verify-otp', [AuthController::class, 'verifyEmailOtp'])
        ->middleware('throttle:otp');

    Route::post('/email-verification/resend-otp', [AuthController::class, 'resendEmailOtp'])
        ->middleware('throttle:otp');

    /*
    |--------------------------------------------------------------------------
    | Customer
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:customer')->group(function () {
        Route::get('/my-orders', [OrderController::class, 'myOrders']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::get('/orders/{id}/tracking', [OrderController::class, 'tracking']);
        Route::post('/orders/{id}/confirm-received', [OrderController::class, 'confirmReceived']);

        Route::get('/my-reviews', [ReviewController::class, 'myReviews']);
        Route::get('/orders/{id}/reviews', [ReviewController::class, 'myOrderReviews']);
        Route::post('/orders/{id}/reviews', [ReviewController::class, 'store']);

        Route::prefix('customer')->group(function () {
            Route::get('/home', fn () => response()->json([
                'message' => 'Selamat datang customer',
            ]));
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Admin / Owner / Cashier
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin,owner,cashier')->group(function () {
        Route::prefix('orders')->group(function () {
            Route::get('/', [OrderController::class, 'index']);
            Route::put('/{id}/status', [OrderController::class, 'updateStatus']);
            Route::get('/{id}/pay-at-store-detail', [PayAtStoreController::class, 'show']);
            Route::post('/{id}/confirm-store-payment', [PayAtStoreController::class, 'confirmPayment']);
        });

        Route::prefix('categories')->group(function () {
            Route::post('/', [CategoryController::class, 'store']);
            Route::match(['put', 'patch'], '/{category}', [CategoryController::class, 'update']);
            Route::delete('/{category}', [CategoryController::class, 'destroy']);
        });

        Route::prefix('products')->group(function () {
            Route::post('/', [ProductController::class, 'store']);
            Route::match(['put', 'patch'], '/{product}', [ProductController::class, 'update']);
            Route::delete('/{product}', [ProductController::class, 'destroy']);
        });

        Route::prefix('product-variants')->group(function () {
            Route::post('/', [ProductVariantController::class, 'store']);
            Route::match(['put', 'patch'], '/{productVariant}', [ProductVariantController::class, 'update']);
            Route::delete('/{productVariant}', [ProductVariantController::class, 'destroy']);
        });

        Route::prefix('inventories')->group(function () {
            Route::post('/', [InventoryController::class, 'store']);
            Route::match(['put', 'patch'], '/{inventory}', [InventoryController::class, 'update']);
            Route::delete('/{inventory}', [InventoryController::class, 'destroy']);
        });

        Route::prefix('admin')->group(function () {
            Route::get('/dashboard', fn () => response()->json([
                'message' => 'Dashboard admin',
            ]));

            Route::get('/pos-summary', [PosSummaryController::class, 'index']);
            Route::get('/top-products', [TopProductsController::class, 'index']);
            Route::get('/reports', [AdminReportsController::class, 'index']);
        });

        Route::prefix('pos')->group(function () {
            Route::get('/cashier-staff', [CashierStaffController::class, 'index']);

            Route::prefix('shifts')->group(function () {
                Route::get('/active', [ShiftController::class, 'active']);
                Route::post('/open', [ShiftController::class, 'open']);
                Route::post('/close', [ShiftController::class, 'close']);
                Route::get('/', [ShiftController::class, 'history']);
            });

            Route::get('/products/search', [TransactionController::class, 'searchProducts']);

            Route::prefix('transactions')->group(function () {
                Route::post('/', [TransactionController::class, 'store']);
                Route::get('/', [TransactionController::class, 'index']);
                Route::get('/{id}', [TransactionController::class, 'show']);
                Route::post('/{id}/refund', [TransactionController::class, 'refund']);
            });

            Route::get('/pending-store-orders', [PayAtStoreController::class, 'pendingList']);
            Route::post('/confirm-store-payment/{id}', [PayAtStoreController::class, 'confirmPayment']);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Admin / Owner Only
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin,owner')->prefix('admin')->group(function () {
        Route::get('/pos/shifts', [ShiftController::class, 'adminIndex']);
        Route::get('/orders/pay-at-store-pending', [PayAtStoreController::class, 'pendingList']);

        Route::prefix('cashier-staff')->group(function () {
            Route::get('/summary', [CashierStaffAdminController::class, 'summary']);
            Route::get('/', [CashierStaffAdminController::class, 'index']);
            Route::post('/', [CashierStaffAdminController::class, 'store']);
            Route::get('/{id}', [CashierStaffAdminController::class, 'show']);
            Route::put('/{id}', [CashierStaffAdminController::class, 'update']);
            Route::delete('/{id}', [CashierStaffAdminController::class, 'destroy']);
            Route::get('/{id}/shifts', [CashierStaffAdminController::class, 'shifts']);
            Route::get('/{id}/transactions', [CashierStaffAdminController::class, 'transactions']);
        });

        Route::prefix('promotion-media')->group(function () {
            Route::get('/', [PromotionMediaController::class, 'index']);
            Route::post('/', [PromotionMediaController::class, 'store']);
            Route::post('/{id}/activate', [PromotionMediaController::class, 'activate']);
            Route::delete('/{id}', [PromotionMediaController::class, 'destroy']);
        });

        Route::prefix('featured-products')->group(function () {
            Route::get('/', [FeaturedProductController::class, 'index']);
            Route::post('/{id}/toggle', [FeaturedProductController::class, 'toggle']);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:admin')->prefix('reports')->group(function () {
        Route::get('/orders', [ReportController::class, 'orders']);
        Route::get('/orders/export/excel', [ReportController::class, 'exportOrdersExcel']);
        Route::get('/orders/export/pdf', [ReportController::class, 'exportOrdersPdf']);
        Route::get('/all/export/excel', [ReportController::class, 'exportAllExcel']);
        Route::get('/all/export/pdf', [ReportController::class, 'exportAllPdf']);
    });
});