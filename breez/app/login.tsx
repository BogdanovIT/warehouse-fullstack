import { Alert, Image, KeyboardAvoidingView, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Input } from '@/shared/input/input';
import { Button } from '@/button/button';
import { useEffect, useState } from 'react';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAtom } from 'jotai';
import { loginAtom } from '@/entities/auth/model/auth.state';
import { CustomFonts, SystemColors } from '@/shared/tokens';
import { isBiometricAvailable, saveCredentials, tryAutoLogin, authenticateWithBiometry, getCredentials } from '@/utils/biometryUtils';
import { Ionicons } from "@expo/vector-icons"
import { Config } from '@/config';

export default function Login() {
  interface AppError {
    message: string
    code?: number
    blocked?: boolean
    reason?: string
  }
  const [localError, setLocalError] = useState<AppError | null>(null)
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [{access_token, isLoading, error}, login] = useAtom(loginAtom)
  const params = useLocalSearchParams<{ email?: string}>()
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isBiometrySupported, setIsBiometrySupported] = useState(false)
  const [isBiometryLoading, setIsBiometryLoading] = useState(false)

  useEffect(() => {
    if (params?.email) {
      setEmail(decodeURIComponent(params.email))
    }
  }, [params?.email])
  useEffect(() => {
    checkBiometrySupport()
    attemptAutoLogin()
  }, [])
  const checkBiometrySupport = async () => {
    try {
      const supported = await isBiometricAvailable()
      setIsBiometrySupported(supported)
    } catch(error) {
      console.error("Ошибка проверки биометрии:", error)
    }
  }
  const attemptAutoLogin = async () => {
    if (!isBiometrySupported) return

    setIsBiometryLoading(true)
    try {
      const credentials = await tryAutoLogin()
      if (credentials) {
        setEmail(credentials.username)
        setPassword(credentials.password)
      }
    } catch(error) {
      console.log("Автовход не выполнен:", error)
    } finally {
      setIsBiometryLoading(false)
    }
  }
  const handleBiometryLogin = async () => {
    setIsBiometryLoading(true)
    try {
      const isAuthenticated = await authenticateWithBiometry()
      if (isAuthenticated) {
        const credentials = await getCredentials()
        if (credentials) {
          setEmail(credentials.username)
          setPassword(credentials.password)
          await handleLogin(credentials.username, credentials.password)
        } else {
          Alert.alert("Ошибка", "Не найдены учетные данные")
        }
      }
    } catch(error) {
      Alert.alert("Ошибка", "Не удалось выполнить вход по биометрии")
    } finally {
      setIsBiometryLoading(false)
    }
  }

  const getHumanReadableError = (error: any): AppError => {
    const errorCode = error?.code
    const errorMessage = error?.message || ''

    if (errorMessage && !errorMessage.includes('status code') && !errorMessage.includes('Request failed')) {
      return {
        message: errorMessage,
        code: errorCode,
        blocked: errorCode === 403 || errorMessage.includes('заблокирован'),
        reason: (error as any).reason
      }
    }
    switch (errorCode) {
      case 400:
        return {
          message: "Неверный запрос. Проверьте введенные данные",
          code: errorCode
        }
      case 401:
        return {
          message: "Неверный email или пароль",
          code: errorCode
        }
      case 403: 
        return {
          message: "Доступ запрещен",
          code: errorCode,
          blocked: true,
          reason: "Аккаунт заблокирован"
        }
      case 404: 
        return {
          message: "Пользователь не найден",
          code: errorCode
        }
      case 429: 
        return {
          message: "Слишком много попыток входа. Попробуйте позже",
          code: errorCode
        }
      case 500:
        return {
          message: "Внутренняя ошибка сервера. Попробуйте позже"
        }
      case 502:
      case 503:
      case 504:
        return {
          message: "Сервер временно недоступен. Попробуйте позже",
          code: errorCode
        }
      default:
        if (errorMessage.includes('Network Error') || errorMessage.includes('network')) {
          return {
            message: "Нет соединения с интернетом. Проверьте подключение",
            code: errorCode
          }
        }
      if (errorMessage.includes('timeout')) {
        return {
          message: "Превышено время ожидания ответа от сервера",
          code: errorCode
        }
      }
      return {
        message: "Произошла неизвестная ошибка. Попробуйте еще раз",
        code: errorCode
      }
    }
  }

  const checkBlockStatus = async (email: string): Promise<boolean> => {
    try {
      const API_URL = Config.HOME_URL
      const response = await fetch(`${API_URL}/api/auth/check-block-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({email})
      })
      const data = await response.json()
      if (data.blocked) {
        Alert.alert("Пользователь заблокирован", data.message)
        return true
      }
      return false
    } catch(error) {
      console.error('Ошибка проверки блокировки', error)
      return false
    }
  }
  const handleLogin = async (loginEmail: string, loginPassword: string) => {
    setLocalError(null)
    setHasUserInteracted(true)
    const isBlocked = await checkBlockStatus(loginEmail)
    if (isBlocked) {
      return
    }
    try {
      await login({ email: loginEmail, password: loginPassword })
      if (isBiometrySupported) {
        await saveCredentials(loginEmail, loginPassword)
      }
    } catch(error) {
      console.error("Ошибка входа:", error)
    }
  }
  const submit = async () => {
    await handleLogin(email, password)
  }
  
  useEffect(() => {
    if (error && !isFirstLoad) {
      const humanReadableError = getHumanReadableError(error)
      setLocalError(humanReadableError)
      if (humanReadableError.blocked) {
        Alert.alert("Аккаунт заблокирован", humanReadableError.reason || "Причина не указана")
      } else {
        Alert.alert("Ошибка входа", humanReadableError.message)
      }
    }
  }, [error, hasUserInteracted])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFirstLoad(false)
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (access_token) {
      router.replace('/index')
    }
  }, [access_token])

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={'padding'} 
      style={styles.content}>
      <Image style={styles.logo} source={require('./../assets/images/logo.png')}/>
      <View style={styles.form}>
        <Input placeholder='email' onChangeText={setEmail} autoCapitalize='none' keyboardType='email-address'
         placeholderTextColor={SystemColors.VeryLightBlue}
         value={email}/>
        <Input isPassword placeholder='password' onChangeText={setPassword} placeholderTextColor={SystemColors.VeryLightBlue} />
        <Button text='ВОЙТИ' onPress={submit} isLoading={isLoading} style={{paddingBottom: 15}}/>
        {isBiometrySupported && (
          <TouchableOpacity
          onPress={handleBiometryLogin}
          disabled={isBiometryLoading}
          style={[
            styles.biometryButton,
            isBiometryLoading && styles.biometryButtonDisabled
          ]}>
            {isBiometryLoading ? (
              <ActivityIndicator color={SystemColors.PrimaryBlue} />
            ) : (
              <>
                <Text style={styles.biometryText}>ВОЙТИ ПО ОТПЕЧАТКУ</Text>
                <Ionicons name="finger-print" size={24} color={SystemColors.PrimaryBlue} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      <Link href={'/restore'} style={{paddingTop: 15}}>
      <Text style={{color: SystemColors.VeryLightBlue, fontSize:16, fontFamily: CustomFonts.medium}}>Восстановить пароль</Text>
      </Link>
      <Link href={'/register'} style={{paddingTop: 15}}>
      <Text style={{color: SystemColors.VeryLightBlue, fontSize:16, fontFamily: CustomFonts.medium}}>Зарегистрироваться</Text>
      </Link>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: 55,
    gap: 15,
    backgroundColor: SystemColors.MutedBlue,
    paddingBottom: 150
  },
  logo: {
    width: 130,
    height: 130,
    resizeMode: 'contain',
    marginBottom: 100,
    marginTop:45
  },
  content:{
    alignItems: 'center',
  },
  form: {
    alignSelf: 'stretch',
    gap: 15
  },
  input: {
    backgroundColor: SystemColors.MutedBlue,
    borderWidth: 0.5,
    borderColor: SystemColors.VeryLightBlue
  },
  text: {
    color: 'red',
    fontSize: 16,
  },
  biometryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: SystemColors.LightBlue,
    backgroundColor: SystemColors.LightBlue,
    height: 48,
    borderRadius: 3
  },
  biometryButtonDisabled: {
    opacity: 0.5
  },
  biometryText: {
    color: SystemColors.PrimaryBlue,
    fontSize: 18,
    fontFamily: CustomFonts.medium
  }
});
