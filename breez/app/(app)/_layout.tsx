import { Redirect } from "expo-router";
import { useAtomValue } from "jotai";
import { authAtom } from "../../entities/auth/model/auth.state";
import { Drawer } from 'expo-router/drawer'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomFonts, SystemColors } from "../../shared/tokens";
import { MenuButton } from "../../features/layout/UI/MenuButton/MenuButton";
import { CustomDrawer } from "../../widget/layout/ui/CustomDrawer/CustomDrawer";


export default function AppLayout() {
    const { access_token } = useAtomValue(authAtom)
    if (!access_token) {
        return <Redirect href="/login"/>
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
                <Drawer.Screen  name="shipment" options={{
                    title: 'ОТГРУЗКА'
                }}/>
                <Drawer.Screen  name="receiving" options={{
                    title: 'ПРИЕМКА'
                }}/>
                <Drawer.Screen  name="barcode" options={{
                    title: 'ШТРИХ - КОД'
                }}/>
                <Drawer.Screen  name="brakodel" options={{
                    title: 'РАБОТА С БРАКОМ'
                }}/>
                <Drawer.Screen  name="about" options={{
                    title: 'НАПИСАТЬ РАЗРАБОТЧИКУ'
                }}/>
            </Drawer>
        </GestureHandlerRootView>
    )
}