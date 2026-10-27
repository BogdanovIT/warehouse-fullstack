import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store'
import { getDefaultStore } from "jotai";
import { logoutAtom } from "@/entities/auth/model/auth.state";

const store = getDefaultStore()

export const apiFetch = async (url: string, options: RequestInit = {}) => {
    let headers: any = {...options.headers}
    if (!headers['Authorization']) {
        const token = await SecureStore.getItemAsync('access_token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
    }
    const response = await fetch(url, { ...options, headers})
    if (response.status === 410 || response.status === 403) {
        try {
            const data = await response.clone().json()
            if (data.code === 'Token expired' || data.code === 'Invalid token' || data.message === 'Token expired') {
                await SecureStore.deleteItemAsync('access_token')
                store.set(logoutAtom);
                router.replace('/login')
                throw new Error('Время сессии истекло, пожалуйста, войдите заново.')
            }
        } catch (error) {
            
        }
    }
    return response
}