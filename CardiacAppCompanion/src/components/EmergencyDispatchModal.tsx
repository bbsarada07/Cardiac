import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Linking, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInUp, 
  useAnimatedProps,
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { useCardiacData } from '../context/CardiacDataContext';
import hapticService from '../services/HapticService';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle } from 'react-native-svg';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

interface EmergencyDispatchModalProps {
  isVisible: boolean;
  onClose: () => void;
  isAutoTriggered?: boolean;
}

const COUNTDOWN_SECONDS = 5;
const CIRCLE_LENGTH = 300; // 2 * PI * 48
const R = 48;

const EmergencyDispatchModal: React.FC<EmergencyDispatchModalProps> = ({ 
  isVisible, 
  onClose, 
  isAutoTriggered = false 
}) => {
  const { colors, theme } = useTheme();
  const { patientProfile } = useCardiacData();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [isCanceled, setIsCanceled] = useState(false);
  const progress = useSharedValue(0);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isVisible && isAutoTriggered && !isCanceled) {
      setSecondsLeft(COUNTDOWN_SECONDS);
      progress.value = 0;
      progress.value = withTiming(1, { 
        duration: COUNTDOWN_SECONDS * 1000, 
        easing: Easing.linear 
      });

      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            handleAutoDispatch();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVisible, isAutoTriggered, isCanceled]);

  const handleAutoDispatch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!isCanceled) {
      hapticService.triggerWarning();
      Linking.openURL('tel:911');
      onClose();
    }
  };

  const handleCancel = () => {
    setIsCanceled(true);
    if (timerRef.current) clearInterval(timerRef.current);
    progress.value = withTiming(0);
    hapticService.triggerImpact();
  };

  const handleCall = (phone: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    hapticService.triggerImpact();
    Linking.openURL(`tel:${phone}`);
  };

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
  }));

  if (!isVisible) return null;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        
        <Animated.View 
          entering={SlideInUp.springify().damping(15)} 
          exiting={FadeOut}
          style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <LinearGradient
            colors={['#EF4444', '#991B1B']}
            style={styles.header}
          >
            <MaterialIcons name="emergency" size={32} color="#FFF" />
            <Text style={styles.headerTitle}>
              {isAutoTriggered && !isCanceled ? "AUTONOMOUS DISPATCH" : "EMERGENCY HUB"}
            </Text>
          </LinearGradient>

          <View style={styles.content}>
            {isAutoTriggered && !isCanceled ? (
              <View style={styles.countdownSection}>
                <View style={styles.timerContainer}>
                  <Svg width={120} height={120}>
                    <SvgCircle
                      cx={60}
                      cy={60}
                      r={R}
                      stroke={colors.border}
                      strokeWidth={8}
                      fill="transparent"
                    />
                    <AnimatedCircle
                      cx={60}
                      cy={60}
                      r={R}
                      stroke="#EF4444"
                      strokeWidth={8}
                      fill="transparent"
                      strokeDasharray={CIRCLE_LENGTH}
                      animatedProps={animatedCircleProps}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <View style={styles.timerTextContainer}>
                    <Text style={[styles.timerNumber, { color: colors.text }]}>{secondsLeft}</Text>
                    <Text style={[styles.timerUnit, { color: colors.subtext }]}>SEC</Text>
                  </View>
                </View>
                <Text style={[styles.alertText, { color: colors.text }]}>
                  Cardiac instability detected. Calling 911 automatically...
                </Text>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>CANCEL AUTO-CALL</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.manualSection}>
                <Text style={[styles.manualTitle, { color: colors.subtext }]}>SELECT DISPATCH TARGET</Text>
                
                <TouchableOpacity 
                  style={[styles.dispatchBtn, { backgroundColor: '#EF4444' }]} 
                  onPress={() => handleCall('911')}
                >
                  <MaterialIcons name="local-police" size={24} color="#FFF" />
                  <View style={styles.dispatchInfo}>
                    <Text style={styles.dispatchName}>911 EMERGENCY</Text>
                    <Text style={styles.dispatchSub}>Police, Fire, Ambulance</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color="#FFF" />
                </TouchableOpacity>

                {[1, 2, 3].map(i => {
                  const name = (patientProfile as any)[`contact${i}_name`];
                  const phone = (patientProfile as any)[`contact${i}_phone`];
                  if (!name || !phone) return null;

                  return (
                    <TouchableOpacity 
                      key={i} 
                      style={[styles.contactBtn, { backgroundColor: colors.cardAlt }]}
                      onPress={() => handleCall(phone)}
                    >
                      <MaterialIcons name="person" size={24} color={colors.primary} />
                      <View style={styles.dispatchInfo}>
                        <Text style={[styles.contactName, { color: colors.text }]}>{name}</Text>
                        <Text style={[styles.contactSub, { color: colors.subtext }]}>Emergency Contact {i}</Text>
                      </View>
                      <MaterialIcons name="call" size={24} color={colors.primary} />
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
                  <Text style={[styles.dismissBtnText, { color: colors.subtext }]}>Close Hub</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  content: {
    padding: 24,
  },
  countdownSection: {
    alignItems: 'center',
  },
  timerContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: 32,
    fontWeight: '900',
  },
  timerUnit: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -4,
  },
  alertText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 24,
    marginBottom: 24,
  },
  cancelBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelBtnText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 1,
  },
  manualSection: {
    gap: 12,
  },
  manualTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  dispatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  dispatchInfo: {
    flex: 1,
  },
  dispatchName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  dispatchSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 16,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
  },
  contactSub: {
    fontSize: 11,
  },
  dismissBtn: {
    marginTop: 12,
    alignItems: 'center',
    padding: 12,
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});

export default EmergencyDispatchModal;
