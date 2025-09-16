import { useEffect, useState } from "react";
import { ErrorNotificationProps } from "./ErrorNotificationProps"; 
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import { Colors } from "../tokens"; 

export function ErrorNotification({error}: ErrorNotificationProps) {
    const [isShown, setIsShown] = useState<boolean>(false)
    const animatedValue = new Animated.Value(-100)
    const onEnter = () => {
        Animated.timing(animatedValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
        }).start()
    }
    
    useEffect(() => {
        if (!error || error.trim()==="") {
            setIsShown(false)
            return
        }
        setIsShown(true);
        
        const timerId = setTimeout(()=>{
            setIsShown(false)
        }, 3000)
        return () => {
            clearTimeout(timerId)
        }
    }, [error])

    if (!isShown || !error || error.trim() === "") {
        return null
    }
    return (
        <Animated.View style={{
            ...styles.error, transform: [
            {translateY: animatedValue}
        ]
        }} onLayout={onEnter}>
            <Text style={styles.errorText}>{error}</Text>
        </Animated.View>)
}

const styles = StyleSheet.create({
    error: {
        position: 'absolute',
        width: Dimensions.get('screen').width,
        backgroundColor: 'red',
        padding: 15,
        top: 50,
    },
    errorText: {
        fontSize: 16,
        color: '#fff'
    }
})