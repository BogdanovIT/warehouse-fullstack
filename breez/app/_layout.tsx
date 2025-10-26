import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from 'expo-font'
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { loginAtom } from "@/entities/auth/model/auth.state";
import PasswordCheck from "@/components/PasswordCheck";
import SecurityManager from "@/security/SecurityManager"

const securityManager =new SecurityManager()

SplashScreen.preventAutoHideAsync()
export default function RootLayout() {
    const [{ access_token }] = useAtom(loginAtom)
    const [loaded] = useFonts({
        FiraSans: require('../assets/fonts/FiraSans-Regular.ttf'),
        FiraSansSemiBold: require('../assets/fonts/FiraSans-SemiBold.ttf') ,
        HelveticaBold: require('../assets/fonts/HelveticaBold.ttf'),
        HelveticaMedium: require('../assets/fonts/HelveticaMedium.ttf'),
        HelveticaRegular: require('../assets/fonts/HelveticaRegular.ttf'),
    })

    const [isSecurityInitialized, setIsSecurityInitialized] = useState(false)

    useEffect(()=> {
        if (loaded) {
            SplashScreen.hideAsync()
        }
    }, [loaded])

    const insets = useSafeAreaInsets()
    if (!loaded) {
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