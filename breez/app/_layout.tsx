import { SplashScreen, Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from 'expo-font'
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useRef, useState } from "react";
import { useAtom } from "jotai";
import { authAtom, loginAtom } from "@/entities/auth/model/auth.state";
import PasswordCheck from "@/components/PasswordCheck";
import SecurityManager from "@/security/SecurityManager"
import * as SecureStore from 'expo-secure-store'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
    const [authState, setAuthState] = useAtom(authAtom)
    const { access_token } = authState
    const [loaded] = useFonts({
        FiraSans: require('../assets/fonts/FiraSans-Regular.ttf'),
        FiraSansSemiBold: require('../assets/fonts/FiraSans-SemiBold.ttf') ,
        HelveticaBold: require('../assets/fonts/HelveticaBold.ttf'),
        HelveticaMedium: require('../assets/fonts/HelveticaMedium.ttf'),
        HelveticaRegular: require('../assets/fonts/HelveticaRegular.ttf'),
    })

    const [isSecurityInitialized, setIsSecurityInitialized] = useState(false)
    const [securityError, setSecurityError] = useState<string | null>(null)
    const securityManagerRef = useRef<SecurityManager | null> (null)
    useEffect(() => {
        const checkTokenAndRedirect = async () => {
            const token = await SecureStore.getItemAsync('access_token')
            const currentRoute = router.canGoBack()
            if (!token && !window.location?.pathname?.includes('login') && !window.location?.pathname?.includes('register')) {
                setTimeout(() => {
                    router.replace('/login')
                }, 100)
            }
        }
        checkTokenAndRedirect()
    }, [access_token])

        useEffect(() => {
            const initializeSecurity = async () => {
                try {
                    if (!securityManagerRef.current) {
                        securityManagerRef.current = new SecurityManager()
                    }
                    await securityManagerRef.current.initialize()
                    setIsSecurityInitialized(true)
                    console.log('Security initialized successfully')
                } catch (error) {
                    console.error('Security initialization failed:', error)
                    const errorMessage = error instanceof Error ? error.message : "Unknown Security Error"
                    setSecurityError(errorMessage)
                    setIsSecurityInitialized(true)
                }
            }

            if (loaded) {
                initializeSecurity()
            }
        }, [loaded])

        useEffect(() => {
            if (loaded && isSecurityInitialized) {
                SplashScreen.hideAsync()
            }
        }, [loaded, isSecurityInitialized])

        const insets = useSafeAreaInsets()
        
        if (!loaded || !isSecurityInitialized) {
            return null
        }

    return (
        <SafeAreaProvider>
            <StatusBar style='dark'/>
            <PasswordCheck>
            <Stack screenOptions={{
                headerShown: false,
                contentStyle: {
                    paddingTop: insets.top
                }
            }}> 
                {/* <Stack.Screen  name="welcome"/> */}
                <Stack.Screen  name="login" redirect={!!access_token}/>
                <Stack.Screen name="(app)"/>
                <Stack.Screen  name="register"/>
                <Stack.Screen  name="restore" options={{
                    presentation:'modal',
                    
                }}/>
            </Stack>
            </PasswordCheck>
        </SafeAreaProvider>
    )
}