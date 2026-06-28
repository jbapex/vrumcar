'use client';

import { Loader2, Save, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  updateOrgAction,
  uploadOrgLogoAction,
} from '@/app/[orgSlug]/settings/actions';

interface Props {
  orgSlug: string;
  initialData: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

export function OrgSettingsForm({ orgSlug, initialData }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialData.name);
  const [slug, setSlug] = useState(initialData.slug);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData.logoUrl,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const result = await updateOrgAction(orgSlug, { name, slug });
      setMessage({ type: 'success', text: 'Configurações salvas' });

      if (result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        router.refresh();
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao salvar',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('logo', file);

      await uploadOrgLogoAction(orgSlug, formData);
      setMessage({ type: 'success', text: 'Logo atualizado' });
      router.refresh();
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao enviar logo',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold">Logo</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Aparece no topo do sistema e nas comunicações.
        </p>
        <div className="mt-4 flex items-center gap-4">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreview}
              alt="Logo"
              className="h-16 w-16 rounded-lg border border-zinc-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100 text-xl font-bold text-purple-700">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
            >
              {uploadingLogo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploadingLogo ? 'Enviando...' : 'Alterar logo'}
            </button>
            <p className="mt-1 text-xs text-zinc-400">PNG, JPG. Máx 2MB.</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 p-6">
        <h2 className="text-lg font-semibold">Dados da organização</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Nome da empresa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Slug (URL)
            </label>
            <div className="mt-1 flex items-center gap-0">
              <span className="rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                vrumcar.com.br/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                  )
                }
                className="flex-1 rounded-r-md border border-zinc-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              Letras minúsculas, números e hífens. Mínimo 3 caracteres.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>

          {message && (
            <span
              className={`text-sm ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
