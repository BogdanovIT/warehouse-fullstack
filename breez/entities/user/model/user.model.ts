
export interface User {
    id: number
    name?: string
    surname?: string
    photo?: string
    email?: string
    firstName?: string
    lastName?: string
    place?: string
    operators?: string[]
    loginLv?: string
    is_blocked?: boolean
    emailVerified?: boolean
    roles?: Array<{
        id?: number
        code: string
        name: string
        isPrimary?: boolean
    }>
    permissions?: string[]
    primaryRole?: string | null
}