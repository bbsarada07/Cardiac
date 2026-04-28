import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { 
  Canvas, 
  Path, 
  Group, 
  LinearGradient, 
  RadialGradient,
  vec, 
  Blur, 
  Circle, 
  Paint, 
  Skia,
  Shadow
} from '@shopify/react-native-skia';
import Animated, { 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence, 
  Easing,
  useDerivedValue,
  interpolateColor,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CANVAS_SIZE = 280;

interface DigitalTwinHeartProps {
  bpm: number;
  riskScore: number;
  isDisconnected: boolean;
}

const DigitalTwinHeart: React.FC<DigitalTwinHeartProps> = ({ bpm, riskScore, isDisconnected }) => {
  const [isSkiaReady, setIsSkiaReady] = React.useState(false);
  const pulse = useSharedValue(0);
  const torque = useSharedValue(0);
  const breathing = useSharedValue(0);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    const initializeSkia = async () => {
      let ready = false;
      let attempts = 0;
      
      while (!ready && attempts < 50) {
        const hasSkia = typeof Skia !== 'undefined';
        const hasCanvasKit = Platform.OS === 'web' ? (window as any).CanvasKit : true;

        if (hasSkia && hasCanvasKit) {
          await new Promise(resolve => setTimeout(resolve, 500));
          setIsSkiaReady(true);
          ready = true;
        } else {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    };

    initializeSkia();
  }, []);

  // --- Anatomical Path Definitions (Stylized 3D) ---
  const aortaPath = "M50 20 C60 10, 80 15, 80 30 C80 40, 70 45, 65 50";
  const pulmonaryPath = "M40 25 C30 20, 15 35, 25 50";
  const leftVentricle = "M50 45 C70 45, 85 65, 75 85 C65 105, 50 110, 50 110 L50 45";
  const rightVentricle = "M50 45 C30 45, 15 65, 25 85 C35 105, 50 110, 50 110 L50 45";
  const atriaPath = "M35 35 C35 25, 65 25, 65 35 C65 45, 35 45, 35 35";

  useEffect(() => {
    if (!isSkiaReady) return;

    breathing.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    if (!isDisconnected) {
      const beatInterval = (60 / Math.max(bpm, 40)) * 1000;
      
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: beatInterval * 0.2, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: beatInterval * 0.8, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );

      torque.value = withRepeat(
        withSequence(
          withTiming(1, { duration: beatInterval * 0.25, easing: Easing.out(Easing.sin) }),
          withTiming(0, { duration: beatInterval * 0.75, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }

    colorProgress.value = withTiming(riskScore / 100, { duration: 1000 });
  }, [isSkiaReady, bpm, riskScore, isDisconnected]);

  const getPalette = useDerivedValue(() => {
    const teal = "#2DD4BF";
    const softBlue = "#3B82F6";
    const white = "#FFFFFF";
    const riskRed = "#EF4444";
    const neutral = "#94A3B8";

    if (isDisconnected) return { base: neutral, highlight: "#CBD5E1", glow: "#94A3B820" };

    const base = interpolateColor(
      colorProgress.value,
      [0, 0.3, 0.7, 1],
      [teal, softBlue, "#F59E0B", riskRed]
    );

    return { base, highlight: white, glow: base + '30' };
  });

  const heartTransform = useDerivedValue(() => {
    const baseScale = 1.8 + (breathing.value * 0.05);
    const squeezeX = 1 - (pulse.value * 0.08);
    const squeezeY = 1 + (pulse.value * 0.04);
    const rotation = torque.value * 0.05;
    
    return [
      { translateX: CANVAS_SIZE / 2 },
      { translateY: CANVAS_SIZE / 2 },
      { scaleX: baseScale * squeezeX },
      { scaleY: baseScale * squeezeY },
      { rotate: rotation },
      { translateX: -50 },
      { translateY: -60 }
    ];
  });

  if (!isSkiaReady) {
    return <View style={[styles.container, { width: CANVAS_SIZE, height: CANVAS_SIZE }]} />;
  }

  return (
    <View style={styles.container}>
      <Canvas style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
        <Circle cx={CANVAS_SIZE / 2} cy={CANVAS_SIZE / 2} r={100}>
          <Paint color={getPalette.value.base} opacity={0.1}>
            <Blur blur={40} />
          </Paint>
        </Circle>

        <Group transform={heartTransform}>
          <Path path={aortaPath} style="stroke" strokeWidth={8} strokeCap="round">
            <LinearGradient start={vec(50, 20)} end={vec(65, 50)} colors={[getPalette.value.highlight, getPalette.value.base]} />
            <Blur blur={0.5} />
          </Path>
          <Path path={pulmonaryPath} style="stroke" strokeWidth={6} strokeCap="round">
            <LinearGradient start={vec(40, 25)} end={vec(25, 50)} colors={[getPalette.value.highlight, getPalette.value.base]} />
          </Path>

          <Group>
            <Path path={leftVentricle} style="fill">
              <RadialGradient c={vec(65, 65)} r={50} colors={[getPalette.value.highlight, getPalette.value.base]} />
              <Shadow dx={2} dy={2} blur={5} color="rgba(0,0,0,0.1)" />
            </Path>
            <Path path={rightVentricle} style="fill">
              <RadialGradient c={vec(35, 65)} r={50} colors={[getPalette.value.highlight, getPalette.value.base]} />
              <Shadow dx={-2} dy={2} blur={5} color="rgba(0,0,0,0.1)" />
            </Path>
          </Group>

          <Path path={atriaPath} style="fill" opacity={0.8}>
            <LinearGradient start={vec(35, 25)} end={vec(65, 45)} colors={[getPalette.value.highlight, getPalette.value.base]} />
            <Blur blur={1} />
          </Path>

          <Path path="M40 55 C45 50, 55 50, 60 55" style="stroke" strokeWidth={1} color="white" opacity={0.4} />
          <Path path="M30 70 Q35 75, 40 70" style="stroke" strokeWidth={0.5} color="white" opacity={0.3} />
        </Group>

        <Circle cx={CANVAS_SIZE / 2} cy={CANVAS_SIZE / 2} r={110}>
          <Paint style="stroke" strokeWidth={1} color={getPalette.value.base} opacity={0.2} strokeCap="round" />
        </Circle>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DigitalTwinHeart;
