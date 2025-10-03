import { StyleSheet, View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from "react-native";
import { CustomFonts, SystemColors } from "@/shared/tokens";
import { Input } from "@/shared/input/input";
import { InputRegister } from "@/shared/input/input_register";
import { Picker } from "@react-native-picker/picker";
import { useState } from "react";
import { Button } from "@/button/button";
import { router } from "expo-router";
import { Config } from "@/config";

const API_URL = Config.HOME_URL
export default function Register() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        loginLv: '',
        email: '',
        confirmEmail: '',
        password: '',
        confirmPassword: '',
        operators: [''],
        place: '',
        verificationCode: ''
    })
    const [showVerification, setShowVerification] = useState(false)
    const [passwordErrors, setPasswordErrors] = useState({
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false
    })
    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({...prev, [field]: value}))
        if (field === 'password') {
            checkPasswordStrength(value)
        }
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
    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@breez\.ru$/
        return emailRegex.test(email)
    }
    const validatePassword = () => {
        return Object.values(passwordErrors).every(error => error === true)
    }
    const validate = () => {
        if (!validateEmail(formData.email)) {
            Alert.alert('Ошибка', "Укзан сторонний email, укажите корпоративный email")
            return false
        }
        if (!validatePassword()) {
            Alert.alert("Ошибка","Пароль не соответствует требованиям безопасности")
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            Alert.alert('Ошибка, пароли не совпадают')
            return false
        }
        if (formData.email !== formData.confirmEmail) {
            Alert.alert('Ошибка, email не совпадают')
            return false
        }
        return true
    }
    const sendVerificationCode = async () => {
        try {
            if (!formData.email || !formData.email.includes('@')) {
                Alert.alert("Ошибка", "Пожалуйста, введите корректный email")
            }
            const response = await fetch(`${API_URL}/api/users/send-verification`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: formData.email.trim()
                })
            })
            const responseData = await response.json()
            if (response.ok) {
                setShowVerification (true)
                Alert.alert("Успешно","Код подтверждения отправлен на указанный email")
            } else {
                const errorMessage = responseData.message || "Не удалось отправить код подтверждения"
                Alert.alert("Ошибка", errorMessage)
            } 
        } catch (error) {
            Alert.alert("ошибка", "не удалось отправить код подтверждения")
        }
    }
    const [place, setPlace] = useState('')
    const [operators, setOperators] = useState<string[]>([''])
    const addOperatorField = () => {
        setOperators([...operators, ''])
    }
    const removeOperatorField = (index: number) => {
        if (operators.length > 1) {
            const newOperators = [...operators]
            newOperators.splice(index, 1)
            setOperators(newOperators)
        }
    }
    const updateOperator =(index: number, value: string) => {
        const newOperators = [...formData.operators]
        newOperators[index] = value
        setFormData(prev => ({...prev, operators: newOperators}))
    }
    const handleSubmit = async () => {
        if (!validate()) return
        if (!showVerification) {
            await sendVerificationCode()
            return
        }
        
        try {
            const verifyResponse = await fetch(`${API_URL}/api/users/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    code: formData.verificationCode
                })
            })
            if (!verifyResponse.ok) {
                Alert.alert("Ошибка","Неверный код подтверждения")
            }
            const response = await fetch(`${API_URL}/api/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    place: formData.place,
                    loginLv: formData.loginLv,
                    operators: formData.operators.filter(op => op.trim() !=='')
                })
            })
            const data = await response.json()
            if (response.ok) {
                Alert.alert("Пользователь успешно добавлен") 
                router.replace({
                    pathname: '/login',
                    params: {email: encodeURIComponent(formData.email)}
                })
            } else {
                Alert.alert("Ошибка", data.error || 'Ошибка регистрации')
            }
        } catch (error){
            const err = error as Error
            console.error('FULL ERROR:', err)
            Alert.alert(`Код: ${'code' in err ? err.code : 'unknown'} \n${err.message}`)
        }
    }
    return (
        <View style={styles.mainContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        keyboardVerticalOffset={Platform.select({ios:60, android:0})}
        style={styles.avoidingView}>
        <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false} 
            showsHorizontalScrollIndicator={false} 
            style={styles.scrollContainer}>
                <View style={styles.container}>
                <Text style={styles.header}>Регистрация пользователя </Text>
                </View>
                    <Text style={styles.textStyle}>Имя:</Text>
                    <Input style={styles.inputData} value={formData.firstName} onChangeText={(text) => handleChange('firstName', text)}/>
                    <Text style={styles.textStyle}>Фамилия:</Text>
                    <Input style={styles.inputData} value={formData.lastName} onChangeText={(text) => handleChange('lastName', text)}/>
                    <Text style={styles.textStyle}>Login LV:</Text>
                    <Input style={styles.inputData} value={formData.loginLv} onChangeText={(text) => handleChange('loginLv', text)}/>
                    <Text style={styles.textStyle}>Email:</Text>
                    <Input style={styles.inputData} value={formData.email}
                    autoCapitalize="none"
                    keyboardType="email-address" onChangeText={(text) => handleChange('email', text.toLowerCase())}
                    placeholder="user@breez.ru"/>
                    <Text style={styles.textStyle}>Подтвердите email:</Text>
                    <Input style={styles.inputData} value={formData.confirmEmail} 
                    autoCapitalize="none"
                    keyboardType="email-address" onChangeText={(text) => handleChange('confirmEmail', text.toLowerCase())}
                    placeholder="user@breez.ru"/>
                    <Text style={styles.textStyle}>Пароль:</Text>
                    <InputRegister isPassword style={{...styles.inputData}} value={formData.password} onChangeText={(text) => handleChange('password', text)}/>
                    <View style={styles.passwordHintContainer}>
                        <Text style={styles.passwordHintTitle}>Пароль должен содержать:</Text>
                        <Text style={[styles.passwordHint, passwordErrors.hasMinLength && styles.passwordHintValid]}>
                            Минимум 8 символов
                        </Text>
                        <Text style={[styles.passwordHint, passwordErrors.hasUpperCase && styles.passwordHintValid]}>
                            Заглавные буквы (A-Z)
                        </Text>
                        <Text style={[styles.passwordHint, passwordErrors.hasLowerCase && styles.passwordHintValid]}>
                            Строчные буквы (a-z)
                        </Text>
                        <Text style={[styles.passwordHint, passwordErrors.hasNumber && styles.passwordHintValid]}>
                            Цифры (0-9)
                        </Text>
                        <Text style={[styles.passwordHint, passwordErrors.hasSpecialChar && styles.passwordHintValid]}>
                            Спецсимволы (!@#$% и др.)
                        </Text>
                    </View>
                    <Text style={styles.textStyle}>Подтвердите пароль:</Text>
                    <InputRegister isPassword style={styles.inputData} value={formData.confirmPassword} onChangeText={(text) => handleChange('confirmPassword', text)}/>
                    <Text style={styles.textStyle}>Укажите свой РЦ:</Text>
                    <View style={{width: '85%', borderWidth: 1, borderColor: SystemColors.VeryLightBlue, borderRadius: 6,
                        marginBottom: 10, alignSelf: 'center', overflow: 'hidden'
                    }}>
                    <Picker
                        selectedValue={formData.place}
                        onValueChange={(itemValue) => handleChange('place',itemValue)}
                        style={{...styles.picker, width:'100%'}} dropdownIconColor={SystemColors.VeryLightBlue}>
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="ФРЦ БРИЗ Шереметьево" value="ФРЦ БРИЗ Шереметьево" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="МОС БРИЗ Медведково" value="МОС БРИЗ Медведково" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="МОС БРИЗ Саларьево" value="МОС БРИЗ Саларьево" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="МОС БРИЗ Рязанское" value="МОС БРИЗ Рязанское" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="ДРЦ БРИЗ Софьино" value="ДРЦ БРИЗ Софьино" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="РРЦ Бриз Екатеринбург LV" value="РРЦ Бриз Екатеринбург LV" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="РРЦ Бриз Новосибирск LV" value="РРЦ Бриз Новосибирск LV" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="РРЦ Бриз Ростов LV" value="РРЦ Бриз Ростов LV" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="РРЦ Бриз Самара LV" value="РРЦ Бриз Самара LV" />
                            <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="РРЦ Бриз Краснодар LV" value="РРЦ Бриз Краснодар LV" />
                        </Picker>
                    </View>
                    <Text style={styles.textStyle}>Укажите email оператора(ов):</Text>
                    {operators.map((operator, index) => (
                        <View key={index} style={styles.operatorContainer}>
                            <View style={styles.operatorInputContainer}>
                            <InputRegister style={styles.operatorInput} value={formData.operators[index]}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            onChangeText={(text) => updateOperator(index, text.toLowerCase())}
                            placeholder="operator@breez.ru"/>
                            </View>
                            {operators.length > 1 && (
                                <TouchableOpacity style={styles.removeButton}
                                onPress = {() => removeOperatorField(index)}>
                                    <Text style={styles.removeButtonText}>x</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                    <TouchableOpacity 
                    style={styles.addButton}
                    onPress={addOperatorField}>
                        <Text style={styles.addButtonText}>+ Добавить оператора</Text>
                    </TouchableOpacity>
                    {showVerification && (
                        <>
                            <Text style={styles.textStyle}>Код подтверждения:</Text>
                            <Input style={styles.inputData}
                            value={formData.verificationCode}
                            keyboardType="numeric"
                            onChangeText={(text) => handleChange('verificationCode', text)}
                            placeholder="Введите код из письма" />
                        </>
                    )}
                    <Button text= {showVerification ? "ПОДТВЕРДИТЬ РЕГИСТРАЦИЮ" : "ОТПРАВИТЬ КОД ПОДТВЕРЖДЕНИЯ"}
                     onPress={handleSubmit} style={{paddingTop: 30, width: '75%', alignSelf: 'center', marginBottom: 30}}/>
        </ScrollView>
        </KeyboardAvoidingView>
        </View>
    )
}


const styles = StyleSheet.create({
    mainContainer:{
        flex: 1,
        backgroundColor: SystemColors.MutedBlue
    },
    scrollContent:{
        paddingBottom: 40
    },
    avoidingView: {
        flex: 1,
    },
    scrollContainer: {
        backgroundColor: SystemColors.MutedBlue,
    },
    container: {
        height: 60,
        backgroundColor: SystemColors.PrimaryBlue,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    header: {
        fontFamily: CustomFonts.medium,
        fontSize: 18,
        color: SystemColors.VeryLightBlue,
        alignSelf: 'flex-start',
        paddingLeft: 30
    },
    textStyle: {
        color: SystemColors.VeryLightBlue,
        paddingLeft: 30,
        paddingTop: 15,
        paddingBottom: 5
    },
    inputData: {
        width: '85%',
        backgroundColor: SystemColors.MutedBlue,
        alignSelf: 'center',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        color: SystemColors.VeryLightBlue
    },
    picker: {
        alignSelf: 'center',
        backgroundColor: SystemColors.MutedBlue, 
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue       
    },
    pickerItem: {
        fontFamily: CustomFonts.regular,
        color: SystemColors.VeryLightBlue,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: SystemColors.VeryLightBlue,
        fontSize: 16
    },
    operatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '85%',
        alignSelf: 'center',
        marginBottom: 10,
    },
    operatorInput: {
        width: '100%',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        color: SystemColors.VeryLightBlue,
        padding: 10,
        height: 42
    },
    operatorInputContainer: {
        width: '85%',
        paddingVertical: 5,
    },
    removeButton: {
        marginLeft: 5,
        backgroundColor: SystemColors.MutedBlue,
        width: 42,
        height: 42,
        borderRadius: 6,
        borderColor: SystemColors.VeryLightBlue,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: SystemColors.VeryLightBlue,
        fontSize: 20,
        lineHeight: 24
    },
    addButton: {
        marginTop: 10,
        marginBottom: 20,
        alignSelf: 'center'
    },
    addButtonText: {
        color: SystemColors.VeryLightBlue,
        textDecorationLine: 'underline'
    },
    passwordHintContainer: {
        width: '85%',
        alignSelf: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: SystemColors.VeryLightBlue,
        borderRadius: 6
    },
    passwordHintTitle: {
        color: SystemColors.PrimaryBlue,
        fontFamily: CustomFonts.medium,
        marginBottom: 5,
        paddingTop: 15
    },
    passwordHint: {
        color: '#fc0518',
        fontSize: 12,
        opacity: 0.7
    },
    passwordHintValid: {
        color: "#4CAF50",
        opacity: 1
    }
})