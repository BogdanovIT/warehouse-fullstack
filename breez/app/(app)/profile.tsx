import { useEffect, useState } from "react";
import {  Image,  StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAtom } from "jotai";
import { updateProfileAtom, userProfileAtom } from "../../entities/user/model/user.state";
import { CustomFonts, SystemColors } from "../../shared/tokens";
import { authAtom } from "../../entities/auth/model/auth.state";
import { getUserProfile } from "../../api/user";
import Barcode from "@kichiyaki/react-native-barcode-generator";

export default function MyProfile() {
    const [image, setImage] = useState<string|null>(null);  
    const [userData, setUserData] = useState<any>(null);  
    const [loading, setLoading] = useState<boolean>(true);  
    const [error, setError] = useState<string|null>(null);  
    const [profile, updateProfile] = useAtom(updateProfileAtom)  
    const [auth] = useAtom(authAtom)
    const [, setUserProfile] = useAtom(userProfileAtom)
    const submitProfile = () => {
        if (!image) { return }
        updateProfile({photo: image})
    }
    useEffect(()=>{
        if (profile && profile.profile?.photo) {
            setImage(profile.profile?.photo)
        }
    }, [profile])

    useEffect(() => {
        const loadUserData = async () => {
            try {
                if (!auth.access_token) {
                    console.error("Access Token is empty")
                    return
                }
                setLoading(true)
                const data = await getUserProfile(auth.access_token)
                setUserData(data)
                setUserProfile({data, place: data.place})
            } catch (e) {
                setError('Не удалось загрузить данные')
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadUserData()
    }, [auth.access_token])


    return (
        <>
        <View style = {{backgroundColor: SystemColors.MutedBlue}}>
        <View style ={styles.container}>
            <Image style={styles.image} source={require('../../assets/images/logo.png')}/>
            <Text style={styles.FirstHeadProfile}>{userData?.firstName} {userData?.lastName}</Text>
        </View>
        
        </View>
        <View style={{borderWidth:1.5, borderColor: SystemColors.VeryLightBlue, marginBottom:20, marginTop:10,
            width: "87%", alignSelf:'center', paddingBottom: 15, borderRadius: 9}}>
        <Text style={styles.HeadProfile}>Подразделение:</Text>
        <Text style={styles.textProfile}>{userData?.place}</Text>
        </View>
        <View style={{borderWidth:1.5, borderColor: SystemColors.VeryLightBlue, 
            marginTop: 20, width: "87%", alignSelf:'center', 
            paddingBottom: 15, borderRadius: 9}}>
        <Text style={{...styles.HeadProfile}}>Операторы:</Text>
        {userData?.operators?.length ? (
            userData.operators.map((email: string, index: number) => (
        <Text key={index} style={styles.textProfile}>{email}</Text>))
            ):(
                <Text style={styles.textProfile}>НЕ УКАЗАНЫ</Text>
        )}
        </View>
        <View style={styles.barcodeContainer}>
            {userData?.loginLv && (
                <Barcode 
                value={userData.loginLv}
                format="CODE128"
                text = {userData.loginLv}
                lineColor={SystemColors.PrimaryBlue}
                style={{paddingTop:25, paddingBottom: 15}} 
                height={120}/>
            )}
        </View>

        
        <View style={{paddingTop: 300}}>
        {/* <Button style={{backgroundColor: SystemColors.LightBlue, borderRadius: 3, width: "90%", alignSelf: 'center'}} text="Редактировать" onPress={submitProfile}/> */}
        </View>
        </>
        
    );
}
const styles = StyleSheet.create({
    image: {
        width: 80,
        height: 80,
        borderRadius: 0,
        resizeMode: 'contain'
        
    },
    container: {
        flexDirection: "row",
        gap: 20,
        alignItems: 'center',
        alignSelf: 'stretch',
        paddingHorizontal: 30,
        paddingVertical: 20,        
    },
    textProfile: {
        fontFamily: CustomFonts.bold,
        fontSize: 18,
        paddingLeft: 25,
        textAlign: 'left',
        paddingVertical: 0,
        color: SystemColors.VeryLightBlue,
    },
    HeadProfile: {
        fontFamily: CustomFonts.regular,
        fontSize: 14,
        paddingTop: 15,
        paddingVertical: 5,
        paddingLeft: 25,
        color: SystemColors.VeryLightBlue,
    },
    FirstHeadProfile: {
        fontFamily: CustomFonts.medium,
        fontSize: 18,
        color: SystemColors.VeryLightBlue,
        paddingLeft: 15,
        paddingRight: 15,
        paddingTop: 40
    },
    barcodeContainer: {
        marginTop: 40,
        width: "87%",
        alignItems: 'stretch',
        alignSelf: 'center',
        borderWidth: 4,
        borderRadius: 9,
        borderColor: '#fff'
    },
})