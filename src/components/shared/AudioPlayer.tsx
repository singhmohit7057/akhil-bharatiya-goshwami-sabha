import { useEffect, useRef, useState } from 'react'
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react'

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      setProgress(audio.currentTime)
      if (isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration)
    }
    const onDuration = () => { if (isFinite(audio.duration) && audio.duration > 0) setDuration(audio.duration) }
    const onEnded = () => { setPlaying(false); setProgress(0) }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onDuration)
    audio.addEventListener('durationchange', onDuration)
    audio.addEventListener('canplay', onDuration)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onDuration)
      audio.removeEventListener('durationchange', onDuration)
      audio.removeEventListener('canplay', onDuration)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  function toggleMute() {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !muted
    setMuted(!muted)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Number(e.target.value)
    setProgress(Number(e.target.value))
  }

  function fmt(s: number) {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-10 right-5 z-40 flex items-center gap-2.5 transition-all duration-300 ease-in-out
        backdrop-blur-md bg-white/60 border border-white/40 shadow-lg rounded-full
        ${playing ? 'px-3 py-2 w-56' : 'p-2 w-auto'}`}
    >
      <audio ref={audioRef} src="/audio.aac" preload="metadata" />

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 hover:bg-primary-dark transition-colors"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing
          ? <Pause className="w-3.5 h-3.5" />
          : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      {/* Expanded controls — only when playing */}
      {playing && (
        <>
          <div className="flex-1 min-w-0">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 0.001}
              step={0.1}
              value={progress}
              onChange={handleSeek}
              className="w-full h-1 cursor-pointer rounded-full appearance-none"
              style={{
                background: `linear-gradient(to right, var(--color-primary, #f97316) 0%, var(--color-primary, #f97316) ${duration ? (progress / duration) * 100 : 0}%, #e5e7eb ${duration ? (progress / duration) * 100 : 0}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-[9px] text-gray-500 mt-0.5">
              <span>{fmt(progress)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          <button onClick={toggleMute} className="text-gray-500 hover:text-primary shrink-0" aria-label={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => { audioRef.current?.pause(); setVisible(false) }}
            className="text-gray-400 hover:text-gray-600 shrink-0"
            aria-label="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </>
      )}
    </div>
  )
}
