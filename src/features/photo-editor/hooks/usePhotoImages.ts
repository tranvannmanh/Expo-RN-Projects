import { useQuery } from '@tanstack/react-query';

import { decodeImage, resizeImage } from '../api/photo.api';
import { PREVIEW_MAX_EDGE, THUMB_MAX_EDGE } from '../constants/editor.constants';
import type { SourcePhoto } from '../types/editor.types';

/**
 * Decodes the picked photo once and keeps a GPU-friendly preview plus a tiny
 * thumbnail for the film strip. The full-size bitmap is released right away.
 */
export function usePhotoImages(photo: SourcePhoto | null) {
  return useQuery({
    queryKey: ['photo-editor', 'images', photo?.uri],
    enabled: photo !== null,
    staleTime: Infinity,
    gcTime: 0,
    queryFn: async () => {
      if (!photo) throw new Error('Chưa chọn ảnh');
      const full = await decodeImage(photo.uri);
      const preview = resizeImage(full, PREVIEW_MAX_EDGE);
      if (preview !== full) full.dispose();
      const thumb = resizeImage(preview, THUMB_MAX_EDGE);
      return { preview, thumb };
    },
  });
}
