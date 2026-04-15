import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { X, Camera, CheckCircle2 } from 'lucide-react'

/**
 * Opens the device camera and scans for QR codes in real time.
 * onDetect(data) is called when a QR code is found.
 */
export default function QrCameraScanner({ onDetect, onClose }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef    = useRef(null)

  const [error, setError]       = useState(null)
  const [detected, setDetected] = useState(null)
  const [ready, setReady]       = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        videoRef.current.onloadedmetadata = () => {
          setReady(true)
          scan()
        }
      }
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Permissão de câmera negada. Permita o acesso nas configurações do navegador.')
      } else {
        setError('Câmera não encontrada ou indisponível.')
      }
    }
  }

  function stopCamera() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  function scan() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scan)
      return
    }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code) {
      setDetected(code.data)
      stopCamera()
      onDetect?.(code.data)
      return
    }

    rafRef.current = requestAnimationFrame(scan)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-[#111119] border border-[#1e1e2c] rounded-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2c]">
          <div className="flex items-center gap-2">
            <Camera size={15} className="text-emerald-400" />
            <span className="text-sm font-semibold text-white">Escanear QR Code</span>
          </div>
          <button onClick={() => { stopCamera(); onClose?.() }}
            className="text-zinc-600 hover:text-zinc-300 p-1 rounded-lg hover:bg-[#1a1a24] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : detected ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center space-y-2">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
              <p className="text-emerald-400 text-sm font-semibold">QR Code detectado!</p>
              <p className="text-zinc-600 text-xs break-all line-clamp-3">{detected}</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />
              {/* Scan frame overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 relative">
                  <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-emerald-400 rounded-tl" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-emerald-400 rounded-tr" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-emerald-400 rounded-bl" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-emerald-400 rounded-br" />
                  {ready && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400/60 animate-scan" />
                  )}
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {!error && !detected && (
            <p className="text-xs text-zinc-600 text-center">
              Aponte a câmera para o QR Code do WhatsApp
            </p>
          )}

          <button
            className="btn-secondary w-full justify-center text-xs"
            onClick={() => { stopCamera(); onClose?.() }}
          >
            {detected ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}
