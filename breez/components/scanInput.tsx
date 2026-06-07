import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { CustomFonts, SystemColors } from "@/shared/tokens";
import Scanner from "@/assets/icons/ScannerIcon";

interface ScanInputProps {
    value: string
    onChangeText: (text: string) => void
    placeholder?: string
    onScan: () => void
}
const ScanInput = ({ value, onChangeText, placeholder, onScan }: ScanInputProps) => {
    return (
        <View style={styles.container}>
            <TextInput 
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={SystemColors.VeryLightBlue}
                autoCapitalize='characters'
            />
            <TouchableOpacity style={styles.iconButton} onPress={onScan}>
                <Scanner size={20} color={SystemColors.VeryLightBlue} />
            </TouchableOpacity>    
        </View>
    )
}
const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: SystemColors.VeryLightBlue,
        borderRadius: 3,
        backgroundColor: SystemColors.MutedBlue
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        fontFamily: CustomFonts.regular,
        color: SystemColors.VeryLightBlue
        },
    iconButton: {
        paddingHorizontal: 10,
        paddingVertical: 10,
        justifyContent: 'center',
        alignItems: 'center'
    }
})
export default ScanInput