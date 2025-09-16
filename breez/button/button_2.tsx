import { Animated, GestureResponderEvent, Pressable, PressableProps, StyleSheet, Text} from "react-native";
import { Colors, CustomFonts, SystemColors } from "../shared/tokens";
import { CustomDrawer } from "../widget/layout/ui/CustomDrawer/CustomDrawer";

export function Button_2 ({text, ...props}: PressableProps & {text: string}) {
    const animatedValue = new Animated.Value(100)
    const color = animatedValue.interpolate({
        inputRange: [0,100],
        outputRange: ["#0b3784", "#abcdef"]
    })

    const fadeIn = (e: GestureResponderEvent)=> {
        Animated.timing(animatedValue, {
            toValue: 0,
            duration:200,
            useNativeDriver: true
        }).start()
        props.onPressIn && props.onPressIn(e)}

    const fadeOut = (e: GestureResponderEvent) => {
        Animated.timing(animatedValue, {
            toValue:300,
            duration:200,
            useNativeDriver: true
        }).start()
        props.onPressOut && props.onPressOut(e)
    }
    return (
        <Pressable {...props} onPressIn={fadeIn} onPressOut={fadeOut}>
            <Animated.View style={{...styles.button, backgroundColor: color}}>
                <Text style={styles.text}>{text}</Text>
            </Animated.View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.blue,
        height: 48,   
        backgroundColor: SystemColors.VeryLightBlue,
    },
    text: {
        color: '#0b3784',
        fontSize: 16,
        fontFamily: CustomFonts.regular
    }
})