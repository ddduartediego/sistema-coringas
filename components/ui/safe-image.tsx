'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { Image as ImageIcon } from '@mui/icons-material';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackWidth?: number;
  fallbackHeight?: number;
}

/**
 * Um componente de imagem seguro que exibe um fallback em caso de erro
 */
export default function SafeImage({
  src,
  alt,
  fallbackWidth = 100,
  fallbackHeight = 100,
  width,
  height,
  ...props
}: SafeImageProps) {
  const [error, setError] = useState(false);

  // Verificar se a origem da imagem é válida (necessário para o Next.js Image)
  const isValidSrc = (src: string | any) => {
    if (typeof src !== 'string') return true; // StaticImport e outras opções são consideradas válidas
    
    try {
      const url = new URL(src);
      // Domínios conhecidos e suportados pelo projeto
      const allowedDomains = [
        'tbdlpwprdkghmqmpkype.supabase.co',
        'localhost',
        'supabase.co'
      ];
      
      // Verificar se o domínio está na lista de permitidos
      return allowedDomains.some(domain => url.hostname.includes(domain)) || url.protocol === 'data:';
    } catch (e) {
      // Se não for uma URL válida, assumimos que é uma imagem local
      return true;
    }
  };

  // Se houver erro ou a URL for inválida, mostrar fallback
  if (error || (typeof src === 'string' && !isValidSrc(src))) {
    return (
      <div 
        className="flex flex-col items-center justify-center bg-gray-100 rounded"
        style={{ 
          width: width || fallbackWidth, 
          height: height || fallbackHeight
        }}
      >
        <ImageIcon className="text-gray-400" />
        <span className="text-xs text-gray-500 mt-1">Imagem indisponível</span>
      </div>
    );
  }

  // Se tudo estiver correto, renderizar a imagem normal
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      onError={() => setError(true)}
      {...props}
    />
  );
} 