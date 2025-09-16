import {  Pressable, PressableProps, StyleSheet, View} from "react-native";
import { Colors, SystemColors } from "../../../../shared/tokens"; 
import MenuIcon from "../../../../assets/icons/menu-icon";
import { useState } from "react";

export function MenuButton ({navigation, ...props}: PressableProps & {navigation: any}) {

    const [clicked, setClicked] = useState<boolean>(false)
    
    return (
        <Pressable {...props} 
        onPressIn={()=>setClicked(true)} 
        onPressOut={()=>setClicked(false)}
        onPress={()=>navigation.toggleDrawer()}
         >
            <View style={{...styles.button, backgroundColor: clicked ? SystemColors.MutedBlue : SystemColors.PrimaryBlue }}>
                <MenuIcon/>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
 
})