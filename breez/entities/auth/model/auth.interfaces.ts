export interface IAuthResponse {
    accessToken: string
    user?: {
        id: string
        email: string
        firstName?: string
        lastName?:string
    }
}

export interface AppError {
    message: string,
    code?: number
}

export interface ILoginRequest {
    email: string
    password: string
}
export interface AuthState {
    access_token: string | null
    isLoading: boolean
    error: {
        message: string
        code?: number
    } | null
    user: {
        id: string | null
        email: string | null
    } | null
}