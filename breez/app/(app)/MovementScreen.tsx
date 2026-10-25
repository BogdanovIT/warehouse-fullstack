import React, { useState, useEffect } from "react";
import { View, Text, TextInput, ScrollView, Alert, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAtom } from "jotai";
import { authAtom } from "@/entities/auth/model/auth.state";
import { userProfileAtom } from "@/entities/user/model/user.state";
import { SystemColors, CustomFonts } from "@/shared/tokens";
import { Config } from "@/config";
import { Button } from "@/button/button";
import BarcodeScanner from "@/components/BarcodeScanner";

const API_URL = Config.HOME_URL

const DEPARTMENTS = [
    'СЦ Тестовый',
]
interface EmployeeOption {
    id: number
    fullName: string
}

const MovementScreen = () => {
    const [auth] = useAtom(authAtom)
    const [userProfile] = useAtom(userProfileAtom)
    const [operationType, setOperationType] = useState<'issued' | 'returned'>('issued')
    const [department, setDepartment] = useState(DEPARTMENTS[0])
    const [employees, setEmployees] = useState<EmployeeOption[]>([])
    const [employeeId, setEmployeeId] = useState<number | null>(null)
    const [document, setDocument] = useState('')
    const [qrCodes, setQrCodes] = useState<string[]>([])
    const [scannerVisible, setScannerVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        fetchEmployees()
    }, [department])

    const fetchEmployees = async () => {
        try {
            const response = await fetch(
                `${API_URL}/api/employees?department=${encodeURIComponent(department)}`,
                {headers: { 'Authorization': `Bearer ${auth.access_token}` } }
            )
            const data = await response.json()
            if (response.ok && Array.isArray(data)) {
                setEmployees(data)
                setEmployeeId(data.length > 0 ? data[0].id : null)
            }
        } catch (error) {
            console.error('Ошибка загрузки сотрудников:', error)
        }
    }
    const handleScan = (barcode: string) => {
        setQrCodes(prev => [...prev, barcode])
        setScannerVisible(false)
    }
    const removeQrCode = (index: number) => {
        setQrCodes(prev => prev.filter((_, i) => i !== index))
    }
    const handleSave = async () => {
        if (!employeeId) {
            Alert.alert('Ошибка', 'Выберите сотрудника')
            return
        }
        if (qrCodes.length === 0) {
            Alert.alert('Ошибка', 'Отсканируйте хотя бы одну деталь')
            return
        }
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/movements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.access_token}`
                },
                body: JSON.stringify({
                    operationType,
                    department,
                    employeeId,
                    document: document.trim(),
                    qrCodes,
                })
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.message || 'Ошибка сохранения')
            Alert.alert('Готово', data.message)
            setQrCodes([])
            setDocument('')
        } catch (error: unknown) {
            if (error instanceof Error) Alert.alert('Ошибка', error.message)
        } finally {
            setLoading(false)
        }
    }
    return (
        <ScrollView style={styles.container} contentContainerStyle = {styles.content}>
            {/* тип операции*/}
            <Text style={styles.label}>Тип операции</Text>
            <View style={styles.pickWrapper}>
                <Picker selectedValue={operationType} onValueChange={(v) => setOperationType(v)} style={styles.picker}>
                    <Picker.Item label="Выдача" value='issued' color={SystemColors.PrimaryBlue}/>
                    <Picker.Item label="Возврат" value='returned' color={SystemColors.PrimaryBlue}/>
                </Picker>
            </View>
            {/* Подразделение */}
            <Text style={styles.label}>Подразделение</Text>
            <View style={styles.pickWrapper}>
                <Picker selectedValue={department} onValueChange={setDepartment} style={styles.picker}>
                    {DEPARTMENTS.map(d => (
                        <Picker.Item key={d} label={d} value={d} color={SystemColors.PrimaryBlue} />
                    ))}
                </Picker>
            </View>
            {/* Сотрудник */}
            <Text style={styles.label}>Сотрудник</Text>
            <View style={styles.pickWrapper}>
                <Picker selectedValue={employeeId} onValueChange={setEmployeeId} style={styles.picker}>
                    {employees.map(e => (
                        <Picker.Item key={e.id} label={e.fullName} value={e.id} color={SystemColors.PrimaryBlue} />
                    ))}
                </Picker>
            </View>
            {/* Документ */}
            <Text style={styles.label}>Документ-основание</Text>
            <TextInput 
                style={styles.input}
                value={document}
                onChangeText={setDocument}
                placeholder="Номер документа"
                placeholderTextColor={SystemColors.VeryLightBlue}
            />
            {/* Сканер */}
            <TouchableOpacity style={styles.scanButton} onPress={() => setScannerVisible(true)}>
                <Text style={styles.scanButtonText}>📷 Сканировать QR</Text>
            </TouchableOpacity>

            {/* Список отсканированного */}
            {qrCodes.length > 0 && (
                <View style={styles.qrList}>
                    <Text style={styles.qrListTitle}>Отсканировано ({setQrCodes.length}):</Text>
                    {qrCodes.map((code, index) => (
                        <View key={index} style={styles.qrRow}>
                            <Text style={styles.qrText}>{code}</Text>
                            <TouchableOpacity onPress={() => removeQrCode(index)}>
                                <Text style={styles.qrRemove}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}
            {/* Кнопка */}
            <View style={styles.buttonWrapper}>
                <Button 
                    text={operationType === 'issued' ? "Выдать" : "Вернуть"}
                    isLoading={loading}
                    onPress={handleSave}
                    disabled={loading}
                />
            </View>
            <BarcodeScanner
                visible={scannerVisible}
                onScan={handleScan}
                onClose={() => setScannerVisible(false)}
            />
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: SystemColors.PrimaryBlue,
        marginBottom: 6,
        marginTop: 16
    },
    input: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: SystemColors.PrimaryBlue,
        backgroundColor: '#FFFFFF'
    },
    pickWrapper: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    picker: {
        height: Platform.OS === 'ios' ? 180 : 50,
        color: SystemColors.PrimaryBlue,
    },
    scanButton: {
        marginTop: 20,
        padding: 16,
        backgroundColor: SystemColors.LightBlue, 
        borderRadius: 8,
        alignItems: 'center'
    },
    scanButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    qrList: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#F8F9FC',
        borderRadius: 8,
    },
    qrListTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: SystemColors.PrimaryBlue,
        marginBottom: 8
    },
    qrRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    qrText: {
        fontSize: 13,
        color: '#333',
        flex: 1,
    },
    qrRemove: {
        fontSize: 18,
        color: '#d32f2f',
        paddingLeft: 10
    },
    buttonWrapper: {
        marginTop: 24
    },
})

export default MovementScreen