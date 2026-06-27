'use client';

import { removePhotoAction, setPhotoCoverAction } from '@/app/[orgSlug]/vehicles/actions';
import { Button } from '@/components/ui/button';
import type { VehiclePhoto } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';

type PhotoUploaderProps = {
  orgSlug: string;
  vehicleId: string;
  existingPhotos: VehiclePhoto[];
};

export function PhotoUploader({
  orgSlug,
  vehicleId,
  existingPhotos,
}: PhotoUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [pendingPhotoId, setPendingPhotoId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setUploading(true);
    setProgress({ current: 0, total: list.length });
    try {
      for (let i = 0; i < list.length; i += 1) {
        const file = list[i];
        if (!file) continue;
        setProgress({ current: i + 1, total: list.length });
        const fd = new FormData();
        fd.set('file', file);
        const res = await fetch(
          `/api/${orgSlug}/vehicles/${vehicleId}/photos`,
          {
            method: 'POST',
            body: fd,
          },
        );
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(j.error ?? `Falha no upload (${res.status})`);
        }
      }
      router.refresh();
      if (inputRef.current) inputRef.current.value = '';
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro no upload');
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 sm:flex-row sm:items-center">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
          disabled={uploading}
          onChange={(e) => void uploadFiles(e.target.files)}
        />
        {uploading ? (
          <span className="text-muted-foreground text-xs">
            Enviando {progress.current} de {progress.total}…
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            JPG, PNG ou WebP — múltiplos arquivos permitidos.
          </span>
        )}
      </div>

      {existingPhotos.length === 0 ? (
        <p className="text-muted-foreground text-center text-xs">
          Nenhuma foto cadastrada.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {existingPhotos.map((photo) => (
            <div
              key={photo.id}
              className={`relative overflow-hidden rounded-lg border ${
                photo.isCover
                  ? 'border-primary ring-1 ring-primary/30'
                  : 'border-border/60'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className="aspect-video w-full object-cover"
              />
              {photo.isCover ? (
                <span className="bg-primary text-primary-foreground absolute top-2 left-2 rounded px-1.5 py-0.5 text-[0.6875rem] font-medium">
                  Capa
                </span>
              ) : null}
              <div className="flex flex-wrap gap-1.5 border-t border-border/50 p-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={pendingPhotoId === photo.id || photo.isCover}
                  onClick={() => {
                    setPendingPhotoId(photo.id);
                    startTransition(() => {
                      void (async () => {
                        await setPhotoCoverAction(orgSlug, photo.id, vehicleId);
                        setPendingPhotoId(null);
                        router.refresh();
                      })();
                    });
                  }}
                >
                  Definir capa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={pendingPhotoId === photo.id}
                  onClick={() => {
                    if (!confirm('Remover esta foto?')) return;
                    setPendingPhotoId(photo.id);
                    startTransition(() => {
                      void (async () => {
                        await removePhotoAction(orgSlug, photo.id, vehicleId);
                        setPendingPhotoId(null);
                        router.refresh();
                      })();
                    });
                  }}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
