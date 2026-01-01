"use client";
import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

export default function QrCodeGenerator({ 
  url, 
  width = 200, 
  height = 200, 
  color1 = "#4f46e5", 
  color2 = "#ec4899",
  logo = "/logo.png"
}) {
  const ref = useRef(null);
  const qrCode = useRef(null);

  useEffect(() => {
    // Instantiate only once on client
    if (!qrCode.current) {
        qrCode.current = new QRCodeStyling({
            width: width,
            height: height,
            image: logo,
            dotsOptions: {
                color: "#4267b2",
                type: "classy-rounded",
            },
            imageOptions: {
                crossOrigin: "anonymous",
                margin: 10,
            },
            cornersSquareOptions: {
                type: "extra-rounded",
            },
            cornersDotOptions: {
                type: "dot",
            }
        });
    }
  }, []); // Run once on mount

  useEffect(() => {
    if (!qrCode.current) return;

    qrCode.current.update({
      data: url,
      width: width,
      height: height,
      image: logo,
      dotsOptions: {
        type: "classy-rounded",
        gradient: {
          type: "linear",
          rotation: 0,
          colorStops: [
            { offset: 0, color: color1 },
            { offset: 1, color: color2 },
          ],
        },
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
                { offset: 0, color: color1 },
                { offset: 1, color: color2 },
            ],
        }
      },
      cornersDotOptions: {
          type: "dot",
          gradient: {
            type: "linear",
            rotation: 0,
            colorStops: [
                { offset: 0, color: color1 },
                { offset: 1, color: color2 },
            ],
        }
      },
      backgroundOptions: {
        color: "transparent",
      },
    });
    
    if (ref.current) {
        ref.current.innerHTML = "";
        qrCode.current.append(ref.current);
    }
  }, [url, width, height, color1, color2, logo]);

  return <div ref={ref} className="rounded-xl overflow-hidden bg-white p-2 flex items-center justify-center" />;
}
