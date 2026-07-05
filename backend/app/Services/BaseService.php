<?php
// app/Services/BaseService.php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

abstract class BaseService
{
    protected const CACHE_DURATION = 3600; // 1 hour
    protected const CACHE_PREFIX = '';

    /**
     * Get cache key dengan prefix
     */
    protected function getCacheKey(string $key, array $params = []): string
    {
        $prefix = static::CACHE_PREFIX ?: $this->getDefaultPrefix();
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        
        return $prefix . $key . $paramString;
    }

    /**
     * Get default prefix dari class
     */
    protected function getDefaultPrefix(): string
    {
        $class = explode('\\', static::class);
        $name = strtolower(str_replace('Service', '', end($class)));
        
        return $name . '_';
    }

    /**
     * Clear cache dengan pattern
     */
    protected function clearCacheByPattern(string $pattern): void
    {
        try {
            $keys = Cache::get($pattern . '_keys', []);
            foreach ($keys as $key) {
                Cache::forget($key);
            }
            Cache::forget($pattern . '_keys');
        } catch (\Exception $e) {
            Log::warning('Failed to clear cache pattern: ' . $e->getMessage());
        }
    }

    /**
     * Store cache key untuk pattern
     */
    protected function storeCacheKey(string $pattern, string $key): void
    {
        try {
            $keys = Cache::get($pattern . '_keys', []);
            if (!in_array($key, $keys)) {
                $keys[] = $key;
                Cache::put($pattern . '_keys', $keys, static::CACHE_DURATION);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to store cache key: ' . $e->getMessage());
        }
    }

    /**
     * Validate and sanitize per page value
     * 
     * @param mixed $perPage
     * @return int
     */
    protected function validatePerPage(mixed $perPage): int
    {
        if (!is_numeric($perPage) || (int) $perPage <= 0) {
            return 10;
        }

        $perPage = (int) $perPage;

        if ($perPage > 100) {
            return 100;
        }

        return $perPage;
    }

    /**
     * Execute with cache
     * 
     * @param string $key
     * @param \Closure $callback
     * @param int|null $duration
     * @return mixed
     */
    protected function remember(string $key, \Closure $callback, ?int $duration = null)
    {
        $duration = $duration ?? static::CACHE_DURATION;
        
        return Cache::remember($key, $duration, function () use ($callback, $key) {
            // Store key for pattern clearing
            $this->storeCacheKey(static::CACHE_PREFIX . 'pattern', $key);
            
            return $callback();
        });
    }

    /**
     * Clear all cache for this service
     */
    protected function clearAllCache(): void
    {
        $this->clearCacheByPattern(static::CACHE_PREFIX . 'pattern');
    }

    /**
     * Get cached data or retrieve fresh
     * 
     * @param string $key
     * @param \Closure $callback
     * @param int|null $duration
     * @return mixed
     */
    protected function getCached(string $key, \Closure $callback, ?int $duration = null)
    {
        return $this->remember($key, $callback, $duration);
    }

    /**
     * Forget cache by key
     * 
     * @param string $key
     * @return void
     */
    protected function forgetCache(string $key): void
    {
        Cache::forget($key);
    }
}