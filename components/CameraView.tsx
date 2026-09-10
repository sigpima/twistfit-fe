'use client'

import { useEffect, useRef } from 'react'
import { useCameraStream } from '@/hooks/useCameraStream'

export default function CameraView() {
  const { status, stream, errorMessage } = useCameraStream()
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  if (status === 'error') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black p-6 text-center text-white">
        <p>Không thể mở camera: {errorMessage}. Vui lòng cấp quyền camera và tải lại trang.</p>
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="h-full w-full scale-x-[-1] object-cover"
      data-testid="camera-video"
    />
  )
}
