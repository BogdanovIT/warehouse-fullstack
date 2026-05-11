import { Redirect } from "expo-router";
import { useAtom, useAtomValue } from "jotai";
import { authAtom } from "../../entities/auth/model/auth.state";
import { Drawer } from 'expo-router/drawer'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomFonts, SystemColors } from "../../shared/tokens";
import { MenuButton } from "../../features/layout/UI/MenuButton/MenuButton";
import { CustomDrawer } from "../../widget/layout/ui/CustomDrawer/CustomDrawer";
import { hasRoleAtom, userProfileAtom } from "@/entities/user/model/user.state";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/api/user";


export default function AppLayout() {
    const { access_token } = useAtomValue(authAtom)
    const [profile, setProfile] = useAtom(userProfileAtom)
    const [isLoading, setIsLoading] = useState(true)
    useEffect(() => {
        const loadProfile = async () => {
            if (access_token && !profile) {
                try {
                    const userData = await getUserProfile(access_token)
                    setProfile(userData)
                } catch (error) {
                    console.error("Ошибка загрузки профиля пользователя:", error)
                }
            }
            setIsLoading(false)
        }
        loadProfile()
    }, [access_token])

    if (!access_token) {
        return <Redirect href="/login" />
    }
    if (isLoading) {
        return null
    }
    const hasfireSafetyAccess = (): boolean => {
        const isSuper = profile?.roles?.some(r => r.code === 'superuser') ?? false
        if (isSuper) return true
        const allowedPlaces = ['ФРЦ БРИЗ Шереметьево']
        const userPlace = profile?.place 
        return userPlace ? allowedPlaces.includes(userPlace) : false
    }
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer 
            drawerContent={(props) => <CustomDrawer {...props}/>} 
            screenOptions={({navigation}) => ({
                headerStyle: {
                    height: 70,
                    backgroundColor: SystemColors.PrimaryBlue,
                },
                headerLeft: () => {
                    return <MenuButton navigation={navigation} style={{marginTop: -34}}/>
                },
                headerTitleStyle: {
                    color: SystemColors.VeryLightBlue,
                    fontFamily: CustomFonts.medium,
                    fontSize: 18,
                    marginTop: -34,
                    paddingTop:0,

                },
                sceneStyle: {
                    backgroundColor: SystemColors.MutedBlue
                },
                
                headerTitleAlign:'center',
            })}>
                <Drawer.Screen  name="index" options={{
                    title: 'ГЛАВНАЯ СТРАНИЦА'
                }}/>
                <Drawer.Screen  name="profile" options={{
                    title: 'ПРОФИЛЬ'
                }}/>
                <Drawer.Screen  name="EmployeeScreen" options={{
                    title: 'СОТРУДНИКИ'
                }}/>
                <Drawer.Screen  name="AttendanceScreen" options={{
                    title: 'ТАБЕЛЬ'
                }}/>
                <Drawer.Screen  name="shipment" options={{
                    title: 'ОТГРУЗКА'
                }}/>
                <Drawer.Screen  name="receiving" options={{
                    title: 'ПРИЕМКА'
                }}/>
                <Drawer.Screen  name="barcode" options={{
                    title: 'ШТРИХ - КОД'
                }}/>
                <Drawer.Screen  name="choz_rabota" options={{
                    title: 'УЧЕТ ХОЗ.РАБОТ'
                }}/>
                <Drawer.Screen  name="brakodel" options={{
                    title: 'РАБОТА С БРАКОМ'
                }}/>
                {hasfireSafetyAccess() && (
                <Drawer.Screen  name="firesecurity" options={{
                    title: 'ПОЖАРНАЯ БЕЗОПАСНОСТЬ'
                }}/>
                )}
                <Drawer.Screen  name="about" options={{
                    title: 'НАПИСАТЬ РАЗРАБОТЧИКУ'
                }}/>
            </Drawer>
        </GestureHandlerRootView>
    )
}