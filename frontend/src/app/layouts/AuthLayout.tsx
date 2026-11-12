import { Outlet } from "react-router";
import bgImage from "../../assets/236227259a39f8fc98372b0db000196c5ed358d0.png";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-x-hidden overflow-y-auto font-sans">
      {/* Animated Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="Background" className="w-full h-full object-cover animate-bg-pan" />
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/70 via-emerald-900/40 to-cyan-900/50 animate-bg-overlay-shift"></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-8">
        <Outlet />
        
        <div className="mt-8 text-center">
           <p className="text-white/60 text-xs font-display tracking-widest uppercase">© 2026 AQUANICS Systems. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
