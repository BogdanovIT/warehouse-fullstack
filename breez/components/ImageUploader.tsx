import React, { useState } from "react";
import { View, StyleSheet, Image, Pressable, Alert } from 'react-native'
import { launchCameraAsync, requestCameraPermissionsAsync, PermissionStatus } from "expo-image-picker";
import { Button } from "../button/button";
import axios from "axios";

interface ImageType {
    source: any
    type: string
}
interface ImageUploaderProps {
    defaultImages: ImageType[]
    gateNumber: string
    emailRecipients: string[]
    operationType: 'receiving' | 'shipment'
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    defaultImages,
    gateNumber,
    emailRecipients,
    operationType
}) => {
    const [imageUris, setImageUris] = useState<(string | null)[]>(
        Array(defaultImages.length).fill(null)
    )
    const [isSending, setIsSending] = useState(false)
    const generateFileName = (photoType: string) => {
        const now = new Date()
        const dateStr = now.toISOString().split('T')[0]
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '')
        return `${dateStr}_${gateNumber}_${photoType}_${timeStr}.jpg`
    }
    const verifyCameraPermission = async () => {
        const { status } = await requestCameraPermissionsAsync()
        if (status === PermissionStatus.DENIED) {
            Alert.alert('Требуется доступ к камере')
            return false
        }
        return true
    }
    const takePhoto = async (index: number) => {
        const hasPermission = await verifyCameraPermission()
        if (!hasPermission) return
        try {const result = await launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.7
        })
        if (!result.canceled) {
            const newUris = [...imageUris]
            newUris[index] = result.assets[0].uri
            setImageUris(newUris)
        }} catch (error) {
            console.error('Camera error:', error)
            Alert.alert("Ошибка, не удалось открыть камеру")
        }
    }
    const handleSend =async () => {
        if (isSending) return

        const files = imageUris
        .map((uri, index) => ({
            uri, 
            name: generateFileName(defaultImages[index].type),
            type: 'image/jpeg',
            isDefault: uri === null
        }))
        .filter(file => !file.isDefault && file.uri !== null)
        
        if (files.length === 0) {
            Alert.alert('Нет новых фото для отправки')
            return
        }
        setIsSending(true)
        try {
            const formData = new FormData()
            files.forEach(file => {
                formData.append('files', {
                    uri: file.uri,
                    name: file.name,
                    type: file.type
                } as any)
            })
            formData.append('recipients', JSON.stringify(emailRecipients))
            formData.append('operationType', operationType)
            formData.append('gateNumber', gateNumber)
            await axios.post('/api/send-photos-direct', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            Alert.alert("Фото успешно отправлены")
            setImageUris(Array(defaultImages.length).fill(null))
        } catch (error) {
            console.error('Ошибка отправки', error)
            Alert.alert("Ошибка, не удалось отправить фото")
        } finally {
            setIsSending(false)
        }

    }
    return (
        <View style={styles.container}>
            {defaultImages.map((img, index) => (
                <Pressable key={index} onPress={()=>takePhoto(index)}>
                    <Image
                    source={imageUris[index] ? { uri: imageUris[index] } : img.source}
                    style={[styles.image, imageUris[index] && {borderColor: "green", borderWidth: 2}]}/>
                </Pressable>
            ))}
            <Button
            style={styles.sendButton}
            text={isSending ? 'ОТПРАВКА...' : 'ОТПРАВИТЬ'}
            onPress={handleSend}
            disabled={isSending}/>
        </View>
    )

}


const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 20,
        paddingVertical: 15
    },
    image: {
        width: '90%',
        aspectRatio: 16/9,
        borderRadius: 9,
        resizeMode: 'cover'
    },
    sendButton: {
        marginTop: 20,
        width: '90%'
    }
})