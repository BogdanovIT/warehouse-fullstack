import { authAtom } from "@/entities/auth/model/auth.state";
import { useAtom } from "jotai";
import React, { useEffect, useState } from "react";
import { Alert } from "react-native";
import  PasswordChangeModal  from "@/components/PasswordChangeModal"
import { Config } from "@/config";

const API_URL = Config.HOME_URL
export default function PasswordCheck({ children }: {children: React.ReactNode}) {
    const [auth] = useAtom(authAtom)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [passwordStatus, setPasswordStatus] = useState<any>(null)

    useEffect(() => {
        if (auth.access_token) {
            checkPasswordStatus()
        }
    }, [auth.access_token])

    const checkPasswordStatus = async () => {
    try {
        const response = await fetch(`${API_URL}/api/auth/password-status`, {
            headers: {
                'Authorization': `Bearer ${auth.access_token}`
            }
        })
        const data = await response.json()
        setPasswordStatus(data)
        if (data.passwordExpired) {
            setShowPasswordModal(true)
        } else if (data.warning) {
            Alert.alert('Рекомендуется сменить пароль', `Ваш пароль будет действовать ещё ${data.daysLeft} дней. Хотите сменить его сейчас?`,
                [
                    {
                        text: 'Сменить',
                        onPress: () => setShowPasswordModal(true)
                    },
                    {
                        text: 'Позже',
                        style: "cancel"
                    }
                ]
            )
        }
    } catch(error) {
        console.error('Ошибка проверки статуса пароля', error)
    }
}
return (
    <>
        {children}
        {auth.access_token && (
            <PasswordChangeModal 
            visible={showPasswordModal}
            onClose={()=> setShowPasswordModal(false)}
            isMandatory={passwordStatus?.passwordExpired}
            daysLeft={passwordStatus?.daysLeft}
            />
        )}
    </>
)
}



