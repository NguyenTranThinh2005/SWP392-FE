export type UserRole = 'Mangaka' | 'Assistant' | 'TantouEditor' | 'EditorialBoard'

export interface User {
  id: string
  name: string
  email: string
  roles: UserRole[]
  active: boolean
}
