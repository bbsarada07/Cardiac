import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { 
  Canvas, 
  Path, 
  Group, 
  LinearGradient, 
  vec, 
  Shadow, 
  Blur, 
  Circle, 
  Paint, 
  Skia 
} from '@shopify/react-native-skia';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing,
  useDerivedValue,
  interpolateColor
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = 280;

interface DigitalTwinHeartProps {
  bpm: number;
  riskScore: number;
  isDisconnected: boolean;
}

const DigitalTwinHeart: React.FC<DigitalTwinHeartProps> = ({ bpm, riskScore, isDisconnected }) => {
  const [isSkiaReady, setIsSkiaReady] = useState(false);
  const breathing = useSharedValue(0);
  const pulse = useSharedValue(1);
  const colorProgress = useSharedValue(0);

  // Organic, physiological heart form (declarative string for stability)
  const heartPath = "M 50,30 C 50,25 45,15 30,15 C 10,15 10,42.5 10,42.5 C 10,60 30,80 50,95 C 70,80 90,60 90,42.5 C 90,42.5 90,15 70,15 C 55,15 50,25 50,30 Z";

  useEffect(() => {
    // Guard for Web: Poll for CanvasKit/Skia readiness
    if (Platform.OS === 'web') {
      const checkSkia = () => {
        if (typeof Skia !== 'undefined' && (window as any).CanvasKit) {
          setIsSkiaReady(true);
        } else {
          setTimeout(checkSkia, 100);
        }
      };
      checkSkia();
    } else {
      setIsSkiaReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isSkiaReady) return;

    breathing.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    if (!isDisconnected) {
      const pulseDuration = (60 / Math.max(bpm, 40)) * 1000;
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: pulseDuration * 0.3, easing: Easing.out(Easing.quad) }),
          withTiming(1.0, { duration: pulseDuration * 0.7, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    }

    colorProgress.value = withTiming(riskScore / 100, { duration: 1000 });
  }, [isSkiaReady, bpm, riskScore, isDisconnected]);

  const getTwinColors = useDerivedValue(() => {
    const teal = "#2DD4BF";
    const medicalBlue = "#3B82F6";
    const amber = "#F59E0B";
    const medicalRed = "#EF4444";
    const neutral = "#94A3B8";

    if (isDisconnected) return { core: neutral, halo: neutral, rim: neutral };

    const core = interpolateColor(
      colorProgress.value,
      [0, 0.3, 0.7, 1],
      [teal, medicalBlue, amber, medicalRed]
    );

    const halo = interpolateColor(
      colorProgress.value,
      [0, 0.3, 0.7, 1],
      ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"]
    );

    return { core, halo, rim: core };
  });

  const heartTransform = useDerivedValue(() => {
    const scale = 1 + (breathing.value * 0.03) + ((pulse.value - 1) * 0.4);
    return [{ scale }];
  });

  const innerGlowRadius = useDerivedValue(() => 60 + (pulse.value * 20));
  const innerGlowOpacity = useDerivedValue(() => 0.4 + (breathing.value * 0.2));

  if (!isSkiaReady) {
    return <View style={[styles.container, { width: CANVAS_SIZE, height: CANVAS_SIZE }]} />;
  }

  return (
    <View style={styles.container}>
      <Canvas style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
        <Circle cx={CANVAS_SIZE/2} cy={CANVAS_SIZE/2} r={100}>
          <Paint color={getTwinColors.value.halo} opacity={0.15}>
            <Blur blur={40} />
          </Paint>
        </Circle>

        <Group origin={{ x: CANVAS_SIZE/2, y: CANVAS_SIZE/2 }} transform={heartTransform}>
          <Group transform={[{ scale: 2.2 }, { translateX: -50 }, { translateY: -45 }]}>
            <Path path={heartPath} style="fill" opacity={0.6}>
              <LinearGradient
                start={vec(10, 15)}
                end={vec(90, 95)}
                colors={[getTwinColors.value.core, "rgba(255,255,255,0.4)"]}
              />
              <Blur blur={1} />
            </Path>

            <Path path={heartPath} style="stroke" strokeWidth={1.5} opacity={0.3}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(100, 100)}
                colors={["#FFF", getTwinColors.value.rim]}
              />
            </Path>

            <Path path="M 30,30 Q 50,50 70,30" style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.2)" />
          </Group>
        </Group>

        <Circle cx={CANVAS_SIZE/2} cy={CANVAS_SIZE/2} r={innerGlowRadius}>
          <Paint color={getTwinColors.value.halo} opacity={innerGlowOpacity}>
            <Blur blur={10} />
          </Paint>
        </Circle>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DigitalTwinHeart;
