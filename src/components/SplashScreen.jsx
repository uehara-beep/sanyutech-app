import { motion, AnimatePresence } from 'framer-motion'

export default function SplashScreen({ isVisible, onComplete }) {
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
          {/* 夜の道路背景画像 */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'url(/backgrounds/SunyuTEC_login_bg_iphone_1170x2532.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />

          {/* 暗めのオーバーレイ */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.3) 100%)',
            }}
          />

          {/* 微かな光のエフェクト */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 50% at 50% 20%, rgba(255,180,100,0.1) 0%, transparent 70%)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* ロゴ */}
          <motion.div
            className="z-10 flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 1,
              delay: 0.3,
              ease: 'easeOut',
            }}
          >
            <img
              src="/logo/SunyuTEC_icon_white_256.png"
              alt="SunyuTEC"
              className="w-24 h-24 mb-6"
              style={{
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              }}
            />
            <motion.h1
              className="text-white"
              style={{
                fontSize: '3.5rem',
                fontWeight: 300,
                letterSpacing: '0.3em',
                textShadow: `
                  0 0 30px rgba(255,255,255,0.3),
                  0 0 60px rgba(255,255,255,0.2)
                `,
              }}
            >
              S-BASE
            </motion.h1>
            <motion.p
              className="text-white/60 text-sm mt-2"
              style={{ letterSpacing: '0.2em' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              サンユウテック現場管理
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
