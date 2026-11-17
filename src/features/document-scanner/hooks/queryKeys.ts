export const documentKeys = {
  all: ['documents'] as const,
  detail: (documentId: string) => ['documents', documentId] as const,
  pages: (documentId: string) => ['documents', documentId, 'pages'] as const,
};
