
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, View, Text, Pressable } from "react-native";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { CustomFonts, SystemColors } from "../../shared/tokens";
import { useRouter } from "expo-router";
import { authAtom } from "../../entities/auth/model/auth.state";
import { coursesAtom, errorAtom, isLoadingAtom, loadContentAtom, testsAtom } from "@/entities/course/model/course.state";


export default function HomePage() {
    const [auth, setAuth] = useAtom(authAtom)
    const courses = useAtomValue(coursesAtom)
    const tests = useAtomValue(testsAtom)
    const isLoading = useAtomValue(isLoadingAtom)
    const error = useAtomValue(errorAtom)
    const loadContent = useSetAtom(loadContentAtom)
    const router = useRouter()
    const [refreshing, setRefreshing] = useState(false)

    const onRefresh = async () => {
        setRefreshing(true)
        await loadContent()
        setRefreshing(false)
    }

    useEffect(() => {
        if (auth.error) {
            setAuth({
                ...auth,
                error: null
            })
        }
    }, [])

    useEffect(() => {
        loadContent()
    }, [])

    const renderItem = (item: any) => (
        <Pressable key={item.id} onPress={() => router.push(item.screen)}>
            <View style={{ alignItems: 'stretch', width: 150, marginRight: 20}}>
                <Image 
                source={{ uri: item.image_url}}
                style={styles.imagess}
                resizeMode='cover' />
                <Text style={styles.annotation}>{item.title}</Text>
            </View>
        </Pressable>
    )
    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size='large' color={SystemColors.PrimaryBlue}/>
            </View>
        )
    }
    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.error}>{error}</Text>
            </View>
        )
    }
    if (courses.length === 0 && tests.length === 0) {
        return (
            <View style={styles.center}>
                <Text style={styles.empty}>Данные пока не загружены</Text>
                <Text style={styles.emptySubtitle}>Обратитесь к администратору</Text>
            </View>
        )
    }
    return (
        <ScrollView 
        refreshControl={
            <RefreshControl 
            refreshing = {refreshing}
            onRefresh={onRefresh}
            colors={[SystemColors.PrimaryBlue]}
            tintColor={SystemColors.PrimaryBlue}
            progressBackgroundColor="#ffffff" />
        }>
            <View style={{paddingLeft:5}}>
                <ScrollView horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollImage}>
                    {courses.map(renderItem)}
                </ScrollView>
            </View>
        </ScrollView>
    )
}
const styles = StyleSheet.create({
    empty: {
        fontFamily: CustomFonts.bold,
        fontSize: 18,
        color: SystemColors.VeryLightBlue,
        textAlign: 'center',
        marginBottom: 10,
    },
    emptySubtitle: {
        fontFamily: CustomFonts.regular,
        fontSize: 14,
        color: SystemColors.VeryLightBlue,
        textAlign: 'center',
        opacity: 0.7
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    error: {
        color: 'red',
        fontSize: 16
    },
    scrollImage: {
        paddingTop: 0,
        paddingHorizontal:20,   
    },
    textOverImage: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(33,150,243,0.8)",
        borderBottomRightRadius: 15,
        borderBottomLeftRadius:15,
        width:150,
        height:30,
        textAlignVertical: 'center'        
    },
    imagess: {
        width: "90%",
        height: 150,
        marginRight: 20,
        borderRadius: 15,
    },
    TitleStyle: {
        fontFamily: CustomFonts.bold,
        fontSize: 18,
        color: SystemColors.VeryLightBlue,
        paddingVertical: 0,
        paddingTop: 25,
        paddingBottom: 15,
        paddingLeft: 20,
        textAlign: 'left'

    },
    annotation: {
        fontFamily: CustomFonts.medium,
        fontSize: 14,
        color: SystemColors.VeryLightBlue,
        textAlign: 'left',
        paddingTop: 5,
        paddingLeft:5,
    }

})