export const pdfFileKeys = {
  all: ['pdf-files'] as const,
  detail: (id: string) => ['pdf-files', id] as const,
};
