import { useNav } from '../context/NavContext'
import { StatusBar, HelpyLogo } from '../components/shared'

export default function LoginPage() {
  const { login } = useNav()
  return (
    <div className="relative flex flex-col flex-1 overflow-hidden bg-[#d8edff]">
      <img src="/assets/home-wave-background.png" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top opacity-65" />
      <div className="absolute inset-0 bg-white/35 backdrop-blur-[1px]" />
      <div className="absolute left-1/2 top-[62px] h-[110px] w-[110px] -translate-x-1/2 rounded-full bg-white/85 blur-2xl" />
      <StatusBar />
      <div className="relative z-10 flex-1 overflow-y-auto px-7 pb-6">
        <div className="pt-14 flex justify-center"><HelpyLogo size="lg" /></div>
        <div className="text-center mt-5 mb-7">
          <h1 className="text-[27px] font-black tracking-tight text-[#10112f]">Welcome to Helpy</h1>
          <p className="mt-2 text-[14px] leading-5 text-[#7a8394] font-medium">Discover trusted services near you, all in one place.</p>
        </div>
        <button onClick={login} className="w-full h-[52px] rounded-[17px] bg-gradient-to-r from-[#0679ff] to-[#0059d9] text-white text-[16px] font-black shadow-[0_14px_28px_rgba(0,96,222,0.22)] active:scale-[0.99] transition">Continue</button>
      </div>
    </div>
  )
}
