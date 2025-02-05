import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VoiceRecorder({ onUploadComplete }) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState('00:00');
    const recordingTimeInterval = useRef(null);

    // Start/Stop Timer
    const toggleTimer = () => {
        if (!isRecording) {
            // Start timer
            let timeElapsed = 0;
            recordingTimeInterval.current = setInterval(() => {
                timeElapsed += 1;
                const minutes = Math.floor(timeElapsed / 60);
                const seconds = timeElapsed % 60;
                setRecordingTime(
                    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                );
            }, 1000);
            setIsRecording(true);
        } else {
            // Stop timer
            if (recordingTimeInterval.current) {
                clearInterval(recordingTimeInterval.current);
            }
            showSendAlert();
            setIsRecording(false);
            setRecordingTime('00:00');
        }
    };

    // Show alert when stopping
    const showSendAlert = () => {
        Alert.alert(
            'Send Request',
            'Do you want to send this request?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Send',
                    onPress: sendRequest
                }
            ],
            { cancelable: false }
        );
    };

    // Send request to backend
    const sendRequest = async () => {
        try {
            // Get patient details from AsyncStorage
            const patientDetailsString = await AsyncStorage.getItem('patientDetails');
            if (!patientDetailsString) {
                throw new Error('Patient details not found');
            }

            const patientDetails = JSON.parse(patientDetailsString);

            // Send request to backend
            const response = await axios.post(
                'http://192.168.202.108:5000/api/patients/send-request',
                {
                    patientId: patientDetails.patientId,
                    patientName: patientDetails.name,
                    message: 'Hi Nurse, I have chest pain',
                    timestamp: new Date().toISOString()
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                Alert.alert('Success', 'Request sent successfully');
            }
        } catch (error) {
            console.error('Error sending request:', error);
            Alert.alert('Error', 'Failed to send request');
        }
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (recordingTimeInterval.current) {
                clearInterval(recordingTimeInterval.current);
            }
        };
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Voice Recorder</Text>
            <Text style={styles.timer}>{recordingTime}</Text>
            <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordingButton]}
                onPress={toggleTimer}
                activeOpacity={0.7}
            >
                <MaterialIcons
                    name="mic"
                    size={50}
                    color={isRecording ? '#ff4444' : '#fff'}
                />
            </TouchableOpacity>
            <Text style={styles.helpText}>
                {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: '500',
        marginBottom: 20,
        color: '#333',
    },
    timer: {
        fontSize: 48,
        fontWeight: '300',
        marginBottom: 30,
        color: '#008B8B',
    },
    recordButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#008B8B',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    recordingButton: {
        backgroundColor: '#006666',
        transform: [{ scale: 1.1 }],
    },
    helpText: {
        marginTop: 15,
        color: '#666',
        fontSize: 16,
    }
});
