export const ROLE_IDS = {
  'Admin': 'BE9F220B-48DA-441F-9201-4B7F2A97C99B',
  'Mangaka': 'A5B9C8E7-1234-4567-89AB-CDEF01234567',
  'TantouEditor': 'B6C7D8E9-2345-5678-90AB-CDEF01234568',
  'EditorialBoard': 'C7D8E9F0-3456-6789-01AB-CDEF01234569',
  'EditorInChief': 'D8E9F0A1-4567-7890-12AB-CDEF01234570',
  'Assistant': 'E9F0A1B2-5678-8901-23AB-CDEF01234571'
} as const;

export type Role = keyof typeof ROLE_IDS;

export const roles = {
  MANGAKA: 'Mangaka',
  ASSISTANT: 'Assistant',
  TANTOU_EDITOR: 'TantouEditor',
  EDITORIAL_BOARD: 'EditorialBoard',
  EDITOR_IN_CHIEF: 'EditorInChief',
  ADMIN: 'Admin',
} as const;
