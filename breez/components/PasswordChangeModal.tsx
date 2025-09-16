import { useState } from "react";
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { router } from "expo-router";
import { CustomFonts, SystemColors } from "../shared/tokens";
import { Button } from "../button/button"
import { useAtom } from "jotai";
import { authAtom } from "@/entities/auth/model/auth.state";

export default function PasswordChangeModal ({
    visible, 
    onClose, 
    isMandatory = false, 
    daysLeft = 0
}: {
    visible: boolean
    onClose: () => void
    isMandatory: boolean
    daysLeft: number 
}) {
    const [auth] = useAtom(authAtom)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Ошибка", "Все поля обязательны для заполнения") 
            return
        }
        if (newPassword !== confirmPassword) {
            Alert.alert("Ошибка", "Новые пароли не совпадают")
            return
        }
        setIsLoading(true)
        try {
            const response = await fetch('https://literally-fair-lark.cloudpub.ru/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.access_token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            })
            const data = await response.json()
            if (data.success) {
                Alert.alert("Успех", "Пароль успешно изменен")
                onClose()
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                Alert.alert("Ошибка", data.error || "Не удалось изменить пароль")
            }
        } catch(error) {
            Alert.alert("Ошибка", "Не удалось подключиться к серверу")
        } finally {
            setIsLoading(false)
        }
    }
        const handleCancel = () => {
            if (isMandatory) {
                Alert.alert(
                    "Внимание", "Для продолжения работы необходимо сменить пароль. Обратитесь к администратору",
                    [
                        {
                            text: "Выйти",
                            onPress: () => {router.replace('/login')},
                            style: 'destructive'
                        }
                    ],
                    {cancelable: false}
                )
            } else {
                onClose()
            }
        }
        return (
            <Modal visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={isMandatory ? undefined : handleCancel}
            >
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.title}>
                            {isMandatory ? 'Срок действия пароля истек' : 'Рекомендуется сменить пароль'}
                        </Text>
                        {!isMandatory && (
                            <Text style={styles.subtitle}>
                                Ваш пароль действителен {daysLeft} дней
                            </Text>
                        )}
                        <Text style={styles.label}>Текущий пароль:</Text>
                        <TextInput 
                        style={styles.input}
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        placeholder="Введите текущий пароль"
                        placeholderTextColor={SystemColors.VeryLightBlue} />
                        <Text style={styles.label}>Новый пароль:</Text>
                        <TextInput 
                        style={styles.input}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Введите новый пароль"
                        placeholderTextColor={SystemColors.VeryLightBlue} />
                        <Text style={styles.label}>Повторите новый пароль:</Text>
                        <TextInput 
                        style={styles.input}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Повторите новый пароль"
                        placeholderTextColor={SystemColors.VeryLightBlue} />
                        <View style={styles.buttonsContainer}>
                            {!isMandatory && (
                                <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancel}
                                disabled={isLoading}>
                                    <Text style={styles.cancelButtonText}>Отмена</Text>
                                </TouchableOpacity>
                            )}
                            <Button 
                            text="Сменить пароль"
                            onPress={handleSubmit}
                            isLoading={isLoading}
                            style={styles.submitButton}/>
                        </View>
                    </View>
                </View>
            </Modal>
        )
    }

    const styles = StyleSheet.create ({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20
        },
        modal: {
            backgroundColor: SystemColors.MutedBlue,
            borderRadius: 12,
            padding: 24,
            width: '100%',
            maxWidth: 400
        },
        title: {
            fontFamily: CustomFonts.bold,
            fontSize: 18,
            color: SystemColors.VeryLightBlue,
            textAlign: 'center',
            marginBottom: 8
        },
        subtitle: {
            fontFamily: CustomFonts.regular,
            fontSize: 14,
            color: SystemColors.VeryLightBlue,
            textAlign: 'center',
            marginBottom: 20,
            opacity: 0.8
        },
        label: {
            fontFamily: CustomFonts.medium,
            fontSize: 14,
            color: SystemColors.VeryLightBlue,
            marginBottom: 8,
            marginTop: 12
        },
        input: {
            backgroundColor: SystemColors.MutedBlue,
            borderWidth: 1,
            borderColor: SystemColors.VeryLightBlue,
            borderRadius: 6,
            padding: 12,
            color: SystemColors.VeryLightBlue,
            fontFamily: CustomFonts.regular
        },
        buttonsContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
            gap: 12
        },
        cancelButton: {
            flex: 1,
            padding: 12,
            borderRadius: 6,
            backgroundColor: SystemColors.MutedBlue,
            borderWidth: 1,
            borderColor: SystemColors.VeryLightBlue,
            justifyContent: 'center',
            alignItems: 'center'
        },
        cancelButtonText: {
            color: SystemColors.VeryLightBlue,
            fontFamily: CustomFonts.medium
        },
        submitButton: {
            flex: 2
        },
    })

