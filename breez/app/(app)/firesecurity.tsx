import { Alert, Animated, Image, LayoutAnimation, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import SwitchButton from "../../switch/switch";
import { CustomFonts, SystemColors } from "../../shared/tokens";
import { useEffect, useRef, useState } from "react";
import { launchCameraAsync, requestCameraPermissionsAsync, PermissionStatus, useCameraPermissions, useMediaLibraryPermissions } from "expo-image-picker";
import FormData from "form-data";
import { Button_2 } from "../../button/button_2";
import { Button } from "../../button/button";
import { Input } from "../../shared/input/input";
import { getUserProfile } from "../../api/user";
import { userProfileAtom } from "../../entities/user/model/user.state";
import { authAtom } from "../../entities/auth/model/auth.state";
import { useAtom } from "jotai";
import { Config } from "@/config";

const API_URL = Config.HOME_URL
interface ImageUploaderProps {
    onUpload: (uri:string) => void
    onError? : (error: string) => void
}

const DEFAULT_IMAGES = [
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_1.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_2.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_3.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_4.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_5.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_6.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_7.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_8.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_9.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_10.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_11.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_12.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_13.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_14.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_15.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_16.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_17.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_18.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_19.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_20.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_21.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_22.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_23.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_24.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_25.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_26.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_27.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_28.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_29.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_30.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_31.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_32.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_33.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_34.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_35.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_36.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_37.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_38.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_39.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_40.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_41.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_42.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_43.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_44.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_45.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_46.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_47.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_в10.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_в11.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_в15.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_в17.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_в18.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_в19.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_в25.jpg'),
    require('../../assets/images/firesecurity/app_sklad_photo_fire_safety_в26.jpg'),

]

export default function FireSecurity ({onUpload}: ImageUploaderProps) {
    const [isContainer, setIsContaner] = useState(false)
    const [imageUris, setImageUris] = useState<(string | null)[]>(Array(10).fill(null))
    const [cameraPermissionInfo, requestPermission] = useCameraPermissions();
    const [showDefectiveProducts, setShowDefectiveProducts] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadedPhotoPaths, setUploadedPhotoPaths] = useState<string[]>([])
    const [gateNumber, setGateNumber] = useState('')
    const [auth] = useAtom(authAtom)
    const [userProfile, setUserProfile] = useAtom(userProfileAtom)
    
    const buttonScale = useRef( new Animated.Value(1)).current
    const animateButton = () => {
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start()
    }
    useEffect(()=> {
        const loadProfile = async () => {
            if (auth?.access_token && !userProfile) {
                try {
                    const profile = await getUserProfile(auth.access_token!)
                    setUserProfile(profile)
                } catch(error) {
                    console.error("Ошибка загрузки профиля:", error)
                }
            }
        }
        loadProfile()
    }, [auth?.access_token, userProfile])
    const [tempPhotoUris, setTempPhotoUris] = useState<(string | null )[]>(Array(10).fill(null))

    function debounce<F extends (...args: any[]) => any>(func: F, wait: number): F {
        let timeout: ReturnType<typeof setTimeout> | null = null
        return ((...args: Parameters<F>) => {
            if (timeout !== null)
            {clearTimeout(timeout)}
            timeout = setTimeout(()=>func(...args), wait)
        }) as F
    }

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
    const pickAvatar = async (index: number) => {
        const isPermissionGranted = await verifyCameraPermission();
        if (!isPermissionGranted) return;
        try {
            const result = await launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.4,
            });            
            if (!result.canceled) {
                const newImageUris = [...tempPhotoUris]
                newImageUris[index] = result.assets[0].uri
                setTempPhotoUris(newImageUris)
            }
        } catch (error) {
            console.error('Ошибка при вызове камеры:', error);
            Alert.alert('Ошибка', 'Не удалось открыть камеру');
        }
    }
    const uploadPhotoToServer = async (photos: string[]) => {
        try {
            const formData = new FormData()
            photos.forEach((uri, index) => {
                formData.append('photos', {
                    uri,
                    name: `Фотоотчет по пожарной безопасности${Date.now().toLocaleString}.jpg`,
                    type: 'image/jpeg'
                } as any)
            })
            const response = await fetch(`${API_URL}/api/upload-temp-photos`, {
                method: 'POST',
                body: formData as any,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            })
            if (!response.ok) {
                throw new Error("Ошибка загрузки фотографий на сервер")
            }
            return await response.json()
        } catch (error) {
            console.error("Ошибка загрузки фотографий на сервер:", error)
            throw error
        }
    }
    
    const sendFireSafetyPhoto = async () => {
        
        const photosToUpload = tempPhotoUris.filter(uri => uri) as string[]
        if (photosToUpload.length < 55) {
            Alert.alert("Не все слоты заполнены")
            return
        }

        setIsSubmitting(true)
        try {
            const { savedPaths } = await uploadPhotoToServer(photosToUpload)
            const response  = await fetch(`${API_URL}/api/shipment/send`, {
                method: "POST",
                body: JSON.stringify({
                    photoPaths: savedPaths,
                    // gateNumber: gateNumber,
                    // recipients: userProfile?.operators || []
                    recipients: ['abogdanov@breez.ru']
                }),
                headers: { 'Content-Type': 'application/json'}
            })
            if (!response.ok) throw new Error("Ошибка отправки")

            Alert.alert("Фото успешно отправлены")
            setImageUris(Array(55).fill(null))
            setTempPhotoUris(Array(55).fill(null))
            setGateNumber('')
        } catch (error: unknown) {
            if (error instanceof Error)
            {Alert.alert("Ошибка:", error.message)}
            else {Alert.alert("Неизвестная ошибка")
                console.error(error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const clearAllImages = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setImageUris(Array(55).fill(null))
        Alert.alert("Все изображения удалены")
    }
    const toggleDefectiveProducts = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setShowDefectiveProducts(!showDefectiveProducts)
    }
    return (
        <SafeAreaView style={{flex: 1}}>
                        
            <ScrollView style={styles.scrollContainer}>
            <View style={styles.container}>
                {DEFAULT_IMAGES.slice(0,9).map((defaultImage, index)=>(
                <Pressable key={index} onPress={()=>pickAvatar(index)}>
                    <Image source={tempPhotoUris[index] ? {uri: tempPhotoUris[index]!} : defaultImage}
                    style={{ width: '90%', height: undefined, resizeMode:'cover', aspectRatio:16/9, borderRadius: 3}}/>
                </Pressable>
                ))}
                { !isContainer && (
                    <Pressable onPress={()=> pickAvatar(54)}>
                        <Image 
                        source={tempPhotoUris[54] ? {uri: tempPhotoUris[54]!} : DEFAULT_IMAGES[54]}
                        style={{ width: '90%', height: undefined, resizeMode:'cover', aspectRatio:16/9, borderRadius: 3}}
                        />
                    </Pressable>
                )}
            </View>
            <View style={styles.buttonContainer}>
            <Animated.View style={{transform: [{ scale: buttonScale }] }}>
            <Button style={styles.button} text={isSubmitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ"} onPress={sendFireSafetyPhoto}
            disabled={isSubmitting}/>
            </Animated.View>
            </View>
        </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    text: {
        fontSize: 18,
        fontFamily: CustomFonts.regular  
    },
    container: {
        alignItems: 'center', 
        gap: 30
    },
    buttonContainer: {
        paddingVertical: 30, 
        alignItems: 'center',
        marginBottom: 40
    },
    button: {
        width: 250,
        alignSelf: 'center'
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 60
    },
    toggleButtonContainer: {
        paddingVertical: 15,
        alignItems: 'center'
    },
    toggleButton: {
        width: '90%',
        backgroundColor: SystemColors.LightBlue,
        fontFamily: CustomFonts.medium
    },
    defectiveContainer: {
        marginTop: 0,
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    defectiveTitle: {
        fontSize: 16,
        fontFamily: CustomFonts.regular,
        color: SystemColors.VeryLightBlue,
        marginBottom: 15,
        textAlign: 'center'
    },
    defectiveImagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15
    },
    defectiveImage: {
        width: 150,
        height: 100,
        borderRadius: 3,
        resizeMode: 'cover'
    },
    addDefectiveButton: {
        width: 150,
        height: 100,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: SystemColors.VeryLightBlue,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)'
    },
    addDefectiveButtonText: {
        color: SystemColors.VeryLightBlue,
        textAlign: 'center',
        fontFamily: CustomFonts.regular,
        fontSize: 14
    }
})