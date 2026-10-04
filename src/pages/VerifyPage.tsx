import { useRef, useState, type KeyboardEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNav } from '../context/NavContext'
import { StatusBar, HelpyLogo } from '../components/shared'
import { requestLoginOtp, verifyLoginOtp } from '../api/auth'

export default function VerifyPage() {
  const { goBack, login, params } = useNav()
  const [digits, setDigits] = useState(Array(6).fill(''))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const email = params?.email || ''
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const verify = async () => {
    const code = digits.join('')
    if (!email || code.length !== 6) {
      setError('Enter the complete 6-digit verification code.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const verified = await verifyLoginOtp(email, code)
      if (verified) login()
      else setError('That verification code is not valid.')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to verify the code.')
    } finally {
      setLoading(false)
    }
  }
  const resend = async () => {
    setDigits(Array(6).fill(''))
    setError('')
    try {
      await requestLoginOtp(email)
      inputs.current[0]?.focus()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to resend the code.')
    }
  }
  const updateDigit = (value: string, index: number) => {
    const entered = value.replace(/\D/g, '')
    if (!entered) {
      setDigits(current => current.map((digit, digitIndex) => digitIndex === index ? '' : digit))
      setError('')
      return
    }
    setDigits(current => {
      const next = [...current]
      entered.slice(0, 6 - index).split('').forEach((digit, offset) => { next[index + offset] = digit })
      return next
    })
    setError('')
    inputs.current[Math.min(index + entered.length, 5)]?.focus()
  }
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus()
  }

  return (
    <div className="relative flex flex-col flex-1 overflow-hidden bg-[#d8edff]">
      <img src="/assets/home-wave-background.png" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center opacity-80" />
      <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
      <div className="absolute -top-24 left-1/2 h-[230px] w-[300px] -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[260px] bg-gradient-to-t from-[#d8edff]/70 via-white/18 to-transparent" />
      <StatusBar />
      <div className="relative z-10 flex-1 px-7 pt-7">
        <div className="flex items-start justify-between">
          <button onClick={goBack} className="w-11 h-11 rounded-full bg-white/90 shadow flex items-center justify-center"><ArrowLeft size={23}/></button>
          <div className="-mt-2"><HelpyLogo size="sm" /></div>
        </div>
        <div className="mt-10 rounded-[28px] bg-white/58 px-4 py-6 shadow-[0_18px_46px_rgba(15,23,42,0.12)] backdrop-blur-md">
          <h1 className="text-[36px] leading-none font-black tracking-tight text-[#0c1230]">Verify Code</h1>
          <p className="mt-4 text-[16px] leading-6 text-[#10152f] font-semibold">We've sent a verification code to<br/><span className="text-[#0059b8] font-black">{email || 'your email address'}</span>.</p>
        </div>
        <div className="mt-8 flex justify-between gap-2" aria-label="Six-digit verification code">
          {digits.map((d,i)=>(
            <input key={i} ref={element => { inputs.current[i] = element }} value={d} maxLength={6} inputMode="numeric" autoComplete={i === 0 ? 'one-time-code' : 'off'} aria-label={`Digit ${i + 1} of 6`} onFocus={event => event.currentTarget.select()} onKeyDown={event => handleKeyDown(event, i)} onChange={event => updateDigit(event.target.value, i)}
              className={`w-[46px] h-[56px] bg-white rounded-xl text-center text-[28px] font-black text-[#0059a9] outline-none shadow-[0_10px_20px_rgba(15,23,42,0.10)] ${error?'ring-2 ring-red-400':''}`}/>
          ))}
        </div>
        <button onClick={verify} disabled={loading} className="mt-8 w-full h-[56px] rounded-xl bg-[#0057ac] text-white text-[20px] font-black shadow-lg disabled:cursor-wait disabled:opacity-70">{loading ? 'Verifying…' : 'Continue'}</button>
        {error && <p role="alert" className="mt-3 text-center text-red-500 font-bold">{error}</p>}
        <div className="mt-7 mx-auto max-w-[260px] rounded-2xl bg-white/88 px-5 py-3 text-center text-[16px] text-[#10152f] shadow-[0_12px_30px_rgba(15,23,42,0.14)] backdrop-blur">
          <p className="font-semibold">Didn't get a code?</p>
          <p className="mt-1"><button onClick={resend} className="text-[#0059a9] font-black">Resend OTP</button></p>
        </div>
      </div>
    </div>
  )
}
