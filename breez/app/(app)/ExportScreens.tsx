import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, StyleSheet, Switch, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAtom } from "jotai";
import { authAtom } from "@/entities/auth/model/auth.state";
import { CustomFonts, SystemColors } from "@/shared/tokens";
import { Config } from "@/config";
import { Button } from "@/button/button";
import { userProfileAtom } from "@/entities/user/model/user.state";

const API_URL = Config.HOME_URL
const ADMINS_LIST = [
    { email: 'kserova@breez.ru', name: 'Серова К.А.' },
    { email: 'alarionov@breez.ru', name: 'Ларионов А.С.' },
    { email: 'mchetyrin@breez.ru', name: 'Четырин М.В.' },
]
interface EmployeeOptions {
    id: number,
    fullName: string
}

const ExportScreen = () => {
    const [auth] = useAtom(authAtom)
    const [userProfile] = useAtom(userProfileAtom)
    const isSuperuser = userProfile?.roles?.some((r: any) => r.code === 'superuser') ?? false

    const [employees, setEmployees] = useState<EmployeeOptions[]>([])
    const [employeeId, setEmployeeId] = useState<number | string>('')
    const [department, setDepartment] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState(false)

    const [notifyAdmins, setNotifyAdmins] = useState(false)
    const [selectedAdmins, setSelectedAdmins] = useState<Record<string, boolean>>({})

    useEffect(() => {
        fetchEmployees()
    }, [])
    const fetchEmployees = async () => {
        try {
            const response = await fetch(`${API_URL}/api/employees`, {
                headers: {'Authorization': `Bearer ${auth.access_token}`},
            })
            const data = await response.json()
            if (response.ok) setEmployees(data)
        } catch (error) {
            console.error('Ошибка загрузки сотрудника:', error)
        }
    }
    const toggleAdmin = (email: string) => {
        setSelectedAdmins(prev => ({
            ...prev,
            [email]: !prev[email],
        }))
    }
    const handleExport = async () => {
        if (!startDate || !endDate) {
            Alert.alert('Ошибка', 'Укажите даты начала и окончания периода')
            return
        }
        try {
            setLoading(true)
            const params = new URLSearchParams({
                startDate,
                endDate,
                employeeId: String(employeeId || ''),
                notifyAdmins: notifyAdmins ? 'true' : 'false',
                selectedAdmins: Object.keys(selectedAdmins).filter(k => selectedAdmins[k]).join(','),
            })
            if (department) params.append('department', department)
            
            const response = await fetch(`${API_URL}/api/choz-rabota/export?${params.toString()}`, {
                headers: {'Authorization': `Bearer ${auth.access_token}`},
            })
            const data = await response.json()
            if (response.ok) {
                Alert.alert('Готово', data.message)
            } else {
                throw new Error(data.message)
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Не удалось выполнить выгрузку'
            Alert.alert('Ошибка', msg)
        } finally {
            setLoading(false)
        }
    }
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Выгрузка хозработ</Text>
            <Text style={styles.label}>Сотрудник</Text>
            <View style={styles.pickerWrapper}>
                <Picker
                    selectedValue={employeeId}
                    onValueChange={setEmployeeId}
                    style={styles.picker}
                    dropdownIconColor={SystemColors.PrimaryBlue}
                    >
                        <Picker.Item label="Все сотрудники" value="" color="#999"/>
                        {employees.map((emp) => (
                            <Picker.Item key={emp.id} label={emp.fullName} value={emp.id}
                            color={Platform.OS === 'ios' ? SystemColors.PrimaryBlue : undefined}/>
                        ))}
                    </Picker>
            </View>
            <Text style={styles.label}>Период</Text>
            <View style={styles.dateRow}>
                <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>C</Text>
                    <TextInput 
                        style={styles.dateInput}
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={SystemColors.VeryLightBlue}
                        />
                </View>
                <View style={styles.dateBlock}>
                    <Text style={styles.dateLabel}>По</Text>
                    <TextInput 
                        style={styles.dateInput}
                        value={startDate}
                        onChangeText={setStartDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={SystemColors.VeryLightBlue}
                        />
                </View>
            </View>
            <View style={styles.adminSection}>
                <View style={styles.adminHeader}>
                    <Text style={styles.label}>Отправить копию администраторам</Text>
                    <Switch 
                        value={notifyAdmins}
                        onValueChange={setNotifyAdmins}
                        trackColor={{ false: '#ccc', true: SystemColors.LightBlue }}
                        thumbColor={notifyAdmins ? SystemColors.PrimaryBlue : '#f4f3f4'}
                        />
                </View>
                {notifyAdmins && (
                    <View style={styles.adminList}>
                        {ADMINS_LIST.map((admin) => (
                            <TouchableOpacity
                                key={admin.email}
                                style={[
                                    styles.adminChip,
                                    selectedAdmins[admin.email] && styles.adminChipActive,
                                ]}
                                onPress={()=> toggleAdmin(admin.email)}>
                                    <Text style={[
                                        styles.adminChipText,
                                        selectedAdmins[admin.email] && styles.adminChipTextActive,
                                    ]}>
                                        {admin.name}
                                    </Text>
                                </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
            <View style={styles.buttonWrapper}>
                <Button text="Сформировать отчет" isLoading={loading} onPress={handleExport} disabled={loading}/>
            </View>
        </ScrollView>
    )
}
    
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    content: {
        padding: 16,
        paddingBottom: 40
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: SystemColors.PrimaryBlue,
        marginBottom: 20,
        fontFamily: CustomFonts?.medium
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: SystemColors.PrimaryBlue,
        marginBottom: 6,
        marginTop: 16
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 9,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden'
    },
    picker: {
        height: Platform.OS === 'ios' ? 180 : 50,
        color: SystemColors.PrimaryBlue,
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
        marginBottom: 4
    },
    dateInput: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 9,
        padding: 12,
        fontSize: 15,
        color: SystemColors.PrimaryBlue,
        backgroundColor: '#FAFBFC',
        textAlign: 'center'
    },
    adminSection: {
        marginTop: 20
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
        fontWeight: '600',
    },
    buttonWrapper: {
        marginTop: 30,
    }
})

export default ExportScreen