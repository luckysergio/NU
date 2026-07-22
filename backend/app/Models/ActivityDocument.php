<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class ActivityDocument extends Model
{
    use HasFactory;

    protected $table = 'activity_documents';

    protected $fillable = [
        'activity_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'description',
        'category',
        'uploaded_by',
        'uploaded_at',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'uploaded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getFormattedSizeAttribute(): string
    {
        $bytes = $this->file_size;
        
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

    public function getExtensionAttribute(): string
    {
        return pathinfo($this->file_name, PATHINFO_EXTENSION);
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    public function getIsImageAttribute(): bool
    {
        return in_array(strtolower($this->file_type), ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }

    public function getIsDocumentAttribute(): bool
    {
        return in_array(strtolower($this->file_type), ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);
    }

    public function scopeByActivity(Builder $query, int $activityId): Builder
    {
        return $query->where('activity_id', $activityId);
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeByFileType(Builder $query, string $fileType): Builder
    {
        return $query->where('file_type', $fileType);
    }

    public function scopeImages(Builder $query): Builder
    {
        return $query->whereIn('file_type', ['jpg', 'jpeg', 'png', 'gif', 'webp']);
    }

    public function scopeDocuments(Builder $query): Builder
    {
        return $query->whereIn('file_type', ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']);
    }

    public function scopeRecent(Builder $query, int $days = 7): Builder
    {
        return $query->where('uploaded_at', '>=', now()->subDays($days));
    }
}