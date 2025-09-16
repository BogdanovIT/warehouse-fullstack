import { useRouter } from "expo-router";
import { View, Text, StyleSheet, Image } from "react-native";
import { CustomFonts, SystemColors } from "../shared/tokens";
import { Button_2 } from "../button/button_2";

export default function UnmatchedCustom() {
    const router = useRouter()
    const comeback = () => {
        router.push('/')
    }
    
    return (
        <View style={style.container}>
            <Image style={style.logo} source={require("./../assets/images/logo.png")}/>
            <View style={style.content}>
                <Text style={style.errorText}>ЭТА СТРАНИЦА</Text>
                <Text style={style.errorText}>ЕЩЕ НЕ СОЗДАНА</Text>
            </View>
            <View style={style.form}>
                <Button_2 text='Вернуться на главную' onPress={comeback}/>
            </View>
        </View>
    )
}

const style = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 55,
        gap: 15,
        backgroundColor: SystemColors.LightBlue,

      },
      logo: {
        width: 130,
        height: 130,
        resizeMode: 'contain',
        marginBottom: 95,
        marginTop:60
      },
      form: {
        alignSelf: 'stretch',
        gap: 25,
      },
      content:{
        alignItems: 'center',
        textAlign: 'center',
      },
    errorText: {
        fontFamily: CustomFonts.medium,
        fontSize: 28,
        color: SystemColors.PrimaryBlue
    
    },
    errorText2: {
        fontFamily: CustomFonts.regular,
        fontSize: 28,
        color: SystemColors.MutedBlue
    },
    comebackText: {
        fontFamily: CustomFonts.regular,
        fontSize: 18,
        color: SystemColors.MutedBlue
    },
})