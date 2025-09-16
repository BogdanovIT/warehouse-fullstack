import { Alert, KeyboardAvoidingView, Animated, Easing, LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { CustomFonts, SystemColors } from "../../shared/tokens";
import { Input } from "../../shared/input/input";
import { Picker } from '@react-native-picker/picker';
import { useEffect, useRef, useState } from "react";
import { Button } from "../../button/button";
import { useAtom } from "jotai";
import { userProfileAtom } from "../../entities/user/model/user.state";
import { getUserProfile } from "../../api/user";
import { authAtom } from "../../entities/auth/model/auth.state";
import { DOCUMENT_PREFIXES, LocationKeys, WarehouseKeys } from "../../shared/documentPrefixes";
import { DefectivePhotosHandler } from "../../components/DefectivePhotosHandler";

export default function brakodel() {
    const [auth] = useAtom(authAtom)
    const [userProfile, setUserProfile] = useAtom(userProfileAtom)
    const scrollViewRef = useRef<ScrollView>(null)
    const handleFocus = () => scrollViewRef.current?.scrollToEnd({animated: true})
    const currentDate = new Date().toLocaleDateString() //Date
    const [place, setPlace] = useState('') //Place  Н- Е- Р- Б- С- 
    const [inputValuePlace, setInputValuePlace] = useState("Разгрузка")  // СК || ПР
    const [inputValuePrefix, setInputValuePrefix] = useState("NS-")
    const [prefix, setPrefix] = useState('')
    const [articleCode, setArticleCode] = useState('') //NS-Code
    const [productName, setProductName] = useState('') //Product
    const [numberSSCC, setNumberSSCC] = useState('') //SSCC
    const [docNumber, setDocNumber] = useState('')  //Document
    const [serialNumber, setSerialNumber] = useState('') //SN
    const [sortValue, setSortValue] = useState<string>('Сорт 1') //Sort
    const [comment, setComment] = useState('')  //Comment
    const [cell, setCell] =useState('')
    const [, setDocPrefix] = useState('')
    const [showDefectiveProducts, setShowDefectiveProducts] = useState(false)
    const [defectivePhotos, setDefectivePhotos] = useState<string[]>([])
    const [resetPhotos, setResetPhotos] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

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
    const handlePress = () => {
        animateButton()
        handleSubmit()
    }
    const validateForm = () => {
        const requiredFields = [
            numberSSCC,
            articleCode,
            comment
        ]
        return requiredFields.every(field => !!field)
    }

    const [form, setForm] = useState({
        place: '',
        inputValuePlace: 'Разгрузка',
        inputValuePrefix: 'NS-',
        articleCode: '',
        productName: '',
        numberSSCC: '',
        docNumber: '',
        serialNumber: '',
        sortValue: 'Сорт 1',
        comment: '',
        setCell: ''
    })

    function debounce<F extends (...args: any[]) => any>(func: F, wait: number): F {
        let timeout: NodeJS.Timeout
        return ((...args: any[]) => {
            clearTimeout(timeout)
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

    const handleSSCCChange = (text: string) => {
        setNumberSSCC(text)
        if (text.length > 2 ) {
            loadProfileDebounced()
        }
    }

    const uploadPhotoToServer = async (photos: string[]) => {
        try {
            setIsSubmitting(true)
            const formData = new FormData()
            photos.forEach((uri, index) => {
                formData.append('photos', {
                    uri,
                    name: `defect_${index}.jpg`,
                    type: 'image/jpeg'
                } as any)
            })
            const response = await fetch('https://literally-fair-lark.cloudpub.ru/api/upload-temp-photos', {
                method: 'POST',
                body: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            })
            if (!response.ok) {
                throw new Error("Ошибка загрузки фотографий на сервер")
            }
            const result = await response.json()
            return result.savedPaths
        } catch (error) {
            console.error("Ошибка загрузки фотографий на сервер:", error)
            throw error
        }
    }

    const handleSubmit = async () => {
        if (!validateForm()) {
            Alert.alert("Ошибка, не все поля заполнены")
            return
        }
        try {
            const serverPhotoPaths = defectivePhotos.length > 0
            ? await uploadPhotoToServer(defectivePhotos)
            : []
            const currentPlace = place || userProfile?.place 
            if (!currentPlace) { throw new Error("Не указано место работы") }
            const generateDocNumber = (warehouse: string, location: string) => {
                const warehousePrefix = DOCUMENT_PREFIXES.warehouses[warehouse as WarehouseKeys]
                const locationPrefix = DOCUMENT_PREFIXES.locations[location as LocationKeys]
                return `${warehousePrefix}-${locationPrefix}-`}
            const generatedDocNunber = generateDocNumber(currentPlace, inputValuePlace)
            setDocPrefix(generatedDocNunber)

            const formData = new FormData()          

            defectivePhotos.forEach((uri, index) =>{
                formData.append('photos', {
                    uri,
                    name: `defect_${index}.jpg`,
                    type: 'image/jpeg',
                } as any)
            })

            formData.append('data', JSON.stringify({
                articleCode,
                currentDate,
                place: currentPlace,
                inputValuePrefix,
                productName,
                numberSSCC,
                docNumber,
                sortValue,
                serialNumber,
                comment,
                docPrefix: generatedDocNunber,
                cell: cell || '&KARANTIN',
                photoPaths: serverPhotoPaths,
            }))
            formData.append('recipients', JSON.stringify(userProfile?.operators || []))
            const response = await fetch('https://literally-fair-lark.cloudpub.ru/api/brakodel/send', {
                method: 'POST',
                body: formData,
                headers:{

                }
            })
            const result = await response.json()
            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Ошибка отправки 124') }
            Alert.alert(result.success? "Успешно отправлено" : "Ошибка отправки", result.message)

            setPlace('')
            setInputValuePlace('Разгрузка')
            setInputValuePrefix("NS-")
            setArticleCode('')
            setProductName('')
            setNumberSSCC('')
            setDocNumber('')
            setSerialNumber('')
            setSortValue('Сорт 1')
            setComment('')
            setCell('')
            setDefectivePhotos([])
            setResetPhotos(prev => !prev)

            setForm ({
                place: '',
                inputValuePlace: 'Разгрузка',
                inputValuePrefix: 'NS-',
                articleCode: '',
                productName: '',
                numberSSCC: '',
                docNumber: '',
                serialNumber: '',
                sortValue: 'Сорт 1',
                comment: '',
                setCell: '',
            })
            Alert.alert("Письма успешно отправлены")
        } catch (error: unknown) {
            if (error instanceof Error)
           { Alert.alert("Error", error.message)}
            else {
                {Alert.alert("Error")
                }
            }
        } finally { setIsSubmitting(false)}
    }
    const handleArticleChange = async (inputValuePrefix: string, articleCode: string) =>{
        if (!articleCode) {
            setProductName('')
            return
        }
        const fullArticle = `${inputValuePrefix}${articleCode}`
        try {
            const response = await fetch(`https://literally-fair-lark.cloudpub.ru/api/products/by-article?article=${encodeURIComponent(fullArticle)}`)
            const data = await response.json()
            if (data.success && data.product && data.product.name) {
                setProductName(data.product.name)
            } else {
                setProductName('Товар не найден')
            }
        }  catch (error) {
            console.error('Ошибка при поиске товара', error)
            setProductName('Ошибка при поиске товара')
        }
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS ==='ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ios: 60, android:0})}
        style={styles.avoidingView}
        pointerEvents={ isSubmitting ? 'none' : 'auto'}>
        <ScrollView 
        ref = {scrollViewRef}
        style={styles.container} 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{paddingBottom:150}}
        keyboardShouldPersistTaps='handled'>
            
            <Text style={styles.text}>Выберите место обнаружения дефекта</Text>
                <View style={{borderWidth: 1.5, borderRadius: 3, borderColor: SystemColors.VeryLightBlue, 
                    width: 163, flexDirection:'row'}}>
                <Picker
                selectedValue={cell}
                onValueChange={(itemValue) => {
                    setInputValuePlace(itemValue)
                }}
                style={{...styles.picker, width:160}} dropdownIconColor={SystemColors.VeryLightBlue}>
                    <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="Разгрузка" value="Разгрузка" />
                    <Picker.Item style={{...styles.pickerItem, fontSize:16}} label="Ячейка" value="Ячейка" />
                </Picker>
                {inputValuePlace === "Ячейка" ? (
                    <Input placeholder="укажите ячейку" style={{...styles.inputText, width: 171, 
                    height: 55, marginLeft: 15, textAlign: 'center'}}
                    value={cell} onChangeText={(text) => setCell(text)}/>) : (
                        <View style={{ justifyContent: 'center', alignItems: 'center'}}>
                        <Text style={{marginLeft: 55, color: SystemColors.VeryLightBlue, fontSize: 16,
                            fontFamily: CustomFonts.medium
                        }}>&KARANTIN</Text>
                        </View>
                    )}
                
            </View>
            <Text style={styles.text}>Введите номер палета SSCC</Text>
            <Input style={styles.inputText}
            value = {numberSSCC}
            onChangeText ={(text) => handleSSCCChange(text)}
            placeholder="*"/>
            <Text style={styles.text}>Укажите номер документа прихода</Text>
            <Input style={{...styles.inputText}} autoCapitalize="characters"
            value={docNumber}
            onChangeText={(text) => setDocNumber(text)}/>
            <Text style={styles.text}>Введите артикул товара (NS-, B-)</Text>
            
            <View style={{flexDirection: "row", justifyContent: "flex-start",
                alignItems: 'center', borderWidth: 1.5, borderRadius: 3,
                borderColor: SystemColors.VeryLightBlue, width: 163}}>
            <Picker selectedValue={prefix}
             onValueChange={(itemValue) => {setInputValuePrefix(itemValue)
                if (productName) {
                    handleArticleChange(itemValue, productName)
                }}
            }
                style={{...styles.picker, width: 160, height: "100%"}} dropdownIconColor={SystemColors.VeryLightBlue}>
                <Picker.Item style={styles.pickerItem} label="NS-" value={"NS-"}/>
                <Picker.Item style={styles.pickerItem} label="B-" value={"B-"}/>
            </Picker>
            <Text>    </Text>
            <Input style={{...styles.inputText, width: 171, height: 55}} 
            value={articleCode}
            placeholder="*" 
            onChangeText={(text) => setArticleCode(text)}
            onEndEditing={() =>handleArticleChange(inputValuePrefix, articleCode)}/>
            </View>
            <View>
                <Text></Text>
            </View>
            <View style={{...styles.inputText, minHeight: 45, flexGrow: 1, justifyContent: 'center', paddingLeft:15}}>
                <Text style={{fontFamily: CustomFonts.regular, fontSize: 16, 
                    color: SystemColors.VeryLightBlue
                    }}>{productName}</Text>
            </View>

            <Text style={styles.text}>Введите серийный номер товара</Text>
            <Input style={styles.inputText}
            value={serialNumber}
            onChangeText={(text) => setSerialNumber(text)}/>
        <Text style={styles.text}>Выберите сорт дефекта</Text>
        <View style={{borderWidth: 1.5, borderRadius: 3, borderColor: SystemColors.VeryLightBlue, 
                width: 193}}>
            <Picker style={{...styles.picker, width: 190, textAlign: 'center'}} 
                dropdownIconColor={SystemColors.VeryLightBlue}
                selectedValue={sortValue}
                onValueChange={(itemValue: string) => setSortValue(itemValue)}>
                <Picker.Item style={styles.pickerItem} label="Сорт 1" value={'Сорт 1'}/>
                <Picker.Item style={styles.pickerItem} label="Сорт 2" value={'Сорт 2'}/>
                <Picker.Item style={styles.pickerItem} label="Сорт 3" value={'Сорт 3'}/>
                <Picker.Item style={styles.pickerItem} label="Сорт 4" value={'Сорт 4'}/>
                <Picker.Item style={styles.pickerItem} label="Сорт 5" value={'Сорт 5'}/>
                <Picker.Item style={styles.pickerItem} label="Сорт 6" value={'Сорт 6'}/>
                <Picker.Item style={styles.pickerItem} label="На экспертизу" value={'На экспертизу'}/>
            </Picker>
        </View>
            <Text style={styles.text}>Добавьте комментарий</Text>
            <Input multiline={true} numberOfLines={4} textAlignVertical="top" style={{...styles.inputText, marginBottom: 15}} 
            onFocus={handleFocus}
            value={comment}
            onChangeText={(text) => setComment(text)}/>
            <DefectivePhotosHandler 
            key={resetPhotos ? 'photos_reset' : 'photos_normal'}
            onImagesChange={setDefectivePhotos}
            buttonText={{
                show: "ФОТО БРАКА",
                hide: "СКРЫТЬ ФОТО"
            }}
            title="Фото брака"/>
            <Animated.View style={{transform: [{ scale: buttonScale }] }}>
            <Button text={isSubmitting ? "ОТПРАВКА..." : "ОТПРАВИТЬ"} 
            onPress={!isSubmitting ? handlePress : undefined} style={{paddingTop: 13, marginBottom:0, 
                width: "70%", alignSelf: 'center'}}/>
            </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
        
    )
}

const styles = StyleSheet.create({
    avoidingView:{
        flex:1
    },
    text: {
        fontFamily: CustomFonts.regular,
        fontSize: 18,
        color: SystemColors.VeryLightBlue,
        paddingTop: 20,
        paddingBottom:5
    },
    inputText: {
        backgroundColor: SystemColors.MutedBlue,
        borderWidth: 1.5,
        borderColor: SystemColors.VeryLightBlue,
        fontFamily: CustomFonts.regular,
        color: SystemColors.VeryLightBlue,
        borderRadius: 3,
        fontSize: 16
    },
    container: {
        width: "95%",
        //alignItems: 'stretch',
        paddingLeft: 25,
        paddingBottom:40
        
    },
    picker: {
        backgroundColor: SystemColors.MutedBlue,
        borderRadius: 3,
    },
    pickerItem: {
        fontFamily: CustomFonts.regular,
        color: SystemColors.VeryLightBlue,
        fontSize: 16,
        borderWidth: 2,
        borderColor: SystemColors.VeryLightBlue,
        textAlign: 'center',
        justifyContent: 'center'
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
})
