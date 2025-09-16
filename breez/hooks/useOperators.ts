import { useState, useEffect } from "react";
import axios, {AxiosError} from "axios";
import { Alert } from "react-native";
import { useAtom } from "jotai";
import { authAtom } from "../entities/auth/model/auth.state";

interface OperatorsResponse {
    success: boolean
    operators?: string []
    error?: string
    message?: string
}
export const useOperators = () => {
    const [auth] = useAtom(authAtom)
    const [operators, setOperators] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchOperators = async () => {
        if (!auth.access_token) {
            setError('Требуется авторизация')
            return
        }
        setIsLoading(true)
        setError(null)

        try {
            const {data} = await axios.get<OperatorsResponse>('/api/user/operators', {
                headers: {
                    Authorization: `Bearer ${auth.access_token}`
                }
            })
            if (data.success && data.operators) {
                setOperators(data.operators)
            } else {
                setError(data.message || "Не удалось найти операторов")
                setOperators([])
            }
        } catch(err) {
            const error = err as AxiosError<OperatorsResponse>
            setError(
                error.response?.data?.error ||
                error.response?.data.message ||
                "Ошибка соединения с сервером"
            )
            setOperators([])
        } finally {
            setIsLoading(false)
        }
    }
    useEffect(() => {
        fetchOperators()
    }, [auth?.access_token])
    return {
        operators,
        isLoading,
        error,
        refresh: fetchOperators,
        hasOperators: operators.length > 0
    }
}