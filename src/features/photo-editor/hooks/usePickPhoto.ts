import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { pickPhoto } from '../api/photo.api';
import { useEditorStore } from '../store/editor.store';

/** Opens the gallery picker and navigates to the editor on selection. */
export function usePickPhoto() {
  const router = useRouter();
  const openPhoto = useEditorStore((s) => s.openPhoto);

  return useMutation({
    mutationFn: pickPhoto,
    onSuccess: (photo) => {
      if (!photo) return;
      openPhoto(photo);
      router.push('/editor');
    },
  });
}
