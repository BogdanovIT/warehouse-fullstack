import { StyleSheet , TextInput, View } from "react-native";
import { SystemColors } from "../tokens";



export function Input2() {

    return (
        <View>
            <TextInput style={styles.input}
            placeholderTextColor={SystemColors.VeryLightBlue}/>
        </View>
    )
}

const styles = StyleSheet.create({
    input: {
        height:40,
        width: 40,
        backgroundColor: SystemColors.MutedBlue,
        borderRadius: 3,
        fontSize: 16,
        color:SystemColors.VeryLightBlue ,
        borderWidth: 0.5,
        borderColor: SystemColors.VeryLightBlue,
        textAlign: 'center',
        justifyContent: 'flex-end'
    },
})