<?php

namespace App\Services;

use App\Models\User;
use App\Models\Activity;
use App\Models\ActivityDocument;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ActivityDocumentService
{
    protected const CACHE_DURATION = 600;
    protected const CACHE_PREFIX = 'activity-documents:';
    protected const CACHE_TRACKER_KEY = 'activity-documents:active_keys';

    protected const MAX_FILE_SIZE = 10485760; // 10MB
    protected const MAX_IMAGE_SIZE = 5242880; // 5MB
    protected const MAX_FILES_PER_UPLOAD = 10;

    protected const ALLOWED_FILE_TYPES = [
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
        'jpg', 'jpeg', 'png', 'gif', 'webp',
    ];

    protected const IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    protected const DOCUMENT_TYPES = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];

    protected const CATEGORY_OPTIONS = [
        'proposal' => 'Proposal Kegiatan',
        'laporan' => 'Laporan Kegiatan',
        'surat' => 'Surat Menyurat',
        'anggaran' => 'Rencana Anggaran',
        'notulensi' => 'Notulensi Rapat',
        'sertifikat' => 'Sertifikat',
        'dokumentasi' => 'Dokumentasi',
        'lainnya' => 'Lainnya',
    ];

    protected function authUser(): ?User
    {
        return Auth::user();
    }

    public function getAllByActivity(int $activityId, Request $request)
    {
        $activity = $this->findActivityWithAccess($activityId);

        $filters = $this->extractFilters($request);
        $bypassCache = $request->query('bypass_cache', false);

        if ($bypassCache || $request->query('_t')) {
            return $this->buildDocumentQuery($activityId, $filters)
                ->paginate($filters['per_page']);
        }

        $cacheKey = $this->getCacheKey('list_' . $activityId, $filters);

        return $this->rememberCache($cacheKey, function () use ($activityId, $filters) {
            return $this->buildDocumentQuery($activityId, $filters)
                ->paginate($filters['per_page']);
        });
    }

    public function findById(int $id): ActivityDocument
    {
        $cacheKey = $this->getCacheKey('detail_' . $id);

        return $this->rememberCache($cacheKey, function () use ($id) {
            $document = ActivityDocument::with(['activity', 'uploader'])
                ->findOrFail($id);

            $this->validateActivityAccess($document->activity_id);

            return $document;
        });
    }

    public function upload(int $activityId, Request $request): array
    {
        return DB::transaction(function () use ($activityId, $request) {
            $activity = $this->findActivityWithAccess($activityId);
            $user = $this->authUser();

            if (!$user) {
                throw new AuthorizationException('Unauthorized');
            }

            $files = $request->file('documents', []);

            if (!is_array($files)) {
                $files = [$files];
            }

            if (count($files) > self::MAX_FILES_PER_UPLOAD) {
                throw new \Exception("Maksimal " . self::MAX_FILES_PER_UPLOAD . " file per upload");
            }

            $uploadedDocuments = [];
            $errors = [];

            foreach ($files as $index => $file) {
                try {
                    $this->validateFile($file);

                    $document = $this->processFileUpload($file, $activityId, $user, $request);
                    $uploadedDocuments[] = $document;
                } catch (\Exception $e) {
                    $errors[] = [
                        'file_index' => $index,
                        'file_name' => $file->getClientOriginalName(),
                        'error' => $e->getMessage(),
                    ];
                }
            }

            if (empty($uploadedDocuments) && !empty($errors)) {
                throw new \Exception("Semua file gagal diupload: " . $errors[0]['error']);
            }

            $this->clearCache();

            Log::info('Activity documents uploaded', [
                'activity_id' => $activityId,
                'user_id' => $user->id,
                'uploaded_count' => count($uploadedDocuments),
                'errors_count' => count($errors),
            ]);

            return [
                'documents' => $uploadedDocuments,
                'errors' => $errors,
                'success_count' => count($uploadedDocuments),
                'error_count' => count($errors),
            ];
        });
    }

    public function update(int $id, array $data): ActivityDocument
    {
        return DB::transaction(function () use ($id, $data) {
            $document = ActivityDocument::findOrFail($id);
            $this->validateActivityAccess($document->activity_id);

            $document->update([
                'description' => $data['description'] ?? $document->description,
                'category' => $data['category'] ?? $document->category,
            ]);

            $this->clearCache();

            return $document->fresh(['activity', 'uploader']);
        });
    }

    public function destroy(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $document = ActivityDocument::findOrFail($id);
            $this->validateActivityAccess($document->activity_id);

            if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            $document->delete();

            $this->clearCache();

            Log::info('Activity document deleted', [
                'document_id' => $id,
                'activity_id' => $document->activity_id,
                'user_id' => Auth::id(),
            ]);

            return true;
        });
    }

    public function download(int $id): BinaryFileResponse
    {
        $document = ActivityDocument::findOrFail($id);
        $this->validateActivityAccess($document->activity_id);

        $fullPath = storage_path('app/public/' . $document->file_path);

        if (!file_exists($fullPath)) {
            throw new \Exception('File tidak ditemukan di storage');
        }

        return response()->download(
            $fullPath,
            $document->file_name,
            [
                'Content-Type' => $this->getMimeType($document->file_type),
            ]
        );
    }

    public function getStatistics(int $activityId): array
    {
        $this->findActivityWithAccess($activityId);

        $documents = ActivityDocument::byActivity($activityId)->get();

        $totalSize = (int) $documents->sum('file_size');
        
        $byCategory = [];
        foreach ($documents->groupBy('category') as $category => $group) {
            $byCategory[$category] = $group->count();
        }
        
        $byFileType = [];
        foreach ($documents->groupBy('file_type') as $fileType => $group) {
            $byFileType[$fileType] = $group->count();
        }

        return [
            'total_documents' => $documents->count(),
            'total_size' => $totalSize,
            'formatted_total_size' => $this->formatBytes($totalSize),
            'by_category' => $byCategory,
            'by_file_type' => $byFileType,
            'recent_documents' => $documents->sortByDesc('uploaded_at')->take(5)->values(),
        ];
    }

    protected function findActivityWithAccess(int $activityId): Activity
    {
        $user = $this->authUser();
        if (!$user) {
            throw new AuthorizationException('Unauthorized');
        }

        $activity = Activity::with(['organization', 'workProgram'])
            ->findOrFail($activityId);

        $this->validateActivityAccess($activityId);

        return $activity;
    }

    protected function validateActivityAccess(int $activityId): void
    {
        $user = $this->authUser();
        if (!$user) {
            throw new AuthorizationException('Unauthorized');
        }

        if ($user->isSuperAdmin()) {
            return;
        }

        $activity = Activity::findOrFail($activityId);
        $accessibleIds = $user->getAccessibleOrganizationIds();

        if ($accessibleIds === null) {
            return;
        }

        if (!in_array($activity->organization_id, $accessibleIds)) {
            throw new AuthorizationException('Anda tidak memiliki akses ke kegiatan ini');
        }
    }

    protected function validateFile(UploadedFile $file): void
    {
        $maxSize = in_array(strtolower($file->getClientOriginalExtension()), self::IMAGE_TYPES)
            ? self::MAX_IMAGE_SIZE
            : self::MAX_FILE_SIZE;

        if ($file->getSize() > $maxSize) {
            $maxSizeMB = $maxSize / 1048576;
            throw new \Exception("Ukuran file terlalu besar. Maksimal {$maxSizeMB}MB");
        }

        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, self::ALLOWED_FILE_TYPES)) {
            throw new \Exception("Tipe file tidak didukung. Gunakan: " . implode(', ', self::ALLOWED_FILE_TYPES));
        }

        $mimeType = $file->getMimeType();
        $allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        if (!in_array($mimeType, $allowedMimeTypes)) {
            throw new \Exception("MIME type file tidak valid");
        }
    }

    protected function processFileUpload(
        UploadedFile $file,
        int $activityId,
        User $user,
        Request $request
    ): ActivityDocument {
        $extension = strtolower($file->getClientOriginalExtension());
        $originalName = $file->getClientOriginalName();
        $fileName = pathinfo($originalName, PATHINFO_FILENAME);
        $safeFileName = Str::slug($fileName) . '_' . time() . '_' . Str::random(6) . '.' . $extension;

        $year = date('Y');
        $month = date('m');
        $path = "activities/{$activityId}/documents/{$year}/{$month}";

        $storedPath = $file->storeAs($path, $safeFileName, 'public');

        $category = $request->input('category', $this->detectCategory($extension));

        $document = ActivityDocument::create([
            'activity_id' => $activityId,
            'file_name' => $originalName,
            'file_path' => $storedPath,
            'file_type' => $extension,
            'file_size' => $file->getSize(),
            'description' => $request->input('description'),
            'category' => $category,
            'uploaded_by' => $user->id,
            'uploaded_at' => now(),
        ]);

        return $document->load(['activity', 'uploader']);
    }

    protected function detectCategory(string $extension): string
    {
        if (in_array($extension, self::IMAGE_TYPES)) {
            return 'dokumentasi';
        }

        return 'lainnya';
    }

    protected function getMimeType(string $extension): string
    {
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt' => 'application/vnd.ms-powerpoint',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
        ];

        return $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } else {
            return $bytes . ' bytes';
        }
    }

    protected function buildDocumentQuery(int $activityId, array $filters)
    {
        $query = ActivityDocument::with(['uploader'])
            ->byActivity($activityId);

        if (!empty($filters['category'])) {
            $query->byCategory($filters['category']);
        }

        if (!empty($filters['file_type'])) {
            $query->byFileType($filters['file_type']);
        }

        if (!empty($filters['search'])) {
            $search = strtolower($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->whereRaw('LOWER(file_name) LIKE ?', ["%{$search}%"])
                  ->orWhereRaw('LOWER(description) LIKE ?', ["%{$search}%"]);
            });
        }

        $sortBy = $filters['sort_by'] ?? 'uploaded_at';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query;
    }

    protected function extractFilters(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search', '')),
            'category' => $request->query('category'),
            'file_type' => $request->query('file_type'),
            'sort_by' => $request->query('sort_by', 'uploaded_at'),
            'sort_order' => $request->query('sort_order', 'desc'),
            'per_page' => min((int) $request->input('per_page', 10), 100),
            'page' => (int) $request->query('page', 1),
        ];
    }

    protected function getCacheKey(string $key, array $params = []): string
    {
        $userId = Auth::id() ?? 'guest';
        $paramString = !empty($params) ? '_' . md5(json_encode($params)) : '';
        return self::CACHE_PREFIX . $userId . ':' . $key . $paramString;
    }

    protected function rememberCache(string $key, \Closure $callback)
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);
        if (!in_array($key, $activeKeys)) {
            $activeKeys[] = $key;
            Cache::put(self::CACHE_TRACKER_KEY, $activeKeys, now()->addDays(7));
        }

        return Cache::remember($key, self::CACHE_DURATION, $callback);
    }

    public function clearCache(): void
    {
        $activeKeys = Cache::get(self::CACHE_TRACKER_KEY, []);

        foreach ($activeKeys as $key) {
            Cache::forget($key);
        }

        Cache::forget(self::CACHE_TRACKER_KEY);

        Log::info('Activity documents cache cleared successfully.');
    }

    public function getCategoryOptions(): array
    {
        return self::CATEGORY_OPTIONS;
    }

    public function getAllowedFileTypes(): array
    {
        return self::ALLOWED_FILE_TYPES;
    }
}