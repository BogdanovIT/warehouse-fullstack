import { DrawerContentComponentProps, DrawerContentScrollView } from "@react-navigation/drawer";
import { StyleSheet, View } from "react-native";
import { CustomFonts, SystemColors } from "../../../../shared/tokens";
import { Link } from "expo-router";
import { CloseDrawer } from "../../../../features/layout/UI/CloseDrawer/CloseDrawer";
import { useAtom, useSetAtom } from "jotai";
import { logoutAtom } from "../../../../entities/auth/model/auth.state";
import { loadProfileAtom } from "../../../../entities/user/model/user.state";
import { useEffect } from "react";
import { UserMenu } from "../../../../entities/user/ui/UserMenu/UserMenu";
import { MenuItem } from "../../../../entities/layout/ui/MenuItem/MenuItem";
import ExitOutline from "../../../../assets/icons/exit";
import EnterOutline from "../../../../assets/icons/enter";
import Barcode from "../../../../assets/icons/barcode";
import Profile from "../../../../assets/icons/profile";
import Hammer from "../../../../assets/icons/hammer";
import Letter from "../../../../assets/icons/letter";
import HomePage from "../../../../assets/icons/homePage";

const MENU = [
    // {text: 'Статистика', icon: <DefaultProfileIcon/>, path: 'index'},
    // {text: 'Статистика', icon: <Stats/>, path: 'index'},
    {text: 'НА ГЛАВНУЮ', icon: <HomePage/>, path: 'index'},
    {text: 'ПРИЕМКА', icon: <EnterOutline/>, path: 'receiving'},
    {text: 'ОТГРУЗКА', icon: <ExitOutline/>, path: 'shipment'},
    {text: 'ШТРИХ-КОД', icon: <Barcode/>, path: 'barcode'},
    {text: 'РАБОТА С БРАКОМ', icon: <Hammer/>, path: 'brakodel'},
    {text: 'ПРОФИЛЬ', icon: <Profile/>, path: 'profile'},
    {text: 'НАПИСАТЬ РАЗРАБОТЧИКУ', icon: <Letter/>, path: 'about'},
    
]

export function CustomDrawer (props: DrawerContentComponentProps) {
    const logout = useSetAtom(logoutAtom)
    const [profile, loadProfile] = useAtom(loadProfileAtom)
    useEffect(() => {
        loadProfile()
    }, [])
    return <DrawerContentScrollView {...props} contentContainerStyle ={styles.scrollView}>
        <View style={styles.content}>
            <CloseDrawer onClose={props.navigation.closeDrawer}/>
            <UserMenu  user={profile.profile}/>
            {MENU.map((menu) => (
                <MenuItem key={menu.path} {...menu} drawer={props}/>
            ))}
        </View>
            
        <View style={styles.footer}>
            <Link style={{fontSize: 16, fontFamily: CustomFonts.medium, color: SystemColors.VeryLightBlue}} onPress={ () => logout() }  href={'/login'}>ВЫХОД</Link>
            {/* <Image style={styles.logo} source={require('../../../../assets/line-05.png')}/>             */}
            </View>            
    </DrawerContentScrollView>
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: SystemColors.MutedBlue
    },
    header: {
        paddingBottom: 0,
    },
    logo: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
    },
    content: {
        flex: 1,
        color: SystemColors.MutedBlue
    },
    footer: {        
        gap:40,
        marginBottom: 40,
        alignItems: 'center',
        fontFamily: CustomFonts.medium,
    }
})
