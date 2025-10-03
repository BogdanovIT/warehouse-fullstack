import { Alert, Animated, Image, LayoutAnimation, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import SwitchButton from "../../switch/switch";
import { CustomFonts, SystemColors } from "../../shared/tokens";
import { useState, useEffect, useRef } from "react";
import { Input2 } from "../../shared/input/input copy";
import { launchCameraAsync, requestCameraPermissionsAsync, PermissionStatus, useCameraPermissions, useMediaLibraryPermissions } from "expo-image-picker";
import axios, { AxiosError } from "axios";
import { UploadResponse } from "../../shared/ImageUploader/imageUploader.interface";
import { FILE_API } from "../../shared/api";
import FormData from "form-data";
import { Button } from "../../button/button";
import { DefectivePhotosHandler } from "../../components/DefectivePhotosHandler";
import { useOperators } from "../../hooks/useOperators";
import { useAtom } from "jotai";
import { getUserProfile } from "../../api/user";
import { userProfileAtom } from "../../entities/user/model/user.state";
import { authAtom } from "../../entities/auth/model/auth.state";
import { Input } from "../../shared/input/input";
import { Config } from "@/config";

const API_URL = Config.HOME_URL
const DEFAULT_IMAGES = [
    require('../../assets/images/recieving/face.jpg'),
    require('../../assets/images/recieving/zakryto.jpg'),
    require('../../assets/images/recieving/plomba.jpg'),
    require('../../assets/images/recieving/open_100.jpg'),
    require('../../assets/images/recieving/80.jpg'),
    require('../../assets/images/recieving/60.jpg'),
    require('../../assets/images/recieving/40.jpg'),
    require('../../assets/images/recieving/20.jpg'),
    require('../../assets/images/recieving/0.jpg'),
    require('../../assets/images/recieving/number_container.jpg'),
]

export default function Receiving () {
    const [auth] = useAtom(authAtom)
    const [userProfile, setUserProfile] = useAtom(userProfileAtom)
    const [gateNumber, setGateNumber] = useState('')
    const [isContainer, setIsContaner] = useState(false)
    const [processPhotos, setProcessPhotos] = useState<(string | null)[]>(Array(10).fill(null))
    const [cameraPermissionInfo, requestPermission] = useCameraPermissions();
    const [defectivePhotos, setDefectivePhotos] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [comment, setComment] = useState('')
    const [resetPhotos, setResetPhotos] = useState(false)

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

    useEffect(() => {
        const loadProfile = async () => {
            if (auth?.access_token && !userProfile) {
                try {
                    const profile = await getUserProfile(auth.access_token)
                    setUserProfile(profile)
                } catch (error) {
                    console.error("Ошибка загрузки профиля", error)
                }
            }
        }
        loadProfile()
    }, [auth?.access_token, userProfile])

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
    const takePhoto = async (index: number) => {
        const isPermissionGranted = await verifyCameraPermission();
        if (!isPermissionGranted) return;
        try {
            const result = await launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.7,
            });            
            if (!result.canceled) {
                const newPhotos = [...processPhotos]
                newPhotos[index] = result.assets[0].uri
                setProcessPhotos(newPhotos)
            }
        } catch (error) {
            console.error('Ошибка при вызове камеры:', error);
            Alert.alert('Ошибка', 'Не удалось открыть камеру');
        }
    }
    
    const uploadPhotos = async (photos: string[], type: 'process' | 'defect') => {
        const formData = new FormData()
        photos.forEach((uri, index) => {
            if(uri) {
                formData.append('photos', {
                    uri,
                    name: `${type}_${Date.now()}_${index}.jpg`,
                    type: 'image/jpeg'
                } as any)
            }
        })
        const response = await fetch(`${API_URL}/api/upload-temp-photos`, {
            method: 'POST',
            body: formData as any,
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        })
        if (!response.ok) throw new Error("Ошибка загрузки фото на сервер")
            return await response.json()
       }
       const handleSubmit = async () => {
        if (!gateNumber) {
            Alert.alert("Укажите номер ворот")
            return
        }
        const processPhotosToUpload = processPhotos.filter(uri => uri) as string[]
        if (processPhotosToUpload.length === 0) {
            Alert.alert("Недостаточно фото для отправки")
            return
        }
        setIsSubmitting(true)
        try {
            const allPhotos = [...processPhotosToUpload, ...defectivePhotos]
            const uploadFormData = new FormData()
            allPhotos.forEach((uri, index) => {
                uploadFormData.append('photos', {
                    uri,
                    name: `photo_${Date.now()}_${index}.jpg`,
                    type: 'image/jpeg'
                } as any)
            })
            const uploadResponse = await fetch(`${API_URL}/api/upload-temp-photos`, {
                method: 'POST',
                body: uploadFormData as any,
                headers: {'Content-Type': 'multipart/form-data',}
            })
            if (!uploadResponse.ok) throw new Error ("Ошибка загрузки фото на сервер")
            const { savedPaths } = await uploadResponse.json()
            const processPaths = savedPaths.slice(0, processPhotosToUpload.length)
            const defectPaths = savedPaths.slice(processPhotosToUpload.length)
            const mailData = {
                gateNumber,
                recipients: userProfile?.operators || [],
                processPhotos: processPaths,
                defectivePhotos: defectPaths,
            }
            const mailResponse = await fetch(`${API_URL}/api/receiving/send`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json',},
                body: JSON.stringify(mailData)
            })
            const result = await mailResponse.json()
            if (!result.success) throw new Error ("Ошибка отправки письма клиент")


            Alert.alert("Успешно", "Отчет отправлен")
            setProcessPhotos(Array(10).fill(null))
            setDefectivePhotos([])
            setGateNumber('')
            setComment('')
            setResetPhotos(prev => !prev)
        } catch (error: any) {
            Alert.alert("Ошибка", error.message || "Непредвиденная ошибка")
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <SafeAreaView style={{flex: 1}}>
            <View>
                <View style={{paddingTop: 10, flexDirection: 'row'}}>
                    <View style={{width: '45%', 
                        alignItems: 'flex-start',
                        paddingLeft: 25,
                        justifyContent: 'center'}}>
                            <Text style={{...styles.text, color: SystemColors.VeryLightBlue}}>Ворота №</Text>
                    </View>
                    <View style={{width: '55%', 
                        alignItems: 'flex-start', 
                        justifyContent: 'center',
                        }}><Input style={{width: 40,borderRadius: 3, color: SystemColors.VeryLightBlue, 
                        textAlign: 'center', borderColor: SystemColors.VeryLightBlue, borderWidth: 1}} 
                        value={gateNumber} onChangeText={text => setGateNumber(text)}/>
                    </View>
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop:10, paddingBottom: 15}}>
                <View style={{width: '45%', alignItems: 'flex-start', paddingLeft: 25}}>
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
            <View style={{width: "90%", alignSelf: 'center'}}>
            <DefectivePhotosHandler
            onImagesChange={setDefectivePhotos}
            key={resetPhotos ? 'photos_reset' : 'photos_normal'}
            buttonText={{
                show: "БРАК В ПРИХОДЕ",
                hide: "СКРЫТЬ ФОТО"
            }}
            title=" Фото брака"/> 
            {/* поставил костыль в виде пробела перед текстом для выравнивания */}
            </View>
            <ScrollView style={styles.scrollContainer}>
            <View style={styles.container}>
                {DEFAULT_IMAGES.slice(0,9).map((defaultImage, index)=>(
                <Pressable key={index} onPress={()=>takePhoto(index)}>
                    <Image source={processPhotos[index] ? {uri: processPhotos[index]!} : defaultImage}
                    style={{ width: '90%', height: undefined, resizeMode:'cover', aspectRatio:16/9, borderRadius: 9}}/>
                </Pressable>
                ))}
                { !isContainer && (
                    <Pressable onPress={()=> takePhoto(9)}>
                        <Image 
                        source={processPhotos[9] ? {uri: processPhotos[9]!} : DEFAULT_IMAGES[9]}
                        style={{ width: '90%', height: undefined, resizeMode:'cover', aspectRatio:16/9, borderRadius: 9}}
                        />
                    </Pressable>
                )}
            </View>
            <View style={styles.buttonContainer}>
            <Animated.View style={{transform: [{ scale: buttonScale }] }}>
            <Button style={styles.button} text={isSubmitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ"}
             onPress={handleSubmit} disabled={isSubmitting}/>
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
        gap: 30,
        marginTop: 20
    },
    buttonContainer: {
        paddingVertical: 40, 
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
        fontFamily: CustomFonts.medium,
        borderRadius:6
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
        borderRadius: 6,
        resizeMode: 'cover'
    },
    addDefectiveButton: {
        width: 150,
        height: 100,
        borderRadius: 6,
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