"use client";
import { useState } from "react";
import Loader from "../ui/Loader";
import { RiDeleteBin6Line, RiQrCodeLine, RiCloseLine, RiDownloadLine } from "react-icons/ri";
import QrCodeGenerator from "./QrCodeGenerator";
import { createPortal } from "react-dom";

export default function TableCard({ table, onDelete, qrSettings, slug }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${table.table_number}?`)) return;
    
    setIsDeleting(true);
    try {
      await onDelete(table.id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const fullUrl = `https://menu-app-psi-five.vercel.app/${slug || 'demo'}/${table.table_number}`;

  return (
    <>
      <div className="bg-dark-900 rounded-2xl p-6 flex flex-col items-center text-center shadow-lg relative border border-gray-800 hover:border-accent/50 transition-colors group h-full justify-between">
        
        {/* Table Icon / Avatar */}
        <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 shadow-inner shadow-accent/5 group-hover:scale-110 transition-transform duration-300">
           <span className="text-3xl font-bold font-mono tracking-wider">{table.table_number}</span>
        </div>

        <div className="w-full flex flex-col gap-2">
          <button 
            onClick={() => setShowQr(true)}
            className="flex items-center justify-center gap-2 text-xs text-primary hover:text-white transition-colors py-2 border border-dashed border-gray-700/50 rounded-lg hover:bg-white/5"
          >
             <RiQrCodeLine size={16} />
             <span>View QR Code</span>
          </button>
        </div>

        {/* Delete Button */}
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
                
                <h3 className="text-xl font-bold text-white">Table {table.table_number}</h3>
                
                <div className="bg-white p-4 rounded-xl">
                    <QrCodeGenerator 
                        url={fullUrl}
                        width={250}
                        height={250}
                        color1={qrSettings?.color1}
                        color2={qrSettings?.color2}
                    />
                </div>
                
                <p className="text-xs text-gray-500 text-center break-all">
                    {fullUrl}
                </p>

                 {/* Download hint: right click to save (simple solution for now) */}
                 <p className="text-xs text-primary/80 flex items-center gap-1">
                    <RiDownloadLine /> Right click image to save
                 </p>
            </div>
        </div>,
        document.body
      )}
    </>
  );
}
