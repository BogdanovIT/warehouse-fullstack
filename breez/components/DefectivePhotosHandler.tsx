import React, { useState } from "react";
import { View, Text, Pressable, Image, StyleSheet, Alert, LayoutAnimation } from "react-native";
import { launchCameraAsync, useCameraPermissions, PermissionStatus } from "expo-image-picker";
import * as Linking from 'expo-linking'
import { SystemColors, CustomFonts } from "../shared/tokens";

interface DefectivePhotosHandlerProps {
    onImagesChange?: (images: string[]) => void
    buttonText?: {
        show: string
        hide: string
    }
    title?: string
}

export const DefectivePhotosHandler: React.FC<DefectivePhotosHandlerProps> = ({
    onImagesChange,
    buttonText = { show: "ФОТО БРАКА", hide: "СКРЫТЬ ФОТО"},
    title = "Добавьте фото брака"
}) => {
    const [showDefectiveProducts, setShowDefectiveProducts] = useState(false)
    const [defectiveImages, setDefectiveImages] = useState<string[]>([])
    const [cameraPermissionInfo, requestPermission] = useCameraPermissions()
    const verifyCameraPermission = async () => {
        if (cameraPermissionInfo?.status === PermissionStatus.UNDETERMINED){
            const response = await requestPermission()
            return response.granted
        }
        if (cameraPermissionInfo?.status === PermissionStatus.DENIED) {
            Alert.alert(
                "Недостаточно прав",
                "Для работы с камерой необходимо предоставить разрешение",
                [
                    {text: "Отмена", style: 'cancel'},
                    {text: "Настройки", onPress: () => Linking.openSettings()}
                ]
            )
            return false
        }
        return true
    }
    const pickDefectiveImages = async () => {
        const isPermissionGranted = await verifyCameraPermission()
        if (!isPermissionGranted) return

        try {
            const result = await launchCameraAsync ({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.7
            })
            if (!result.canceled) {
                const newDefectiveImages = [...defectiveImages, result.assets[0].uri]
                setDefectiveImages(newDefectiveImages)
                onImagesChange?.(newDefectiveImages)
            }
        } catch (error) {
            console.error("Ошибка при вызове камеры:", error)
            Alert.alert("Ошибка, не удалось открыть камеру")
        }
    }
    const toggleDefectiveProducts = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setShowDefectiveProducts(!showDefectiveProducts)
    }
    const removeImage = (index: number) => {
        const newImages = [...defectiveImages]
        newImages.splice(index, 1)
        setDefectiveImages(newImages)
        onImagesChange?.(newImages)
    }
    return (
        <View>
            <Pressable
            style={styles.toggleButton}
            onPress={toggleDefectiveProducts}>
                <Text style={styles.toggleButtonText}>
                    {showDefectiveProducts ? buttonText.hide : buttonText.show}
                </Text>
            </Pressable>
                {showDefectiveProducts && (
                    <View style={styles.defectiveContainer}>
                        <Text style={styles.defectiveTitle}>{title}</Text>
                        <View style={styles.defectiveImagesContainer}>
                            {defectiveImages.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Pressable onPress={() => removeImage(index)} style={styles.deleteButton}>
                                        <Text style={styles.deleteButtonText}>x</Text>
                                    </Pressable>
                                    <Pressable onPress={() => pickDefectiveImages()}>
                                        <Image 
                                        source={{uri}}
                                        style={styles.defectiveImage}/>
                                    </Pressable>
                                </View>
                            ))}
                            <Pressable  style={styles.addDefectiveButton}
                            onPress={() => pickDefectiveImages()}>
                            <Text style={styles.addDefectiveButtonText}>+</Text>
                            </Pressable>                        
                    </View>
                </View>
            )}
        </View>
    )
}
const styles = StyleSheet.create ({
    toggleButton: {
        padding: 10,
        backgroundColor: SystemColors.LightBlue,
        borderRadius: 6,
        alignItems: 'center',
        marginVertical: 10,
        height: 48,
        justifyContent: 'center',
        width: "70%",
        alignSelf: 'center'
    },
    toggleButtonText: {
        color: SystemColors.PrimaryBlue,
        fontFamily: CustomFonts.medium,
        fontSize: 18,
    },
    defectiveContainer: {
        marginTop: 10,

        backgroundColor: SystemColors.MutedBlue,
        borderRadius: 9,
        width: "100%",
        alignSelf: 'center'

    },
    defectiveTitle: {
        fontSize: 18,
        fontFamily: CustomFonts.regular,
        marginBottom: 10,
        color: SystemColors.VeryLightBlue,
    },
    defectiveImagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: "flex-start",
    },
    imageWrapper: {
        position: 'relative',
        margin: 3,
        
    },
    defectiveImage: {
        width: 80,
        height: 80,
        borderRadius: 6,
    },
    addDefectiveButton: {
        width: 80,
        height: 80,
        margin: 5,
        borderRadius: 6,
        backgroundColor: SystemColors.MutedBlue,
        borderWidth: 1.5,
        borderColor: SystemColors.VeryLightBlue,
        justifyContent: 'center',
        alignItems: 'center'
    },
    addDefectiveButtonText: {
        fontSize: 24,
        color: SystemColors.VeryLightBlue,
    },
    deleteButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 20,
        height: 20,
        borderRadius: 9,
        backgroundColor: SystemColors.PrimaryBlue,
        zIndex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    deleteButtonText: {
        color: SystemColors.VeryLightBlue,
        fontFamily: CustomFonts.bold,
        fontSize: 14,
        lineHeight: 18,
    },
})
