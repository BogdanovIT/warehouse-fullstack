import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, ScrollView, Alert, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAtom } from "jotai";
import { authAtom } from "@/entities/auth/model/auth.state";
import { SystemColors, CustomFonts } from "@/shared/tokens";
import { Config } from "@/config";
import { Button } from "@/button/button";

const API_URL = Config.HOME_URL

const STATUS_OPTIONS = [
    {label: 'Явка' , value: 'present'},
    {label: 'Отсутствует' , value: 'absent'},
    {label: 'Больничный' , value: 'sick'},
    {label: 'Отпуск' , value: 'vacation'},
    {label: 'Командировка' , value: 'business_trip'}
]
interface AttendanceRecord {
    id?: number
    employeeId: number
    fullName: string
    shortName?: string
    position?: string
    status: string
    standartHours: number
    overtimeHours: number
    businessTripHours: number
    comment: string
}
const AttendanceScreen = () => {
    const [auth] = useAtom(authAtom)
    const [records, setRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(false)
    const today = new Date().toISOString().split('T')[0]
    const [selectedDate, setSelectedDate] = useState(today)
    const prettyDate = new Date(selectedDate).toLocaleDateString('ru-RU')
    const fetchAttendance = useCallback(async (date: string) => {
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/attendance/${date}`, {
                headers: {
                    'Authorization': `Bearer ${auth.access_token}`},
            })
            const data = await response.json()
            if (response.ok) {
                setRecords(data)
            }
        } catch (error) {
            console.error("Ошибка загрузки табеля",error)
        } finally {
            setLoading(false)
        }
    }, [auth.access_token])
    useEffect(()=> {
        fetchAttendance(selectedDate)
    }, [selectedDate, fetchAttendance])
    const updateRecord = (employeeId: number, field: string, value: any) => {
        setRecords(prev => prev.map(r => {
            if (r.employeeId !== employeeId) return r
            const updated: AttendanceRecord = { ...r, [field]: value }
            if (field ==='status' && !['present', 'business_trip'].includes(value)) {
                updated.standartHours = 0
                updated.overtimeHours = 0
                updated.businessTripHours = 0
            }
            if (field === 'status' && value ==='present' && r.standartHours === 0) {
                updated.standartHours = 8
            }
            return updated
        }))
    }
    const handleSave = async () => {
        for (const r of records) {
            if (['present', 'business_trip'].includes(r.status) && r.standartHours <= 0) {
                Alert.alert('Ошибка', `У сотрудника ${r.fullName} не указаны часы`)
                return
            }
        }
        try {
            setLoading(true)
            const payload = {
                records: records.map(r => ({
                    employeeId: r.employeeId,
                    status: r.status,
                    standartHours: r.standartHours,
                    overtimeHours: r.overtimeHours,
                    businessTripHours: r.businessTripHours || 0,
                    comment: r.comment || '',
                }))
            }
            const response = await fetch(`${API_URL}/api/attendance/${selectedDate}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.access_token}`,
                },
                body: JSON.stringify(payload)
            })
            if (response.ok) {
                Alert.alert('Готово', `Табель за ${prettyDate} сохранен`)
                fetchAttendance(selectedDate)
            } else {
                const err = await response.json()
                throw new Error(err.message)
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Не удалось сохранить данные'
            Alert.alert('Ошибка', msg)
        } finally {
            setLoading(false)
        }
    }
    const isEditable = (status: string) => ['present', 'business_trip'].includes(status)

    return (
        <View style={styles.container}>
            <View style={styles.dateRow}>
                <TouchableOpacity onPress={() => {
                    const d = new Date(selectedDate)
                    d.setDate(d.getDate() - 1)
                    setSelectedDate(d.toISOString().split('T')[0])
                }}>
                    <Text style={styles.dateArrow}>-1</Text>
                </TouchableOpacity>
                <Text style={styles.dateText}>{prettyDate}</Text>
                <TouchableOpacity onPress={() => {
                    const d = new Date(selectedDate)
                    d.setDate(d.getDate() + 1)
                    setSelectedDate(d.toISOString().split('T')[0]) }}>
                    <Text style={styles.dateArrow}>+1</Text>
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                {records.map(rec => (
                    <View key={rec.employeeId} style={styles.card}>
                        <View style={styles.cardHeader}>
                            <View style={styles.cardNameRow}>
                                <Text style={styles.cardName}>{rec.fullName}</Text>
                                {rec.position && <Text style={styles.cardPos}>{rec.position}</Text>}
                            </View>
                            <View style={styles.statusPickerWrapper}>
                                <Picker 
                                    selectedValue={rec.status}
                                    onValueChange={(val) => updateRecord(rec.employeeId, 'status', val)}
                                    style={styles.statusPicker}
                                    dropdownIconColor={SystemColors.PrimaryBlue}>
                                        {STATUS_OPTIONS.map(opt => (
                                            <Picker.Item key={opt.value} label={opt.label} value={opt.value}
                                            color={Platform.OS === 'ios' ? SystemColors.PrimaryBlue : undefined} />
                                        ))}
                                    </Picker>
                            </View>
                        </View>
                        {isEditable(rec.status) && (
                            <View style={styles.hoursRow}>
                                <View style={styles.hoursBlock}>
                                    <Text style={styles.hoursLabel}>Часы (оклад)</Text>
                                    <TextInput style={styles.hoursInput} value={String(rec.standartHours)}
                                    onChangeText={(val) => updateRecord(rec.employeeId, 'standartHours', parseFloat(val) || 0)}
                                    keyboardType='decimal-pad' />
                                </View>
                                <View style={styles.hoursBlock}>
                                    <Text style={styles.hoursLabel}>Переработка</Text>
                                    <TextInput style={styles.hoursInput} value={String(rec.overtimeHours)}
                                    onChangeText={(val) => updateRecord(rec.employeeId, 'overtimeHours', parseFloat(val) || 0)}
                                    keyboardType='decimal-pad' />
                                </View>
                                <View style={styles.hoursBlock}>
                                    <Text style={styles.hoursLabel}>Командировка</Text>
                                    <TextInput style={styles.hoursInput} value={String(rec.businessTripHours)}
                                    onChangeText={(val) => updateRecord(rec.employeeId, 'businessTripHours', parseFloat(val) || 0)}
                                    keyboardType='decimal-pad' />
                                </View>
                            </View>
                        )}
                        {!isEditable(rec.status) && (
                            <TextInput style={styles.commentInput} value={rec.comment} onChangeText={(val) => updateRecord(rec.employeeId, 'comment', val)}
                            placeholder="Причина" placeholderTextColor={SystemColors.VeryLightBlue}
                            />
                        )}
                    </View>
                ))}
            </ScrollView>
            <View style={styles.bottomBar}>
                <Button text="Сохранить табель" isLoading={loading} onPress={handleSave} disabled={loading} />
            </View>
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF'
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#F8F9FC',
        borderBottomWidth: 1,
        borderBottomColor: SystemColors.VeryLightBlue
    },
    dateArrow: {
        fontSize: 28,
        color: SystemColors.PrimaryBlue,
        paddingHorizontal: 24,
        fontWeight: '300'
    },
    dateText: {
        fontSize: 18,
        fontWeight: '700',
        color: SystemColors.PrimaryBlue,
        fontFamily: CustomFonts.medium,
        minWidth: 120,
        textAlign: 'center'
    },
    content: {
        padding: 12,
        paddingBottom: 100
    },
    card: {
        backgroundColor: '#F8F9FC',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: SystemColors.LightBlue
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    cardNameRow: {
        flex: 1,
        marginRight: 10
    },
    cardName: {
        fontSize: 16,
        fontWeight: '600',
        color: SystemColors.PrimaryBlue,
        fontFamily: CustomFonts.medium
    },
    cardPos: {
        fontSize: 12,
        color: '#666',
        marginTop: 2
    },
    statusPickerWrapper: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 9,
        backgroundColor: '#FFFFFF',
        width: 150
    },
    statusPicker: {
        height: Platform.OS === 'ios' ? 120 : 40,
        color: SystemColors.PrimaryBlue
    },
    hoursRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: SystemColors.VeryLightBlue
    },
    hoursBlock: {
        flex: 1
    },
    hoursLabel: {
        fontSize: 11,
        color: '#888',
        marginBottom: 4
    },
    hoursInput: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 6,
        padding: 8,
        fontSize: 15,
        color: SystemColors.PrimaryBlue,
        backgroundColor: '#FFFFFF',
        textAlign: 'center'
    },
    commentInput: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        color: SystemColors.PrimaryBlue,
        backgroundColor: '#FFFFFF'
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: SystemColors.VeryLightBlue
    }
})

export default AttendanceScreen