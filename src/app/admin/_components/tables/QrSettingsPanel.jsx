"use client";
import QrCodeGenerator from "./QrCodeGenerator";
import { RiInputMethodLine, RiPaletteLine } from "react-icons/ri";

export default function QrSettingsPanel({ color1, setColor1, color2, setColor2 }) {
  return (
    <div className="bg-dark-800/50 rounded-2xl p-6 border border-gray-800 mb-8 flex flex-col md:flex-row items-center gap-8">
      
      {/* Settings Form */}
      <div className="flex-1 w-full space-y-6">
        <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <RiPaletteLine size={20} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-white">QR Code Style</h2>
                <p className="text-sm text-gray-400">Customize your table QR codes</p>
             </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Gradient Start</label>
                <div className="flex items-center gap-3 bg-dark-900 p-2 rounded-xl border border-gray-800">
                    <input 
                        type="color" 
                        value={color1} 
                        onChange={(e) => setColor1(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none p-0"
                    />
                    <span className="text-gray-300 font-mono text-sm uppercase">{color1}</span>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Gradient End</label>
                <div className="flex items-center gap-3 bg-dark-900 p-2 rounded-xl border border-gray-800">
                    <input 
                        type="color" 
                        value={color2} 
                        onChange={(e) => setColor2(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none p-0"
                    />
                    <span className="text-gray-300 font-mono text-sm uppercase">{color2}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Live Preview</span>
        <QrCodeGenerator 
            url="https://menu-app-psi-five.vercel.app/" 
            width={180} 
            height={180} 
            color1={color1} 
            color2={color2} 
        />
      </div>
    </div>
  );
}
