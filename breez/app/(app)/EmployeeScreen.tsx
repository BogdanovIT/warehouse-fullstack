import React, { useEffect, useState, useCallback} from "react";
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity, StyleSheet, Modal, Platform, Switch } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAtom } from "jotai";
import { authAtom } from "@/entities/auth/model/auth.state";
import { SystemColors, CustomFonts } from "@/shared/tokens";
import { Config } from "@/config";
import { Button } from "@/button/button";

const API_URL = Config.HOME_URL
interface Employee {
    id?: number
    fullName: string
    shortName?: string
    loginLv?: string
    position?: string
    isHourly: boolean
}

const EmployeeScreen = () => {
    const [auth] = useAtom(authAtom)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [loading, setLoading] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

    const [fullName, setFullName] = useState('')
    const [shortName, setShortName] = useState('')
    const [loginLv, setLoginLv] = useState('')
    const [position, setPosition] = useState('')
    const [isHourly, setIsHourly] = useState(true)

    const fetchEmployees = useCallback(async ()=>{
        try {
            setLoading(true)
            const response = await fetch(`${API_URL}/api/employees`, {
                headers: {'Authorization': `Bearer ${auth.access_token}`},
            })
            const data = await response.json()
            if (response.ok) {
                setEmployees(data)
            }
        } catch (error) {
            console.error('Ошибка загрузки сотрудников:', error)
        } finally {
            setLoading(false)
        }
    }, [auth.access_token])
    useEffect(() => {
        fetchEmployees()
    }, [fetchEmployees])

    const openAddModal = () => {
        setEditingEmployee(null)
        setFullName('')
        setShortName('')
        setLoginLv('')
        setPosition('')
        setIsHourly(true)
        setModalVisible(true)
    }
    const openEditModal = (emp: Employee) => {
        setEditingEmployee(emp)
        setFullName(emp.fullName)
        setShortName(emp.shortName || '')
        setLoginLv(emp.loginLv || '')
        setPosition(emp.position || '')
        setIsHourly(emp.isHourly)
        setModalVisible(true)
    }
    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Ошибка', 'Введите ФИО сотрудника')
            return
        }
        try {
            const url = editingEmployee?.id
                ? `${API_URL}/api/employees${editingEmployee.id}`
                : `${API_URL}/api/employees`
            const method = editingEmployee?.id ? 'PUT' : 'POST'
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${auth.access_token}`,
                },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    shortName: shortName.trim() || null,
                    loginLv: loginLv.trim() || null,
                    position: position.trim() || null,
                    isHourly
                })
            })
            if (response.ok) {
                setModalVisible(false)
                fetchEmployees()
                Alert.alert("Готово", editingEmployee ? "Сотрудник обновлен" : "Сотрудник добавлен")
            } else {
                const err = await response.json()
                throw new Error(err.message)
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Не удалось сохранить'
            Alert.alert('Ошибка', msg)
        }
    }
    const handleDeactivate = async (emp: Employee) => {
        Alert.alert('Подтверждение', `Скрыть сотрудника ${emp.fullName}?`, [
            { text: "Отмена", style: 'cancel'},
            {
                text: 'Скрыть',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await fetch(`${API_URL}/api/employees/${emp.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${auth.access_token}`
                            },
                            body: JSON.stringify({ isActive: false }),
                        })
                        fetchEmployees()
                    } catch (error) {
                        console.error(error)                        
                    }
                }
            }
        ])
    }
    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Сотрудники подразделения</Text>
                {employees.map(emp => (
                    <TouchableOpacity
                        key={emp.id}
                        style={styles.employeeRow}
                        onPress={() => openEditModal(emp)}
                        onLongPress={() => handleDeactivate(emp)}>
                            <View style={styles.employeeInfo}>
                                <Text style={styles.employeeName}>{emp.fullName}</Text>
                                {emp.position && <Text style={styles.employeePos}>{emp.position}</Text>}
                                {emp.loginLv && <Text style={styles.employeeLogin}>LV: {emp.loginLv}</Text>}
                            </View>
                            <Text style={styles.employeeType}>
                                {emp.isHourly ? 'Сделка' : 'Оклад'}
                            </Text>
                        </TouchableOpacity>
                ))}
                {employees.length=== 0 && !loading && (
                    <Text style={styles.empty}>Список сотрудников пуст. Добавьте сотрудников.</Text>
                )}
            </ScrollView>
            <TouchableOpacity style={styles.fab} onPress={openAddModal}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>
                                {editingEmployee ? 'Редактировать' : 'Добавить'}
                            </Text>
                            <Text style={styles.label}>ФИО *</Text>
                            <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
                            placeholder="Иванов Иван Иванович" placeholderTextColor={SystemColors.VeryLightBlue}
                            autoCapitalize='words' />
                            <Text style={styles.label}>Краткое имя</Text>
                            <TextInput style={styles.input} value={shortName} onChangeText={setShortName}
                            placeholder="Иванов И.И." placeholderTextColor={SystemColors.VeryLightBlue}
                            autoCapitalize='none' />
                            <Text style={styles.label}>Логин LV</Text>
                            <TextInput style={styles.input} value={loginLv} onChangeText={setLoginLv}
                            placeholder="IIvanov" placeholderTextColor={SystemColors.VeryLightBlue}
                            autoCapitalize='none' />
                            <Text style={styles.label}>Должность</Text>
                            <TextInput style={styles.input} value={position} onChangeText={setPosition}
                            placeholder="Кладовщик" placeholderTextColor={SystemColors.VeryLightBlue}
                            autoCapitalize='none' />
                            <View style={styles.switchRow}>
                                <Text style={styles.label}>Сделка</Text>
                                <Switch value={isHourly} onValueChange={setIsHourly}
                                    trackColor={{false: '#767577', true: SystemColors.LightBlue}}
                                    thumbColor={isHourly ? SystemColors.PrimaryBlue : '#F4F3F4'} />
                            </View>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>Отмена</Text>
                                </TouchableOpacity>
                                <View style={{ width: 12 }} />
                                <Button text="Сохранить" onPress={handleSave} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    )
}
export default EmployeeScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF"
    },
    content: {
        padding: 16,
        paddingBottom: 100
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: SystemColors.PrimaryBlue,
        marginBottom: 16,
        fontFamily: CustomFonts.medium
    },
    employeeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderRadius: 9,
        backgroundColor: '#F8F9FC',
        borderLeftWidth: 4,
        borderLeftColor: SystemColors.LightBlue
    },
    employeeInfo: {
        flex: 1,
        marginRight: 12
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '600',
        color: SystemColors.PrimaryBlue,
        fontFamily: CustomFonts.medium
    },
    employeePos: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    employeeLogin: {
        fontSize: 12,
        color: SystemColors.MutedBlue,
        marginTop: 2,
    },
    employeeType: {
        fontSize: 12,
        color: SystemColors.LightBlue,
        fontWeight: '500',
        backgroundColor: '#E8F0FE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden'
    },
    empty: {
        fontSize: 15,
        color: '#999',
        textAlign: 'center',
        marginTop: 60
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: SystemColors.PrimaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 3},
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    fabText: {
        fontSize: 28,
        color: '#FFFFFF',
        lineHeight: 30,
        fontWeight: '300'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: SystemColors.PrimaryBlue,
        marginBottom: 20,
        fontFamily: CustomFonts.medium,
        textAlign: 'center'
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: SystemColors.PrimaryBlue,
        marginBottom: 6,
        marginTop: 12
    },
    input: {
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 9,
        padding: 12,
        fontSize: 16,
        color: SystemColors.PrimaryBlue,
        backgroundColor: '#FAFBFC',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        alignItems: 'center'
    },
    cancelBtnText: {
        fontSize: 16,
        color: SystemColors.PrimaryBlue,
        fontWeight: '500'
    }

})