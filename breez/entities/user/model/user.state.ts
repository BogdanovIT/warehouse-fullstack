import { atom } from "jotai";
import { User } from "./user.model";
import { authAtom } from "../../auth/model/auth.state";
import axios, { AxiosError } from "axios";
import { API } from "../api/api";
import { apiClient } from "@/entities/auth/api/client";


export const userProfileAtom = atom<User | null>(null)

export const profileAtom = atom<UserState>({
    profile: null,
    isLoading: false,
    error: null
})
export const userRolesAtom = atom((get) => {
    const profile = get(profileAtom).profile
    return profile?.roles || []
})

export const userPermissionsAtom = atom((get) => {
    const profile = get(profileAtom).profile
    const permissions = profile?.permissions || []
    const roles = profile?.roles || []
    if (roles.some(r => r.code === 'superuser')) {
        return ['*']
    }
    return permissions
})

export const hasRoleAtom = atom((get) => (roleCode: string) => {
    const roles = get(userRolesAtom)
    return roles.some(r => r.code === roleCode)
})

export const hasPermissionAtom = atom((get) => (permission: string) => {
    const permissions = get(userPermissionsAtom)
    if (permissions.includes('*')) return true
    return permissions.includes(permission)
})

export const updateProfileAtom = atom(
    async (get) => {
        return get(profileAtom)
    },
    async (get, set, {photo}: {photo?: string}) => {
        try {
            const {access_token} = await get(authAtom)
            const { data } = await apiClient.patch<User>(API.profile, {
                photo,
            }, {
                headers: {
                    Authorization: `Bearer ${access_token}`
                },
            })
            set(profileAtom, {
                isLoading: false,
                profile: data,
                error: null
            })
        } catch (error) {
            if (error instanceof AxiosError) {
                set(profileAtom, {
                    isLoading: false,
                    profile: null,
                    error: error.response?.data.message
                })
            }
        }
    }
)

export const loadProfileAtom = atom( async (get) => {
   return get(profileAtom)
},
async (get, set) => {
    const {access_token} = await get(authAtom)
    set(profileAtom, {
        isLoading: true,
        profile: null,
        error: null
        })
    try {
        const { data } = await apiClient.get<User>(API.profile, {
            headers: {
                Authorization: `Bearer ${access_token}`
            },
        })
        set(profileAtom, {
            isLoading: false,
            profile: data,
            error: null
        })
        set(userProfileAtom, data)
    } catch (error) {
        if (error instanceof AxiosError) {
            set(profileAtom, {
                isLoading: false,
                profile: null,
                error: error.response?.data.message
            })
        }
    }
    }
)

export interface UserState {
    profile: User | null
    isLoading: boolean
    error: string | null
}