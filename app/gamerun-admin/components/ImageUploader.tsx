'use client';

import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { CloudUpload, Image as ImageIcon, Close } from '@mui/icons-material';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import SafeImage from '@/components/ui/safe-image';

interface ImageUploaderProps {
  currentImageUrl: string | null;
  onImageUploaded: (url: string) => void;
}

export default function ImageUploader({ currentImageUrl, onImageUploaded }: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    await uploadFile(event.target.files[0]);
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      // Valida se é uma imagem
      if (!file.type.startsWith('image/')) {
        setError('O arquivo selecionado não é uma imagem válida.');
        setUploading(false);
        return;
      }

      // Verificar o tamanho do arquivo (limite de 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB.');
        setUploading(false);
        return;
      }

      console.log('Iniciando upload do arquivo via API:', file.name);

      // Usar a nova API para fazer o upload
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          // Se for um erro de RLS, fornecer uma mensagem mais clara
          if (result.error?.includes('violates row-level security policy')) {
            throw new Error('Erro de permissão no armazenamento. Verifique as políticas de acesso no Supabase Storage.');
          }
          throw new Error(result.error || 'Erro ao fazer upload');
        }

        console.log('Upload bem-sucedido:', result);

        // Atualizar estado e notificar componente pai
        setImageUrl(result.url);
        onImageUploaded(result.url);
      } catch (uploadError: any) {
        console.error('Erro durante o upload da imagem:', uploadError);
        setError(`Erro ao fazer upload da imagem: ${uploadError.message}`);
      }
    } catch (error: any) {
      const errorDetails = error.message || JSON.stringify(error);
      setError(`Erro ao processar a imagem: ${errorDetails}`);
      console.error('Erro ao processar a imagem:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    onImageUploaded('');
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <div
        className={`
          relative min-h-[200px] w-full rounded-lg border-2 border-dashed p-4 transition-colors
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {imageUrl ? (
          <div className="relative h-full min-h-[180px] w-full">
            {imageUrl.startsWith('http') ? (
              <div className="relative h-full w-full">
                <SafeImage
                  src={imageUrl}
                  alt="Game image"
                  fill
                  className="rounded-md object-contain"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-md">
                <ImageIcon className="h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Imagem não disponível</p>
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeImage();
              }}
              className="absolute -right-2 -top-2 rounded-full bg-red-100 p-1 text-red-500 hover:bg-red-200"
            >
              <Close fontSize="small" />
            </button>
          </div>
        ) : (
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-gray-500">
            {uploading ? (
              <>
                <div className="mb-2 h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
                <p>Enviando imagem...</p>
              </>
            ) : (
              <>
                <CloudUpload className="mb-2 h-10 w-10" />
                <p className="mb-1 text-center font-medium">
                  Arraste uma imagem ou clique para selecionar
                </p>
                <p className="text-center text-sm">
                  PNG, JPG ou GIF (máx. 2MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 