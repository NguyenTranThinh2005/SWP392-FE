export type UserRole = 'Mangaka' | 'Assistant' | 'Tantou Editor' | 'Editorial Board'

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
  active: boolean
}
