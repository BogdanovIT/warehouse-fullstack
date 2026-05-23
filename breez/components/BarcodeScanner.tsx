import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { CameraView, useCameraPermissions } from 'expo-camera'
import { SystemColors } from "@/shared/tokens";

interface BarcodeScannerProps {
    visible: boolean
    onScan: (barcode: string) => void
    onClose: () => void
}

const BarcodeScanner = ({ visible, onScan, onClose}: BarcodeScannerProps) => {
    const [permission, requestPermission] = useCameraPermissions()
    const [scanned, setScanned] = useState(false)

    useEffect(() => {
        if (visible && !permission?.granted) {
            requestPermission
        }
    }, [visible])
    useEffect(()=>{
        if(!visible) {
            setScanned(false)
        }
    }, [visible])
    const handleBarcodeScanner = ({ data }: { data: string }) => {
        if (scanned) return
        setScanned(true)
        onScan(data)
    }
    if (!visible) return null

    return (
        <Modal visible={visible} animationType="slide" style={styles.modal}>
            <View style={styles.container}>
                {permission?.granted ? (
                    <CameraView style={styles.camera} facing='back' barcodeScannerSettings={{ barcodeTypes: ['code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e']}} onBarcodeScanned={handleBarcodeScanner} />
                ) : (
                    <View style={styles.permissionContainer}>
                        <Text style={styles.permissionText}>
                            Для сканирования штрих-кода необходим доступ к камере
                        </Text>
                        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                            <Text style={styles.permissionButtonText}>Разрешить</Text> 
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.overlay}>
                    <View style={styles.scanFrame}/>
                    <Text style={styles.hint}>
                        Наведите камеру на штрих-код
                    </Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                    <Text style={styles.closeButtonText}>✖</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    modal: {
        flex: 1
    },
    container: {
        flex: 1,
        backgroundColor: "#000"
    },
    camera: {
        flex: 1
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40
    },
    permissionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20
    },
    permissionButton: {
        backgroundColor: SystemColors.PrimaryBlue,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 9
    },
    permissionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: '600',
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        pointerEvents: 'none'
    },
    scanFrame: {
        width: 250,
        height: 150,
        borderWidth: 2,
        borderColor: SystemColors.LightBlue,
        borderRadius: 12,
        backgroundColor: 'transparent'
    },
    hint: {
        color: '#fff',
        fontSize: 14,
        marginTop: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600'
    }
})
export default BarcodeScanner