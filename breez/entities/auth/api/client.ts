import { router } from 'expo-router'
import axios from "axios";
import { Config } from "@/config";
import * as SecureStore from 'expo-secure-store'
import { logoutAtom } from "../model/auth.state";
import { getDefaultStore } from "jotai";

const store = getDefaultStore()

export const apiClient = axios.create({
    baseURL: Config.HOME_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

apiClient.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('access_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const status = error.response?.status
        const errorCode = error.response?.data?.code

        // Проверяем 401 или 403 (если токен протух)
        if ((status === 401 || status === 403) && !originalRequest._retry) {
            originalRequest._retry = true
            await SecureStore.deleteItemAsync('access_token')
            store.set(logoutAtom)
            
            // Перенаправляем на логин
            setTimeout(() => {
                router.replace('/login')
            }, 100)
        }
        return Promise.reject(error)
    }
)