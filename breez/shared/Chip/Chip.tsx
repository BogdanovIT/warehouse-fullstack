import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../tokens";

export function Chip({ text }: { text: string }) {
    return <View style={styles.container}>
        <Text style={styles.text}>{ text }</Text>
    </View>
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderColor: Colors.lightBlue,
        borderRadius: 3,
        borderWidth: 1
    },
    text: {
        fontFamily: 'FiraSans',
        fontSize: 14,
        color: Colors.veryDarkBlue
    },
})