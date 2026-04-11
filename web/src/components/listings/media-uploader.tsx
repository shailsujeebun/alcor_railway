'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Loader2, GripVertical } from 'lucide-react';
import { useUploadImages } from '@/lib/queries';

export interface MediaItem {
    id?: string;
    url: string;
    key?: string;
    isExisting?: boolean;
    file?: File;
    type?: 'PHOTO' | 'VIDEO' | 'PDF' | 'GALLERY' | 'COVER' | 'LOGO';
}

interface MediaUploaderProps {
    media: MediaItem[];
    onChange: (media: MediaItem[]) => void;
    maxFiles?: number;
}

export function MediaUploader({ media, onChange, maxFiles = 10 }: MediaUploaderProps) {
    const [uploading, setUploading] = useState(false);
    const { mutateAsync: uploadImages } = useUploadImages();
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    const maxFileBytes = 10 * 1024 * 1024;

    // ── Drag-and-drop state ──
    const dragIndexRef = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const remaining = maxFiles - media.length;
        const filesToUpload = files.slice(0, remaining);
        const invalidType = filesToUpload.find((file) => !allowedMimeTypes.has(file.type));
        if (invalidType) {
            alert('Підтримуються лише JPG, PNG, WEBP, GIF.');
            e.target.value = '';
            return;
        }
        const oversized = filesToUpload.find((file) => file.size > maxFileBytes);
        if (oversized) {
            alert('Максимальний розмір одного файлу — 10MB.');
            e.target.value = '';
            return;
        }

        setUploading(true);
        try {
            const { urls } = await uploadImages(filesToUpload);
            if (!Array.isArray(urls) || urls.length === 0) {
                throw new Error('Сервер не повернув URL завантажених зображень.');
            }

            const newMediaItems: MediaItem[] = urls.map((url, index) => ({
                url,
                file: filesToUpload[index],
                type: 'PHOTO',
            }));

            onChange([...media, ...newMediaItems]);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Помилка завантаження файлів. Будь ласка, спробуйте ще раз.');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    }, [media, maxFiles, onChange, uploadImages]);

    const handleRemove = useCallback((index: number) => {
        onChange(media.filter((_, i) => i !== index));
    }, [media, onChange]);

    // ── Drag handlers ──
    const handleDragStart = useCallback((index: number) => {
        dragIndexRef.current = index;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragIndexRef.current !== null && dragIndexRef.current !== index) {
            setDragOverIndex(index);
        }
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = dragIndexRef.current;
        if (sourceIndex === null || sourceIndex === targetIndex) {
            dragIndexRef.current = null;
            setDragOverIndex(null);
            return;
        }

        const updated = [...media];
        const [moved] = updated.splice(sourceIndex, 1);
        updated.splice(targetIndex, 0, moved);
        onChange(updated);

        dragIndexRef.current = null;
        setDragOverIndex(null);
    }, [media, onChange]);

    const handleDragEnd = useCallback(() => {
        dragIndexRef.current = null;
        setDragOverIndex(null);
    }, []);

    // ── Touch drag support ──
    const touchStartRef = useRef<{ index: number; startY: number; startX: number } | null>(null);
    const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);

    const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStartRef.current = { index, startX: touch.clientX, startY: touch.clientY };
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!touchStartRef.current) return;
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartRef.current.startX);
        const dy = Math.abs(touch.clientY - touchStartRef.current.startY);
        if (dx > 10 || dy > 10) {
            setTouchDragIndex(touchStartRef.current.index);
        }
    }, []);

    const handleTouchEnd = useCallback((targetIndex: number) => {
        if (touchDragIndex !== null && touchDragIndex !== targetIndex) {
            const updated = [...media];
            const [moved] = updated.splice(touchDragIndex, 1);
            updated.splice(targetIndex, 0, moved);
            onChange(updated);
        }
        touchStartRef.current = null;
        setTouchDragIndex(null);
    }, [touchDragIndex, media, onChange]);

    return (
        <div className="space-y-4">
            {media.length > 1 && (
                <p className="text-xs text-blue-bright flex items-center gap-1">
                    <GripVertical size={14} />
                    Перетягніть фото, щоб змінити порядок. Перше фото — головне.
                </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((item, index) => {
                    const isDragOver = dragOverIndex === index;
                    const isTouchDragging = touchDragIndex === index;

                    return (
                        <div
                            key={item.id || `media-${index}`}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            onTouchStart={(e) => handleTouchStart(index, e)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={() => handleTouchEnd(index)}
                            className={`relative group aspect-square rounded-lg overflow-hidden bg-[var(--bg-secondary)] border-2 transition-all cursor-grab active:cursor-grabbing ${
                                isDragOver
                                    ? 'border-blue-bright scale-[1.03] shadow-lg shadow-blue-bright/20'
                                    : isTouchDragging
                                    ? 'border-blue-bright/60 opacity-60 scale-95'
                                    : 'border-[var(--border-color)] hover:border-blue-bright/40'
                            }`}
                        >
                            <img
                                src={item.url}
                                alt={`Фото ${index + 1}`}
                                className="w-full h-full object-cover pointer-events-none"
                                draggable={false}
                            />

                            {/* Position badge */}
                            <span className={`absolute top-2 left-2 min-w-[24px] h-6 flex items-center justify-center rounded-full text-xs font-bold px-1.5 ${
                                index === 0
                                    ? 'bg-blue-bright text-white'
                                    : 'bg-black/60 text-white'
                            }`}>
                                {index === 0 ? '★ 1' : index + 1}
                            </span>

                            {/* Cover badge for first photo */}
                            {index === 0 && (
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-bright text-white">
                                    Головне фото
                                </span>
                            )}

                            {/* Drag handle indicator */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical size={18} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                            </div>

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                            >
                                <X size={16} />
                            </button>

                            {/* Drop indicator line */}
                            {isDragOver && (
                                <div className="absolute inset-0 border-2 border-blue-bright rounded-lg pointer-events-none animate-pulse" />
                            )}
                        </div>
                    );
                })}

                {media.length < maxFiles && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-[var(--border-color)] hover:border-blue-bright cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)]/30">
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="hidden"
                        />
                        {uploading ? (
                            <Loader2 size={24} className="animate-spin text-blue-bright" />
                        ) : (
                            <>
                                <Upload size={24} className="text-[var(--text-secondary)]" />
                                <span className="text-xs text-[var(--text-secondary)] text-center px-2">
                                    Завантажити фото
                                </span>
                            </>
                        )}
                    </label>
                )}
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
                Завантажено {media.length} з {maxFiles} фото
            </p>
        </div>
    );
}
