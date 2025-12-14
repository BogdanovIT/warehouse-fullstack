import {router} from 'expo-router'
import axios from "axios";
import { Config } from "@/config";
import * as SecureStore from 'expo-secure-store'
import { authAtom, logoutAtom } from "../model/auth.state";
import { getDefaultStore } from "jotai";

const store = getDefaultStore()

export const apiClient = axios.create({
    baseURL: Config.HOME_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true
            await SecureStore.deleteItemAsync('access_token')
            store.set(authAtom, {
                access_token: null,
                isLoading: false,
                error: null,
                user: null
            })
            router.replace('/login')
        return Promise.reject(error)
        }
        return Promise.reject(error)
    }
)