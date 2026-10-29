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
import symbolicateStackTrace from "react-native/Libraries/Core/Devtools/symbolicateStackTrace";
import { apiFetch } from "@/shared/apiFetch";

const API_URL = Config.HOME_URL

const DEPARTMENTS = [
    'Бриз Крым Сервис (АСЦ)',
    'Бриз Ростов Сервис',
    'Бриз Краснодар Сервис',
    'Бриз Воронеж Сервис',
    'Бриз Казань Сервис',
    'Бриз Н-Новгород Сервис',
    'Бриз Санкт-Петербург Сервис',
    'Бриз Самара Сервис',
    'Бриз Екатеринбург Сервис',
    'Бриз Красноярск Сервис',
    'Бриз Новосибирск Сервис',
    'Сервис Шерризон',
    'Сервис Шерризон Клиентская техника',
    'Сервис Шерризон НТК',
    'Сервис Шерризон Ремонтные з/ч',
    'Сервис Шерризон ТЕСТ',
];
interface EmployeeOption {
    id: number
    fullName: string
}

const MovementScreen = () => {
    const [auth] = useAtom(authAtom)
    const [userProfile] = useAtom(userProfileAtom)
    const [operationType, setOperationType] = useState<'issued' | 'returned'>('issued')
    const [department, setDepartment] = useState<string>('')
    const [document, setDocument] = useState('')
    const [qrCodes, setQrCodes] = useState<string[]>([])
    const [scannerVisible, setScannerVisible] = useState(false)
    const [loading, setLoading] = useState(false)
    const [employeeName, setEmployeeName] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])

    useEffect(() => {
        if (employeeName.trim().length < 2) {
            setSuggestions([])
            return
        }
        const timer = setTimeout(async () => {
            try {
                const response = await apiFetch(
                    `${API_URL}/api/movements/search-employees?query=${encodeURIComponent(employeeName)}`,
                    {headers: { 'Authorization': `Bearer ${auth.access_token}` } }
                )
                const data = await response.json()
                if (response.ok) setSuggestions(data)
            } catch (error) {
                console.error('Ошибка поиска ФИО:', error)
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [employeeName])

    const handleScan = (barcode: string) => {
        // Если камера вернула несколько кодов через перенос строки — разбиваем.
        // Внутренние разделители DataMatrix (\x1D) НЕ трогаем.
        const codes = barcode.split(/\n/).map(c => c.trim()).filter(Boolean);
        
        if (codes.length === 0) return;
        for (const code of codes) {
            if (qrCodes.includes(code)) {
                Alert.alert("Внимание", `Код ${code.slice(1, 15)}...  уже отсканирован`)
                continue
            }
            setQrCodes(prev => [...prev, ...codes]);
        }
                
        setScannerVisible(false);
    };
    const removeQrCode = (index: number) => {
        setQrCodes(prev => prev.filter((_, i) => i !== index))
    }
    const handleSave = async () => {
        if (!department) {
            Alert.alert('Ошибка', 'Выберите подразделение');
            return;
        }
        if (!employeeName.trim()) {
            Alert.alert('Ошибка', 'Введите ФИО сотрудника');
            return;
        }
        if (!document.trim()) {
            Alert.alert('Ошибка', 'Укажите номер документа-основания');
            return;
        }
        if (qrCodes.length === 0) {
            Alert.alert('Ошибка', 'Отсканируйте хотя бы одну деталь');
            return;
        }
        const uniqueCodes = new Set(qrCodes)
        if (uniqueCodes.size !== qrCodes.length) {
            Alert.alert("Ошибка","В списке есть дубликаты. Удалите лишнее")
            return
        }

        try {
            setLoading(true);
            const response = await apiFetch(`${API_URL}/api/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operationType,
                    department,
                    employeeName: employeeName.trim(),
                    document: document.trim(),
                    qrCodes,
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Ошибка сохранения');
            
            Alert.alert('Готово', data.message);
            setQrCodes([]);
            setDocument('');
            setEmployeeName('');
        } catch (error: unknown) {
            if (error instanceof Error) Alert.alert('Ошибка', error.message);
        } finally {
            setLoading(false);
        }
    };
    return (
        <ScrollView style={styles.container} contentContainerStyle = {styles.content}>
            {/* тип операции*/}
            <Text style={styles.label}>Тип операции</Text>
            <View style={styles.pickWrapper}>
                <Picker selectedValue={operationType} onValueChange={(v) => setOperationType(v)} style={styles.picker}>
                    <Picker.Item label="Выдача" value='issued' color={SystemColors.VeryLightBlue}/>
                    <Picker.Item label="Возврат" value='returned' color={SystemColors.VeryLightBlue}/>
                    <Picker.Item label="Установлено" value='installed' color={SystemColors.VeryLightBlue}/>
                </Picker>
            </View>
            {/* Подразделение */}
            <Text style={styles.label}>Подразделение</Text>
            <View style={styles.pickWrapper}>
                <Picker selectedValue={department} onValueChange={setDepartment} style={styles.picker}>
                    <Picker.Item label="-Выберите подразделение-" value="" color="#999"/>
                    {DEPARTMENTS.map(d => (
                        <Picker.Item key={d} label={d} value={d} color={SystemColors.VeryLightBlue} />
                    ))}
                </Picker>
            </View>
            {/* Сотрудник */}
            <Text style={styles.label}>Сотрудник</Text>
            <TextInput style = {styles.input} value={employeeName} onChangeText={setEmployeeName} placeholder="Введите ФИО сотрудника"
            placeholderTextColor={SystemColors.VeryLightBlue}/>
            {suggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                    {suggestions.map((name, index) => (
                        <TouchableOpacity key={index} 
                        style={styles.suggestionItem} 
                        onPress={() => {setEmployeeName(name); setSuggestions([])
                        }}
                    >
                        <Text style={styles.suggestionsText}>{name}</Text>
                    </TouchableOpacity>
                    ))}
                </View>
            )}
            {/* Документ */}
            <Text style={styles.label}>Документ-основание</Text>
            <TextInput 
                style={styles.input}
                value={document}
                onChangeText={setDocument}
                placeholder="Номер документа"
            />
            {/* Сканер */}
            <View style={{ marginTop: 20}}>
                <Button text="📷 Сканировать QR" onPress={()=> setScannerVisible(true)}/>
            </View>
            
            {/* Список отсканированного */}
            {qrCodes.length > 0 && (
                <View style={styles.qrList}>
                    <Text style={styles.qrListTitle}>Отсканировано ({qrCodes.length}):</Text>
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
                    text="СОХРАНИТЬ"
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
        fontFamily: CustomFonts.medium
    },
    input: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: SystemColors.VeryLightBlue,
        backgroundColor: SystemColors.MutedBlue,
        fontFamily: CustomFonts.regular
    },
    pickWrapper: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 8,
        backgroundColor: SystemColors.MutedBlue,
        overflow: 'hidden',
    },
    picker: {
        height: Platform.OS === 'ios' ? 180 : 50,
        color: SystemColors.VeryLightBlue,
    },
    pickerItem: {
        fontFamily: CustomFonts.regular,
        color: SystemColors.VeryLightBlue,
        fontSize: 16,
    },
    scanButton: {
        marginTop: 20,
        padding: 16,
        backgroundColor: SystemColors.LightBlue, 
        borderRadius: 3,
        alignItems: 'center'
    },
    scanButtonText: {
        color: SystemColors.PrimaryBlue,
        fontSize: 16,
        fontFamily: CustomFonts.medium,
    },
    qrList: {
        marginTop: 20,
        padding: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: SystemColors.VeryLightBlue,
    },
    qrListTitle: {
        fontSize: 14,
        fontFamily: CustomFonts.medium,
        color: SystemColors.VeryLightBlue,
        marginBottom: 8
    },
    qrRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(175,211,234,0.3)',
    },
    qrText: {
        fontSize: 13,
        fontFamily: CustomFonts.regular,
        color: SystemColors.VeryLightBlue,
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
    suggestionsBox: {
        borderWidth: 1.5,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 3,
        backgroundColor: SystemColors.MutedBlue,
        marginTop: -2,
        maxHeight: 150
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(175, 211, 234, 0.2)'
    },
    suggestionsText: {
        color: SystemColors.VeryLightBlue,
        fontFamily: CustomFonts.regular,
        fontSize: 16
    },
})

export default MovementScreen