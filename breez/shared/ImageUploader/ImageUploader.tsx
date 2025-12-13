import { launchCameraAsync, requestCameraPermissionsAsync,PermissionStatus , useCameraPermissions, useMediaLibraryPermissions } from "expo-image-picker";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { CustomFonts, SystemColors } from "../tokens";
import UpLoadIcon from "../../assets/icons/upLoadIcon";
import FormData from "form-data";
import axios, { AxiosError } from "axios";
import { FILE_API } from "../api";
import { UploadResponse } from "./imageUploader.interface";
import { apiClient } from "@/entities/auth/api/client";


interface ImageUploaderProps {
    onUpload: (uri:string) => void
    onError? : (error: string) => void
}

export function ImageUploader ({onUpload}: ImageUploaderProps) {
    const [libraryPermission, requestLibraryPermission] = useMediaLibraryPermissions()
    const upload = async () => {
        
    }
    const [cameraPermissionInfo, requestPermission] = useCameraPermissions();
    const verifyCameraPermission = async () => {
        const cameraPermissionInfo = await requestCameraPermissionsAsync()
        if (cameraPermissionInfo?.status === PermissionStatus.UNDETERMINED) {
            const response = await requestPermission();
            return response.granted;
        }        
        if (cameraPermissionInfo?.status === PermissionStatus.DENIED) {
            Alert.alert(
                'Недостаточно прав',
                'Для работы с камерой необходимо предоставить разрешение',
                [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Настройки', onPress: () => Linking.openSettings() }
                ]
            );
            return false;
        }        
        return true;
    }
    const pickAvatar = async () => {
        const isPermissionGranted = await verifyCameraPermission();
        if (!isPermissionGranted) return;
        try {
            const result = await launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 1,
            });            
            if (!result.canceled) {
                await uploadToServer(result.assets[0].uri, result.assets[0].fileName ?? '')
            }
        } catch (error) {
            console.error('Ошибка при вызове камеры:', error);
            Alert.alert('Ошибка', 'Не удалось открыть камеру');
        }
    }

    const uploadToServer = async (uri: string, name: string) => {
        const formData = new FormData()
        formData.append('files', {
            uri,
            name,
            type: 'image/jpeg'
        })
        try {const { data } = await apiClient.post<UploadResponse>(FILE_API.uploadImage, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        onUpload(data.urls.original)
    } catch(error) {
        if (error instanceof AxiosError) {
            console.error(error)
        }
        return null
        }
    
    }

    return (
    <Pressable onPress={pickAvatar}>
        <View style={styles.container}>
            <UpLoadIcon />
            <Text style={styles.text}>cделать фотографию</Text>
        </View>
    </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        backgroundColor: SystemColors.MutedBlue,
        borderRadius:3,
        paddingHorizontal: 20,
        paddingVertical: 17,
        alignItems: 'center'
    },
    text: {
        fontSize: 16,
        fontFamily: CustomFonts.regular,
        color: SystemColors.VeryLightBlue
    }
})