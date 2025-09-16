import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CustomFonts, SystemColors } from "../../shared/tokens";
import Telegram from "../../assets/icons/telegram";
import Whatsapp from "../../assets/icons/whatsapp";

export default function About () {
    const handlePress = () => {
        Linking.openURL("https://t.me/Bogdanov_IT").catch(err => console.error("Не удалось открыть ссылку", err))
    }
    const handlePressWA = () => {
        Linking.openURL("https://wa.me/79137509720").catch(err => console.error("Не удалось открыть ссылку", err))
    }
    return (
        
        <View style={{width: "87%", alignSelf: 'center', height: "100%", marginTop: 20}}>
            <Text style={styles.text}>Это приложение создано специально для облегчения работы. Буду рад вашей обратной связи, чтобы вместе сделать это приложение еще лучше. Если вы нашли ошибку, или у вас есть идеи для новых функций, обязательно напишите мне.</Text>
            <Text></Text>
            <View style={{flexDirection: 'row'}}>
                <Text style={styles.linkText} onPress={handlePress}><Telegram/></Text>
                <Text style={{...styles.linkText, paddingLeft:23}} onPress={handlePressWA}><Whatsapp/></Text>
            </View>

        </View>
    )
}
const styles = StyleSheet.create({
    text: {
        color: SystemColors.VeryLightBlue,
        fontFamily: CustomFonts.regular,
        fontSize: 18,
        lineHeight: 27

        
    },
    linkText: {
        fontFamily: CustomFonts.medium,
        fontSize: 18,
        color: SystemColors.VeryLightBlue,
        lineHeight: 27
    }
})