"use client";
import { useState } from "react";
import Loader from "../ui/Loader";
import { RiDeleteBin6Line, RiQrCodeLine, RiCloseLine, RiDownloadLine, RiGlobalLine } from "react-icons/ri";
import QrCodeGenerator from "./QrCodeGenerator";
import { createPortal } from "react-dom";

export default function TableCard({ table, isGeneral, onDelete, qrSettings, slug, restaurantLogo }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [downloadTrigger, setDownloadTrigger] = useState(0);

  const handleDownload = () => {
      setDownloadTrigger(prev => prev + 1);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${table.table_number}?`)) return;
    
    setIsDeleting(true);
    try {
      await onDelete(table.id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const title = isGeneral ? "General Menu" : `Table ${table?.table_number}`;
  const fileName = isGeneral ? "qr-general-menu" : `qr-table-${table?.table_number}`;
  
  const fullUrl = isGeneral 
    ? `https://menu-3d.com/${slug}`
    : `https://menu-3d.com/${slug}/${table?.table_number}`;

  return (
    <>
      <div className="bg-dark-900 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative border border-gray-800 hover:border-accent/50 transition-colors group h-full justify-between">
        
        {/* Table Icon / Avatar */}
        <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 shadow-inner shadow-accent/5 group-hover:scale-110 transition-transform duration-300">
          {isGeneral ? (
            <RiGlobalLine size={40} />
          ) : (
            <span className="text-3xl font-bold font-mono tracking-wider">{table?.table_number}</span>
          )}
        </div>

        <div className="w-full flex flex-col gap-2">
          {isGeneral && <h3 className="text-xl font-bold text-white mb-2">{title}</h3>}
          <button 
            onClick={() => setShowQr(true)}
            className="flex items-center justify-center gap-2 text-xs text-primary hover:text-white transition-colors py-2 border border-dashed border-gray-700/50 rounded-lg hover:bg-white/5"
          >
             <RiQrCodeLine size={16} />
             <span>View QR Code</span>
          </button>
        </div>

        {/* Delete Button */}
        {!isGeneral && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="mt-6 w-full py-2.5 rounded-xl bg-gray-800 text-red-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader size="small" className="text-current" />
            ) : (
              <>
                <RiDeleteBin6Line size={18} />
                <span>Delete</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* QR Code Modal */}
      {showQr && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-dark-900 border border-gray-700 rounded-3xl p-8 max-w-sm w-full relative flex flex-col items-center gap-6 shadow-2xl">
                <button 
                  onClick={() => setShowQr(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <RiCloseLine size={24} />
                </button>
                
                <h3 className="text-xl font-bold text-white">{title}</h3>
                
                {/* QR Code Container - Transparent */}
                <div className="p-4 rounded-xl">
                    <QrCodeGenerator 
                        url={fullUrl}
                        width={250}
                        height={250}
                        color1={qrSettings?.color1}
                        color2={qrSettings?.color2}
                        logo={restaurantLogo}
                        resolution={10} // 2500x2500px for print quality
                        downloadTrigger={downloadTrigger} 
                        fileName={fileName} 
                    />
                </div>
                
                <p className="text-xs text-start text-gray-500 break-all bg-dark-800 p-2 rounded-lg border border-gray-800 w-full font-mono">
                    {fullUrl}
                </p>

                 {/* Download Button */}
                 <button 
                    onClick={handleDownload}
                    className="w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95 cursor-pointer"
                 >
                    <RiDownloadLine size={20} />
                    Download PNG
                 </button>
            </div>
        </div>,
        document.body
      )}
    </>
  );
}
