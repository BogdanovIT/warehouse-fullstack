import { Pressable, StyleSheet , TextInput, TextInputProps, View } from "react-native";
import { SystemColors } from "../tokens";
import { useState } from "react";
import EyeOpenIcon from "../../assets/icons/eye-opened";
import EyeClosedIcon from "../../assets/icons/eye-closed";

export function InputRegister({isPassword, ...props}: TextInputProps & { isPassword?: boolean}) {
    const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false)
    return (
        <View>
            <TextInput style={styles.input}
            secureTextEntry = {isPassword && !isPasswordVisible}
            placeholderTextColor={SystemColors.VeryLightBlue} 
            {...props} />
            {isPassword && <Pressable onPress={()=> setIsPasswordVisible(state => !state)} style={styles.eyeicon}>
                {isPasswordVisible ? <EyeOpenIcon/> : <EyeClosedIcon/>}
                </Pressable>}
        </View>
    )
}

const styles = StyleSheet.create({
    input: {
        height:50,
        backgroundColor: SystemColors.PrimaryBlue,
        paddingHorizontal: 24,
        borderRadius: 3,
        fontSize: 16,
        color:SystemColors.VeryLightBlue ,
        borderWidth: 0.5,
        textAlign: 'center',
    },
    eyeicon: {
        position: 'absolute',
        right: 0,
        paddingHorizontal:70,
        paddingVertical: 8,
        color: SystemColors.PrimaryBlue
    }
})