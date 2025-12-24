"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";

export default function SmartMedia({
  files,
  alt,
  className,
  autoPlay = true,
  isVisible: externalIsVisible = null, // اگر از بیرون کنترل بشه
}) {
  const [internalIsVisible, setInternalIsVisible] = useState(false);
  const mediaRef = useRef(null);

  const iosUrl = files?.animation_url_ios;
  const androidUrl = files?.animation_url_android;
  const hasVideo = !!(iosUrl || androidUrl);

  const isVisible =
    externalIsVisible !== null ? externalIsVisible : internalIsVisible;

  useEffect(() => {
    if (!hasVideo || !autoPlay || externalIsVisible !== null) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInternalIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );

    if (mediaRef.current) observer.observe(mediaRef.current);

    return () => observer.disconnect();
  }, [hasVideo, autoPlay, externalIsVisible]);

  if (hasVideo && isVisible) {
    return (
      <div
        ref={mediaRef}
        className={`relative overflow-hidden w-full h-full ${className || ""}`}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain animate-in fade-in duration-700"
        >
          {iosUrl && (
            <source src={iosUrl} type='video/quicktime; codecs="hvc1"' />
          )}
          {androidUrl && <source src={androidUrl} type="video/webm" />}
        </video>
      </div>
    );
  }

  // If no valid image URL, render a placeholder
  if (!files?.image_url) {
    return (
      <div
        ref={mediaRef}
        className={`relative w-full h-full ${
          className || ""
        } bg-gray-800 flex items-center justify-center`}
      >
        <svg
          className="w-1/3 h-1/3 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div ref={mediaRef} className={`relative w-full h-full ${className || ""}`}>
      <Image
        src={files.image_url}
        alt={alt || "product"}
        fill
        sizes="(max-width: 768px) 100vw, 300px"
        className="object-contain"
        priority={false}
      />
    </div>
  );
}
