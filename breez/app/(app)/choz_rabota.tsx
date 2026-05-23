import React, { use, useEffect, useState} from "react";
import { View, Text, TextInput, ScrollView, Alert, StyleSheet, Platform, TouchableOpacity, Modal, Switch } from "react-native";
import { Picker } from "@react-native-picker/picker";
import SwitchButton from "@/switch/switch";
import { Button } from "@/button/button";
import { CustomFonts, SystemColors } from "@/shared/tokens";
import { Config } from "@/config";
import { useAtom } from "jotai";
import { userProfileAtom } from "@/entities/user/model/user.state";
import { getUserProfile } from "@/api/user";
import { authAtom } from "@/entities/auth/model/auth.state";

const API_URL = Config.HOME_URL
const ADMINS_LIST = [
    { email: 'kserova@breez.ru', name: 'Серова К.А.' },
    { email: 'alarionov@breez.ru', name: 'Ларионов А.С.' },
    { email: 'mchetyrin@breez.ru', name: 'Четырин М.В.' },
]
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
interface EmployeeOptions {
    id: number,
    fullName: string
}
const ChozRabotaScreen = () => {
    const [auth] = useAtom(authAtom)
    const [userProfile, setUserProfile] = useAtom(userProfileAtom)
    const [employees, setEmployees] = useState<EmployeeOptions[]>([])
    const [employeeId, setEmployeeId] = useState<number | null>(null)
    const [workType, setWorkType] = useState(WORK_TYPES[0])
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [hadLunch, setHadLunch] = useState(false)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)

    const [exportVisible, setExportVisible] = useState(false)
    const [exportEmployeeId, setExportEmployeeId] = useState<number | string>('')
    const [exportStartDate, setExportStartDate] = useState('')
    const [exportEndDate, setExportEndDate] = useState('')
    const [exportLoading, setExportLoading] = useState(false)
    const [notifyAdmins, setNotifyAdmins] = useState(false)
    const [selectedAdmins, setSelectedAdmins] = useState<Record<string, boolean>>({})

    const isSuperuser = userProfile?.roles?.some((r: any) => r.code === 'superuser') ?? false

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

    useEffect(()=>{
        fethEmployees()
    }, [])

    const fethEmployees = async () => {
        try {
            const response = await fetch(`${API_URL}/api/employees`, {
                headers: {'Authorization': `Bearer ${auth.access_token}`}
            })
            const data = await response.json()
            if (response.ok && Array.isArray(data)) {
                setEmployees(data)
                if (data.length > 0 ) {
                    setEmployeeId(data[0].id)
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки сотрудников', error)
        }
    }

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
        if (!employeeId) {
            Alert.alert('Ошибка', 'Выберите сотрудника')
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
        const selectedEmployee = employees.find(e => e.id === employeeId)
        const payload = {
            employeeId,
            employeeName: selectedEmployee?.fullName || '',
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
    const handleExport = async () => {
        if (!exportStartDate || !exportEndDate) {
            Alert.alert('Ошибка', 'Укажите даты начала и окончания периода')
            return
        }
        try {
            setExportLoading(true)
            const params = new URLSearchParams({
                startDate: exportStartDate,
                endDate: exportEndDate,
                employeeId: String(exportEmployeeId || ''),
                notifyAdmins: notifyAdmins ? 'true' : 'false',
                selectedAdmins: Object.keys(selectedAdmins).filter(k => selectedAdmins[k]).join(','),
            })
            const response = await fetch(`${API_URL}/api/choz-rabota/export?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${auth.access_token}` },
            })
            const data = await response.json()
            if (response.ok) {
                Alert.alert('Готово', data.message)
                setExportStartDate('')
                setExportEndDate('')
                setExportEmployeeId('')
                setNotifyAdmins(false)
                setSelectedAdmins({})
                setExportVisible(false)
            } else {
                throw new Error(data.message)
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Не удалось выполнить выгрузку'
            Alert.alert('Ошибка', msg)
        } finally {
            setExportLoading(false)
        }
    }
    const toggleAdmin = (email: string) => {
        setSelectedAdmins(prev => ({ ...prev, [email]: !prev[email]}))
    }
    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                <Text style={styles.label}>ФИО сотрудника</Text>
            <View style={styles.pickerWrapper}>
                <Picker 
                    selectedValue={employeeId}
                    onValueChange={(val) => setEmployeeId(val)}
                    style={styles.picker}
                    dropdownIconColor={SystemColors.PrimaryBlue}
                >
                    {employees.map((emp) => (
                        <Picker.Item
                            key={emp.id}
                            label={emp.fullName}
                            value={emp.id}
                            color={Platform.OS === 'ios' ? SystemColors.PrimaryBlue : undefined}
                            />
                    ))}
                </Picker>
            </View>
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
            <TouchableOpacity style={styles.exportButton} onPress={() => setExportVisible(true)}>
                <Text style={styles.exportButtonText}>Выгрузить данные за период</Text>
            </TouchableOpacity>
            </ScrollView>
            <Modal visible={exportVisible} animationType='slide' transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setExportVisible(false)}>
                                <Text style={styles.closeText}>✖</Text>
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>Выгрузка данных</Text>
                            <View style={{ width: 24 }} />
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Сотрудник</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker selectedValue={exportEmployeeId} onValueChange={(val) => setExportEmployeeId(val)} style={styles.picker} dropdownIconColor={SystemColors.PrimaryBlue}>
                                    <Picker.Item label="Все сотрудники" value="" color="#999"/>
                                    {employees.map((emp) => (
                                        <Picker.Item key={emp.id} label={emp.fullName} value={emp.id}
                                        color={Platform.OS === 'ios' ? SystemColors.PrimaryBlue : undefined} />                                    
                                        ))}
                                </Picker>
                            </View>
                            <Text style={styles.label}>Период</Text>
                            <View style={styles.dateRow}>
                                <View style={styles.dateBlock}>
                                    <Text style={styles.dateLabel}>C</Text>
                                    <TextInput style={styles.dateInput} value={exportStartDate} onChangeText={setExportStartDate}
                                    placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
                                </View>
                                <View style={styles.dateBlock}>
                                    <Text style={styles.dateLabel}>По</Text>
                                    <TextInput style={styles.dateInput} value={exportEndDate} onChangeText={setExportEndDate}
                                    placeholder="YYYY-MM-DD" placeholderTextColor="#999" />
                                </View>
                            </View>
                            <View style={styles.adminSection}>
                                <View style={styles.adminHeader}>
                                    <Text style={styles.label}>Отправить копию администраторам</Text>
                                    <Switch value={notifyAdmins} onValueChange={setNotifyAdmins} trackColor={{ false: '#ccc', true: SystemColors.LightBlue}} thumbColor={notifyAdmins ? SystemColors.PrimaryBlue : '#f4f3f4'} />
                                </View>
                                {notifyAdmins && (
                                    <View style={styles.adminList}>
                                        {ADMINS_LIST.map((admin) => (
                                            <TouchableOpacity key={admin.email} style={[styles.adminChip, selectedAdmins[admin.email] && styles.adminChipActive]}
                                                onPress={() => toggleAdmin(admin.email) }>
                                                    <Text style={[styles.adminChipText, selectedAdmins[admin.email] && styles.adminChipTextActive]}>{admin.name}</Text>
                                                </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                            <View style={styles.buttonWrapper}>
                                <Button text="Сформировать отчет" isLoading={exportLoading} onPress={handleExport} disabled={exportLoading} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
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
        color: SystemColors.VeryLightBlue,
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
        color: SystemColors.VeryLightBlue
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
        color: SystemColors.VeryLightBlue,
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
        color: SystemColors.VeryLightBlue,
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
        color: SystemColors.VeryLightBlue
    },
    buttonWrapper: {
        marginTop: 24,
    },
    exportButton: {
        marginTop: 16,
        paddingVertical: 14, 
        borderRadius: 9,
        borderWidth: 1,
        borderColor: SystemColors.LightBlue,
        backgroundColor: SystemColors.LightBlue,
        alignItems: 'center'
    },
    exportButtonText: {
        fontSize: 16,
        color: SystemColors.PrimaryBlue,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)'
    },
    modalContent: {
        flex: 1,
        backgroundColor: SystemColors.MutedBlue,
        marginTop: 60,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 16
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: SystemColors.PrimaryBlue,
        fontFamily: CustomFonts?.medium
    },
    closeText: {
        fontSize: 20,
        color: SystemColors.PrimaryBlue,
        padding: 4
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12
    },
    dateBlock: {
        flex: 1
    },
    dateLabel: {
        fontSize: 13,
        color: SystemColors.PrimaryBlue,
        marginBottom: 4,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 9,
        padding: 10,
        fontSize: 15, 
        color: SystemColors.PrimaryBlue,
        backgroundColor: SystemColors.MutedBlue,
        textAlign: 'center'
    },
    adminSection: {
        marginTop: 20,
    },
    adminHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    adminList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10
    },
    adminChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        backgroundColor: '#FAFBFC'
    },
    adminChipActive: {
        backgroundColor: SystemColors.LightBlue,
        borderColor: SystemColors.LightBlue
    },
    adminChipText: {
        fontSize: 13,
        color: SystemColors.PrimaryBlue
    },
    adminChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '600'
    }
})

export default ChozRabotaScreen
