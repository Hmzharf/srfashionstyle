<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'biteship' => [
    'base_url' => env('BITESHIP_BASE_URL', 'https://api.biteship.com/v1'),
    'api_key' => env('BITESHIP_API_KEY'),
    'origin_postal_code' => env('BITESHIP_ORIGIN_POSTAL_CODE'),
    'store_name' => env('BITESHIP_STORE_NAME'),
    'store_phone' => env('BITESHIP_STORE_PHONE'),
    'store_email' => env('BITESHIP_STORE_EMAIL'),
    'store_address' => env('BITESHIP_STORE_ADDRESS'),
    ],

];
