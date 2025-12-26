import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'

// 泡のコンポーネント
function Bubble({ delay, duration, size, left }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        bottom: '-20px',
        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
        boxShadow: 'inset 0 0 10px rgba(255,255,255,0.5)',
      }}
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: [0, -800],
        opacity: [0, 0.7, 0.7, 0],
        x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20, 0],
        scale: [1, 1.05, 0.95, 1.02, 0.9],
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  )
}

// メイン光芒（ゴッドレイ）- 5秒周期
function LightRaysMain() {
  return (
    <motion.div
      className="absolute"
      style={{
        top: '-60%',
        left: '50%',
        width: '150%',
        height: '120%',
        transformOrigin: 'top center',
        background: `conic-gradient(
          from 180deg at 50% 0%,
          transparent 30%,
          rgba(255, 255, 255, 0.15) 35%,
          rgba(255, 255, 255, 0.25) 38%,
          rgba(255, 255, 255, 0.15) 41%,
          transparent 46%,
          transparent 54%,
          rgba(255, 255, 255, 0.1) 58%,
          rgba(255, 255, 255, 0.2) 61%,
          rgba(255, 255, 255, 0.1) 64%,
          transparent 70%
        )`,
      }}
      animate={{
        x: ['-50%', '-48%', '-52%', '-49%', '-51%', '-50%'],
        rotate: [-3, -1, 2, 1, -2, -3],
        scaleX: [1, 1.02, 0.98, 1.01, 0.99, 1],
        opacity: [0.7, 1, 0.5, 0.9, 0.6, 0.7],
        filter: ['blur(0px)', 'blur(1px)', 'blur(2px)', 'blur(0px)', 'blur(1px)', 'blur(0px)'],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// サブ光芒 - 7秒周期
function LightRaysSub() {
  return (
    <motion.div
      className="absolute"
      style={{
        top: '-50%',
        left: '30%',
        width: '100%',
        height: '100%',
        transformOrigin: 'top center',
        background: `conic-gradient(
          from 160deg at 50% 0%,
          transparent 35%,
          rgba(255, 255, 255, 0.08) 40%,
          rgba(255, 255, 255, 0.12) 43%,
          rgba(255, 255, 255, 0.08) 46%,
          transparent 52%
        )`,
      }}
      animate={{
        x: ['-30%', '-35%', '-30%'],
        rotate: [5, -3, 5],
        opacity: [0.6, 0.9, 0.6],
      }}
      transition={{
        duration: 7,
        delay: 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// 第3の光芒 - 6秒周期
function LightRaysThird() {
  return (
    <motion.div
      className="absolute"
      style={{
        top: '-40%',
        right: '20%',
        width: '80%',
        height: '90%',
        transformOrigin: 'top center',
        background: `conic-gradient(
          from 200deg at 50% 0%,
          transparent 40%,
          rgba(255, 255, 255, 0.06) 45%,
          rgba(255, 255, 255, 0.1) 48%,
          rgba(255, 255, 255, 0.06) 51%,
          transparent 56%
        )`,
      }}
      animate={{
        rotate: [-8, -4, -10, -8],
        opacity: [0.4, 0.7, 0.5, 0.4],
      }}
      transition={{
        duration: 6,
        delay: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// コースティクス Layer 1 - 4秒周期
function CausticsLayer1() {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 80px 60px at 20% 30%, rgba(255,255,255,0.2) 0%, transparent 70%),
          radial-gradient(ellipse 100px 80px at 70% 20%, rgba(255,255,255,0.15) 0%, transparent 70%),
          radial-gradient(ellipse 60px 50px at 40% 60%, rgba(255,255,255,0.18) 0%, transparent 70%),
          radial-gradient(ellipse 90px 70px at 80% 70%, rgba(255,255,255,0.12) 0%, transparent 70%)
        `,
      }}
      animate={{
        scale: [1, 1.05, 0.98, 1.02, 1],
        x: ['0%', '1%', '-0.5%', '0.5%', '0%'],
        y: ['0%', '0.5%', '1%', '-0.5%', '0%'],
        opacity: [0.6, 0.9, 0.4, 0.7, 0.6],
        filter: ['blur(0px)', 'blur(1px)', 'blur(2px)', 'blur(0px)', 'blur(0px)'],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// コースティクス Layer 2 - 5秒周期
function CausticsLayer2() {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 70px 55px at 35% 25%, rgba(255,255,255,0.15) 0%, transparent 70%),
          radial-gradient(ellipse 50px 40px at 60% 45%, rgba(255,255,255,0.12) 0%, transparent 70%),
          radial-gradient(ellipse 80px 65px at 25% 75%, rgba(255,255,255,0.1) 0%, transparent 70%),
          radial-gradient(ellipse 65px 50px at 85% 40%, rgba(255,255,255,0.14) 0%, transparent 70%)
        `,
      }}
      animate={{
        scale: [1, 1.08, 0.95, 1],
        x: ['0%', '-1%', '1%', '0%'],
        y: ['0%', '1%', '-0.5%', '0%'],
        rotate: [0, 1, -1, 0],
        opacity: [0.5, 0.8, 0.3, 0.5],
      }}
      transition={{
        duration: 5,
        delay: 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// コースティクス Layer 3 - 6秒周期
function CausticsLayer3() {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        backgroundImage: `
          radial-gradient(ellipse 120px 100px at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 90px 75px at 15% 55%, rgba(255,255,255,0.06) 0%, transparent 60%),
          radial-gradient(ellipse 100px 85px at 75% 65%, rgba(255,255,255,0.07) 0%, transparent 60%)
        `,
      }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 6,
        delay: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// 水面の波
function WaterSurface() {
  return (
    <motion.div
      className="absolute"
      style={{
        top: '-5%',
        left: '-10%',
        width: '120%',
        height: '15%',
        background: 'linear-gradient(180deg, rgba(150, 255, 255, 0.4) 0%, rgba(100, 220, 230, 0.2) 50%, transparent 100%)',
        filter: 'blur(8px)',
      }}
      animate={{
        y: [0, 3, -2, 2, 0],
        scaleY: [1, 1.1, 0.95, 1.05, 1],
        rotate: [-1, 0.5, 1, -0.5, -1],
        opacity: [0.6, 0.8, 0.5, 0.7, 0.6],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

export default function SplashScreen({ isVisible, onComplete }) {
  // 泡を生成（10個）
  const bubbles = useMemo(() => {
    return [
      { id: 1, delay: 0, duration: 6, size: 6, left: 8 },
      { id: 2, delay: 0.5, duration: 7, size: 4, left: 18 },
      { id: 3, delay: 1, duration: 5.5, size: 8, left: 32 },
      { id: 4, delay: 0.3, duration: 8, size: 5, left: 45 },
      { id: 5, delay: 0.8, duration: 6.5, size: 6, left: 58 },
      { id: 6, delay: 1.2, duration: 9, size: 3, left: 72 },
      { id: 7, delay: 1.5, duration: 7, size: 5, left: 85 },
      { id: 8, delay: 0.2, duration: 6, size: 7, left: 92 },
      { id: 9, delay: 2, duration: 8, size: 4, left: 25 },
      { id: 10, delay: 1.8, duration: 7.5, size: 5, left: 65 },
    ]
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center"
          initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{
            opacity: 0,
            scale: 1.5,
            filter: 'blur(25px)',
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          {/* 深い海のグラデーション背景 */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                180deg,
                rgba(0, 200, 210, 0.95) 0%,
                rgba(0, 150, 170, 0.97) 20%,
                rgba(0, 100, 140, 1) 45%,
                rgba(0, 60, 100, 1) 70%,
                rgba(0, 30, 60, 1) 100%
              )`,
            }}
          />

          {/* 水面の波 */}
          <WaterSurface />

          {/* 3層の光芒（ゴッドレイ） */}
          <LightRaysMain />
          <LightRaysSub />
          <LightRaysThird />

          {/* 3層のコースティクス */}
          <CausticsLayer1 />
          <CausticsLayer2 />
          <CausticsLayer3 />

          {/* 泡 */}
          <div className="absolute inset-0">
            {bubbles.map((bubble) => (
              <Bubble key={bubble.id} {...bubble} />
            ))}
          </div>

          {/* 上部のハイライト（水面からの光） */}
          <div
            className="absolute top-0 left-0 right-0 h-40"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
            }}
          />

          {/* 下部のグラデーション（深海感） */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{
              background: 'linear-gradient(0deg, rgba(0,30,50,0.5) 0%, transparent 100%)',
            }}
          />

          {/* S-BASE テキスト */}
          <motion.h1
            className="text-white z-10"
            style={{
              fontSize: '5rem',
              fontWeight: 300,
              letterSpacing: '0.3em',
              textShadow: `
                0 0 30px rgba(255,255,255,0.5),
                0 0 60px rgba(255,255,255,0.3),
                0 0 100px rgba(100,200,255,0.2)
              `,
            }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1.2,
              delay: 0.5,
              ease: 'easeOut',
            }}
          >
            S-BASE
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
