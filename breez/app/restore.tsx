import { View, Text, StyleSheet, KeyboardAvoidingView, Alert } from "react-native";
import { useEffect, useState } from "react";
import { useAtom, useAtomValue } from "jotai";
import { RestorePasswordAtom, RestorePasswordStateAtom } from "../entities/auth/model/auth.state";
import { Input } from "../shared/input/input";
import { Button } from "../button/button";
import { SystemColors } from "../shared/tokens";
import { CustomFonts } from "../shared/tokens";
import { ErrorNotification } from "../shared/ErrorNotifications/ErrorNotification";
import axios from "axios";

export default function RestorePassword() {
    const [email, setEmail] = useState<string>('')
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [step, setStep] = useState(1)
    const [localError, setLocalError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState<boolean>(false)
    const [state, restorePassword] = useAtom(RestorePasswordAtom)
    const [error, setError] = useState('')
    const [passwordErrors, setPasswordErrors] = useState({
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    })

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@breez\.ru$/
        return emailRegex.test(email)
    }

    const checkPasswordStrength = (password: string) => {
        setPasswordErrors({
            hasUpperCase: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
            hasMinLength: password.length >= 8
        })
    }
    const validatePassword = () => {
        return Object.values(passwordErrors).every(error => error === true)
    }
    const validateStep1 = () => {
        if (!validateEmail(email)) {
            Alert.alert("Ошибка", "Указан сторонний email, укажите корпоративный email")
            return false
        }
        return true
    }
    const validateStep2 = () => {
        if (!validatePassword()) {
            Alert.alert("Ошибка", "Пароль не соответствует требованиям безопасности")
            return false
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Ошибка", "Пароли не совпадают")
            return false
        }
        return true
    }

    const sendCode = async () => {
        if (!validateStep1()) return
        try {
            await axios.post('https://literally-fair-lark.cloudpub.ru/api/auth/restore-password', {email})
            setStep(2)
            setError('')
        } catch {
            setError("Ошибка отправки кода")
        }
    }
    const resetPassword = async () => {
        if (!validateStep2()) return
        try {
            await axios.post('https://literally-fair-lark.cloudpub.ru/api/auth/reset-password', {
                email, 
                code,
                newPassword
            })
            alert("Пароль успешно изменен")
            setIsSuccess(true)
        } catch {
            setError("Неверный код или ошибка сервера")
        }
    }
    return (
     <View style={styles.container}>
        {step === 1 ? (
            <>
                <Input
                style={{width: '85%', alignSelf: 'center', borderWidth: 1.5, 
                    borderColor: SystemColors.VeryLightBlue, borderRadius: 3}}
                placeholder="Email только @breez.ru"
                value={email}
                onChangeText={setEmail}
                keyboardType='email-address'
                autoCapitalize="none"
                
                />
                <Button style={{width: '85%', alignSelf: 'center', paddingTop: 20}} text="Отправить код"
                onPress={sendCode}
                />
            </>
        ) : (
            <>
            <Input
                placeholder="Код из письма"
                value={code}
                onChangeText={setCode}
                style={{width: '85%', alignSelf: 'center', borderWidth: 1.5, 
                borderColor: SystemColors.VeryLightBlue, borderRadius: 3}}
            />
            <Input 
                style={{width: '85%', alignSelf: 'center', borderWidth: 1.5, 
                    borderColor: SystemColors.VeryLightBlue, borderRadius: 3}}
                placeholder="Новый пароль"
                secureTextEntry
                value={newPassword}
                onChangeText={(text) => {
                    setNewPassword(text)
                    checkPasswordStrength(text)
                }}
            />
            <View style={styles.passwordHintContainer}>
                <Text style={styles.passwordHintTitle}>Пароль должен содержать:</Text>
                <Text style= {[styles.passwordHint, passwordErrors.hasMinLength && styles.passwordHintValid]}>
                    Минимум 8 символов
                </Text>
                <Text style= {[styles.passwordHint, passwordErrors.hasUpperCase && styles.passwordHintValid]}>
                    Заглавные буквы (A-Z)
                </Text>
                <Text style= {[styles.passwordHint, passwordErrors.hasLowerCase && styles.passwordHintValid]}>
                    Строчные буквы (a-z)
                </Text>
                <Text style= {[styles.passwordHint, passwordErrors.hasNumber && styles.passwordHintValid]}>
                    Цифры (0-9)
                </Text>
                <Text style= {[styles.passwordHint, passwordErrors.hasSpecialChar && styles.passwordHintValid]}>
                    Спецсимволы (!@#$%^& и др.)
                </Text>
            </View>
            <Input  style={{width: '85%', alignSelf: 'center', borderWidth: 1.5, 
                    borderColor: SystemColors.VeryLightBlue, borderRadius: 3,}}
                    placeholder="Подтвердите пароль"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
             />
                
            <Button style={{width: '85%', alignSelf: 'center', paddingTop: 20}} text="Сменить пароль"
            onPress={resetPassword}/>
            </>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
     </View>
    )
}

const styles = StyleSheet.create ({
    container: {
        flex: 1,
        backgroundColor: SystemColors.MutedBlue,
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    form: {
        width: '100%',
        maxWidth: 400,
    },
    successText: {
        color: SystemColors.VeryLightBlue,
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        fontFamily: CustomFonts.medium
    },
    errorText: {
        color: "#ff4444",
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        fontFamily: CustomFonts.medium
    },
    passwordHintContainer: {
        width: '85%',
        alignSelf: 'center',
        marginVertical: 15,
        padding: 10,
        backgroundColor: SystemColors.VeryLightBlue,
        borderRadius: 6
    },
    passwordHintTitle: {
        color: SystemColors.PrimaryBlue,
        fontFamily: CustomFonts.medium,
        marginBottom: 5
    },
    passwordHint: {
        color: '#fc0518',
        fontSize: 12,
        opacity: 0.7
    },
    passwordHintValid: {
        color: '#4caf50',
        opacity: 1
    }
})