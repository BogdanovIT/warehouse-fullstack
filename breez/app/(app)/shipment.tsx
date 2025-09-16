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

const API_URL = process.env.HOME_URL
interface ImageUploaderProps {
    onUpload: (uri:string) => void
    onError? : (error: string) => void
}

const DEFAULT_IMAGES = [
    require('../../assets/images/recieving/face.jpg'),
    require('../../assets/images/recieving/0.jpg'),
    require('../../assets/images/recieving/20.jpg'),
    require('../../assets/images/recieving/40.jpg'),
    require('../../assets/images/recieving/60.jpg'),
    require('../../assets/images/recieving/80.jpg'),
    require('../../assets/images/recieving/open_100.jpg'),
    require('../../assets/images/recieving/zakryto.jpg'),
    require('../../assets/images/recieving/plomba.jpg'),
    require('../../assets/images/recieving/number_container.jpg'),
]

export default function Shipment ({onUpload}: ImageUploaderProps) {
    const [isContainer, setIsContaner] = useState(false)
    const [imageUris, setImageUris] = useState<(string | null)[]>(Array(10).fill(null))
    const [cameraPermissionInfo, requestPermission] = useCameraPermissions();
    const [showDefectiveProducts, setShowDefectiveProducts] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadedPhotoPaths, setUploadedPhotoPaths] = useState<string[]>([])
    const [gateNumber, setGateNumber] = useState('')
    const [auth] = useAtom(authAtom)
    const [userProfile, setUserProfile] = useAtom(userProfileAtom)
    useEffect(()=> {loadProfileDebounced()}, [auth?.access_token])

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
    const [tempPhotoUris, setTempPhotoUris] = useState<(string | null )[]>(Array(10).fill(null))

    function debounce<F extends (...args: any[]) => any>(func: F, wait: number): F {
        let timeout: ReturnType<typeof setTimeout> | null = null
        return ((...args: Parameters<F>) => {
            if (timeout !== null)
            {clearTimeout(timeout)}
            timeout = setTimeout(()=>func(...args), wait)
        }) as F
    }

    const loadProfileDebounced = debounce(async () => {
        if (auth?.access_token && !userProfile) {
            try {
                const profile = await getUserProfile(auth.access_token!)
                setUserProfile(profile)
            } catch (error) {
                console.error("Ошибка загрузки профиля", error)
            }
        }
    }, 500)
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
                quality: 1,
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
                    name: `Отгрузка_${Date.now().toLocaleString}_Ворота${gateNumber}.jpg`,
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
    
    const sendShipmentsPhoto = async () => {
        if (!gateNumber) {
            Alert.alert("Укажите номер ворот")
            return
        }
        const photosToUpload = tempPhotoUris.filter(uri => uri) as string[]
        if (photosToUpload.length === 0) {
            Alert.alert("Недостаточно фотографий для отправки")
            return
        }

        setIsSubmitting(true)
        try {
            const { savedPaths } = await uploadPhotoToServer(photosToUpload)
            const response  = await fetch(`${API_URL}/api/shipment/send`, {
                method: "POST",
                body: JSON.stringify({
                    photoPaths: savedPaths,
                    gateNumber: gateNumber,
                    recipients: userProfile?.operators || []
                }),
                headers: { 'Content-Type': 'application/json'}
            })
            if (!response.ok) throw new Error("Ошибка отправки")

            Alert.alert("Фото успешно отправлены")
            setImageUris(Array(10).fill(null))
            setTempPhotoUris(Array(10).fill(null))
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
        setImageUris(Array(10).fill(null))
        Alert.alert("Все изображения удалены")
    }
    const toggleDefectiveProducts = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
        setShowDefectiveProducts(!showDefectiveProducts)
    }
    return (
        <SafeAreaView style={{flex: 1}}>
            <View>
                <View style={{paddingTop: 10, flexDirection: 'row'}}>
                    <View style={{width: '45%', 
                        alignItems: 'flex-start',
                        paddingLeft: 20,
                        justifyContent: 'center'}}>
                            <Text style={{...styles.text, color: SystemColors.VeryLightBlue}}>Ворота №</Text>
                    </View>
                    <View style={{width: '55%', 
                        alignItems: 'flex-start', 
                        justifyContent: 'center',
                        }}><Input style={{width: 40,borderRadius: 3, color: SystemColors.VeryLightBlue, textAlign: 'center', borderColor: SystemColors.VeryLightBlue, borderWidth: 1}} value={gateNumber} onChangeText={text => setGateNumber(text)}/>
                    </View>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop:10, paddingBottom: 15}}>
                <View style={{width: '45%', alignItems: 'flex-start', paddingLeft: 20}}>
                    <Text style={{...styles.text, 
                        color: !isContainer? SystemColors.VeryLightBlue : SystemColors.VeryLightBlue,
                        opacity: isContainer? 0.15 : 1
                    }}>Контейнер</Text>
                </View>
                <View style={{width: '10%', alignItems: 'center'}}>
                    <SwitchButton 
                    value={isContainer}
                    onChange={(newValue) => setIsContaner(newValue)}/>
                </View>
                <View style={{width: '45%', alignItems: 'flex-start', paddingLeft: 55}}>
                    <Text style={{...styles.text, 
                        color: isContainer? SystemColors.VeryLightBlue : SystemColors.VeryLightBlue,
                        opacity: isContainer? 1 : 0.15
                    }}>Авто</Text>
                </View>
            </View>
            
            
            <ScrollView style={styles.scrollContainer}>
            <View style={styles.container}>
                {DEFAULT_IMAGES.slice(0,9).map((defaultImage, index)=>(
                <Pressable key={index} onPress={()=>pickAvatar(index)}>
                    <Image source={tempPhotoUris[index] ? {uri: tempPhotoUris[index]!} : defaultImage}
                    style={{ width: '90%', height: undefined, resizeMode:'cover', aspectRatio:16/9, borderRadius: 3}}/>
                </Pressable>
                ))}
                { !isContainer && (
                    <Pressable onPress={()=> pickAvatar(9)}>
                        <Image 
                        source={tempPhotoUris[9] ? {uri: tempPhotoUris[9]!} : DEFAULT_IMAGES[9]}
                        style={{ width: '90%', height: undefined, resizeMode:'cover', aspectRatio:16/9, borderRadius: 3}}
                        />
                    </Pressable>
                )}
            </View>
            <View style={styles.buttonContainer}>
            <Animated.View style={{transform: [{ scale: buttonScale }] }}>
            <Button style={styles.button} text={isSubmitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ"} onPress={sendShipmentsPhoto}
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