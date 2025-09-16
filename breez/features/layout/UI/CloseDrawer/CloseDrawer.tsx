import {  Pressable, StyleSheet, View} from "react-native";
import CloseIcon from "../../../../assets/icons/close";

export function CloseDrawer ({ onClose }: {onClose: ()=>void}) {

    return (
        <Pressable onPress={onClose}
         >
            <View style={styles.button}>
                <CloseIcon/>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'absolute',
        right: 0,
        top: -24
    },
})