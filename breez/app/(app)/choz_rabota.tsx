import React, { useEffect, useState} from "react";
import { View, Text, TextInput, ScrollView, Alert, StyleSheet, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import SwitchButton from "@/switch/switch";
import { Button } from "@/button/button";
import { SystemColors } from "@/shared/tokens";
import { Config } from "@/config";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/entities/user/model/user.state";
import { getUserProfile } from "@/api/user";
import { authAtom } from "@/entities/auth/model/auth.state";

const API_URL = Config.HOME_URL
const WORK_TYPES = [
    "W001-Work,work!",
    "W002-Переупаковка товара",
    "W003-Перекладка паллет",
    "W004-Ремонт паллет",
    "W005-Уборка",
    "W006-ПРР без системы",
    "W007-Инвентаризация",
    "W008-Замеры",
    "W009-Стикеровка",
    "W010-Технологические работы",
    "W011-Задачи КРО",
    "W012-хоз работы",
]
const ChozRabotaScreen = () => {
    const [auth] = useAtom(authAtom)
    const [userProfile, setUserProfile] = useAtom(userProfileAtom)
    const [employeeName, setEmployeeName] = useState('')
    const [workType, setWorkType] = useState(WORK_TYPES[0])
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [hadLunch, setHadLunch] = useState(false)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const loadProfile = async () => {
            if (auth?.access_token && !userProfile) {
                try {
                    const profile = await getUserProfile(auth.access_token!)
                    setUserProfile(profile)
                } catch (error) {
                    console.error('Ошибка загрузки профиля', error)
                }
            }
        }
        loadProfile()
    }, [auth?.access_token, userProfile])

    const calcTotalTime =() => {
        if (!startTime || !endTime) return '-'
        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return '-'
        let totalMinutes = (eh * 60 + em) - (sh * 60 + sm)
        if (hadLunch) totalMinutes -= 60
        if (totalMinutes <0) return '-'
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        return `${hours}:${minutes.toString().padStart(2, '0')}`
    }
    const handleSave = async () => {
        if (!employeeName.trim()) {
            Alert.alert('Ошибка', 'Введите ФИО сотрудника')
            return
        }
        if (!startTime || !endTime) {
            Alert.alert('Ошибка', 'Укажите время начала и окончания работ')
            return
        }
        const totalTime = calcTotalTime()
        if (totalTime === '-') {
            Alert.alert('Ошибка', 'Проверьте правильность указанного времени')
            return
        }
        const payload = {
            employeeName: employeeName.trim(),
            workType,
            startTime,
            endTime,
            hadLunch,
            comment: comment.trim()
        }
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/choz-rabota`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.access_token}`,
                },
                body: JSON.stringify(payload),
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.message || 'Не удалось сохранить данные.')
            }
            setEmployeeName('')
            setStartTime('')
            setEndTime('')
            setHadLunch(false)
            setComment('')
            setWorkType(WORK_TYPES[0])
            Alert.alert('Готово', 'Запись сохранена')
        } catch (error: unknown) {
            if (error instanceof Error) {
            Alert.alert('Ошибка', error.message)
            } else {
                Alert.alert('Ошибка', 'Не удалось сохранить данные')
                console.error(error)
            }
        } finally {
            setLoading(false)
        }
    }
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.label}>ФИО сотрудника</Text>
            <TextInput
                style={styles.input}
                value={employeeName}
                onChangeText={setEmployeeName}
                placeholder="Иванов Иван Иванович"
                placeholderTextColor={SystemColors.VeryLightBlue}
                autoCapitalize="words" />
            <Text style={styles.label}>Вид работ</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={workType}
                    onValueChange={setWorkType}
                    style={styles.picker}
                    dropdownIconColor={SystemColors.PrimaryBlue}>
                {WORK_TYPES.map((type) => (
                    <Picker.Item
                        key={type}
                        label={type}
                        value={type}
                        color={Platform.OS === 'ios' ? SystemColors.PrimaryBlue : undefined}
                        />
                ))}
                </Picker>
            </View>
            <View style={styles.timeRow}>
                <View style={styles.timeBlock}>
                    <Text style={styles.label}>Начало работ</Text>
                    <TextInput 
                        style={styles.timeInput}
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="08:00"
                        placeholderTextColor={SystemColors.VeryLightBlue}
                        keyboardType='numbers-and-punctuation'
                        maxLength={5}/>
                </View>
                <View style={styles.timeBlock}>
                    <Text style={styles.label}>Окончание работ</Text>
                    <TextInput 
                        style={styles.timeInput}
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="17:00"
                        placeholderTextColor={SystemColors.VeryLightBlue}
                        keyboardType='numbers-and-punctuation'
                        maxLength={5}/>
                </View>
            </View>
            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                    {hadLunch ? 'Обед учтен (1час)' : 'Без обеда'}
                </Text>
                <SwitchButton value={hadLunch} onChange={setHadLunch}/>
            </View>
            <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Итого: </Text>
                <Text style={styles.totalValue}>{calcTotalTime()}</Text>
            </View>
            <Text style={styles.label}>Комментарий</Text>
            <TextInput 
                style={[styles.input, styles.multiline]}
                value={comment}
                onChangeText={setComment}
                placeholder="Краткий комментарий"
                placeholderTextColor={SystemColors.VeryLightBlue}
                multiline
                numberOfLines={3}
                textAlignVertical="top" />
            <View style={styles.buttonWrapper}>
                <Button
                    text="Записать"
                    isLoading={loading}
                    onPress={handleSave}
                    disabled={loading} />
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SystemColors.MutedBlue
    },
    content: {
        padding: 16,
        paddingBottom: 40
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: SystemColors.VeryLightBlue,
        marginBottom: 6,
        marginTop: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: SystemColors.PrimaryBlue,
        backgroundColor: SystemColors.MutedBlue
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 8,
        backgroundColor: SystemColors.MutedBlue,
        overflow: 'hidden'
    },
    picker: {
        height: Platform.OS === 'ios' ? 180 : 50,
        color: SystemColors.PrimaryBlue
    },
    timeRow: {
        flexDirection: 'row',
        gap: 12
    },
    timeBlock: {
        flex: 1,
    },
    timeInput: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: SystemColors.PrimaryBlue,
        backgroundColor: SystemColors.MutedBlue,
        textAlign: 'center'
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingVertical: 8
    },
    switchLabel: {
        fontSize: 16,
        color: SystemColors.PrimaryBlue,
        fontWeight: '500'
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: SystemColors.VeryLightBlue,
        borderBottomWidth: 1,
        borderBottomColor: SystemColors.VeryLightBlue
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: SystemColors.VeryLightBlue,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '700',
        color: SystemColors.LightBlue
    },
    buttonWrapper: {
        marginTop: 24,
    }
})

export default ChozRabotaScreen
