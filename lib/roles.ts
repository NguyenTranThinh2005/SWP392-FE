export const roles = {
  MANGAKA: 'Mangaka',
  ASSISTANT: 'Assistant',
  TANTOU_EDITOR: 'Tantou Editor',
  EDITORIAL_BOARD: 'Editorial Board',
} as const

export type Role = (typeof roles)[keyof typeof roles]

export const roleLabels: Record<Role, string> = {
  [roles.MANGAKA]: 'Mangaka',
  [roles.ASSISTANT]: 'Assistant',
  [roles.TANTOU_EDITOR]: 'Tantou Editor',
  [roles.EDITORIAL_BOARD]: 'Editorial Board',
}
