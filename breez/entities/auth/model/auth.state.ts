import AsyncStorage from "@react-native-async-storage/async-storage"
import { atom } from "jotai"
import { atomWithStorage, createJSONStorage } from "jotai/utils"
import { IAuthResponse, ILoginRequest, AuthState } from "./auth.interfaces"
import axios, { AxiosError } from "axios"
import { API } from "../api/api"
import * as SecureStore from 'expo-secure-store'
import { Config } from "@/config"

const API_URL = Config.HOME_URL
const storage = createJSONStorage<AuthState>(()=> AsyncStorage)
const INITIAL_STATE: AuthState = {
    access_token: null,
    isLoading: false,
    error: null,
    user: null
}
export const authAtom = atomWithStorage<AuthState>('auth', INITIAL_STATE, storage)


interface AppError {
    message: string
    code?: number
}

interface RestorePasswordState {
    isLoading: boolean
    error: AppError | null
}

export const RestorePasswordStateAtom = atom<RestorePasswordState> ({
    isLoading: false,
    error: null
})

export const RestorePasswordAtom = atom(
    (get) => get(RestorePasswordStateAtom),
    async (get, set, email:string) => {
        try {
            set(RestorePasswordStateAtom, {isLoading: true, error: null})
            await axios.post(`${API_URL}/api/auth/restore-password`, { email })
            set(RestorePasswordStateAtom, {isLoading: false, error: null})
        } catch (error) {
            let errorMessage = "Ошибка восстановления пароля"
            let errorCode = 500
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage
                errorCode = error.response?.status || errorCode
            }
            set(RestorePasswordStateAtom, {
                isLoading: false,
                error: {message: errorMessage, code: errorCode}
            })
            throw error
        }
    }
)

export const logoutAtom = atom(null, (_get, set) => {
    set(authAtom, INITIAL_STATE)
})

export const loginAtom = atom(
    
    (get) => get(authAtom), 
    async (_get, set, {email, password}: ILoginRequest)=>{
    set(authAtom, {
        ...INITIAL_STATE,
        isLoading: true        
    })
    try {
        const { data } = await axios.post<IAuthResponse>(API.login,{
        email,
        password,
    }, {
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 10000,
    })
    if (!data.accessToken) {
        throw new Error('Сервер не вернул токен')
    }

    set(authAtom, {
        isLoading: false,
        access_token: data.accessToken,
        error: null,
        user: data.user || {id: null, email: email}
        
    }) 
    await SecureStore.setItemAsync('access_token', data.accessToken)
} catch(error) {
     let errorMessage = "Неизвестная ошибка"
     let errorCode = 500
     if (error instanceof AxiosError) {
         errorMessage = error.response?.data?.message || error.message
        errorCode = error.response?.status || errorCode
    console.error('Auth error:', {
        message: errorMessage,
        code: errorCode,
        responseData: error.response?.data
    })}
         set(authAtom, {
             ...INITIAL_STATE,
             error: {
                 message: errorMessage,
                 code: errorCode
             }
         })
     }
}
    
)
