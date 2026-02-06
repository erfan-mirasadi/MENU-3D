"use client";
import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

const QrCodeGenerator = ({ 
  url, 
  width = 200, 
  height = 200, 
  color1 = "#ea7c69", 
  color2 = "#252836",
  logo = "/logo.png",
  resolution = 1,
  downloadTrigger = 0, // Changes to this prop trigger download
  fileName = "qr-code" // Filename for download
}) => {
  const divRef = useRef(null);
  const qrCode = useRef(null);

  useEffect(() => {
    // Helper to create rounded image
    const getRoundedImage = async (src) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const size = Math.min(img.width, img.height);
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                
                // Draw rounded rect
                ctx.beginPath();
                // 2xl is roughly 24px, but scaling to image size relative to 1000px base
                const radius = size * 0.2; // approx 20% radius for "rounded-2xl" look
                ctx.roundRect(0, 0, size, size, radius);
                ctx.clip();
                
                // Draw image centered
                ctx.drawImage(img, (img.width - size)/2, (img.height - size)/2, size, size, 0, 0, size, size);
                resolve(canvas.toDataURL());
            };
            img.onerror = () => resolve(src); // Fallback to original
            img.src = src;
        });
    };

    const initQr = async () => {
        let processedLogo = logo;
        if (logo) {
            try {
                processedLogo = await getRoundedImage(logo);
            } catch (e) {
                console.error("Failed to process logo", e);
            }
        }

        // Logical Size (for printing)
        const renderWidth = width * resolution;
        const renderHeight = height * resolution;

        qrCode.current = new QRCodeStyling({
          data: url,
          width: renderWidth,
          height: renderHeight,
          image: processedLogo,
          dotsOptions: {
            type: "classy-rounded",
            color: color1,
            gradient: {
              type: "linear",
              rotation: 0,
              colorStops: [
                { offset: 0, color: color1 },
                { offset: 1, color: color2 },
              ],
            },
          },
          imageOptions: {
            crossOrigin: "anonymous",
            margin: 0, 
            imageSize: 0.4
          },
          cornersSquareOptions: {
            type: "extra-rounded",
            color: color1,
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
              color: color1,
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

        if (divRef.current) {
            divRef.current.innerHTML = "";
            qrCode.current.append(divRef.current);

            // [NEW] Enforce visual size (Display Scaling)
            const canvas = divRef.current.querySelector("canvas");
            if (canvas) {
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;
            }
        }
    };

    initQr();
  }, [url, width, height, color1, color2, logo, resolution]);

  // [NEW] Effect to handle download trigger
  useEffect(() => {
    if (downloadTrigger > 0 && qrCode.current) {
        qrCode.current.download({ name: fileName, extension: "png" });
    }
  }, [downloadTrigger, fileName]);

  return <div ref={divRef} className="rounded-xl overflow-hidden flex items-center justify-center" />;
};

export default QrCodeGenerator;
