"use client";

import { useState, useRef } from "react";
import { RiUploadCloud2Line, RiCloseLine, RiFileLine, RiLoader4Line } from "react-icons/ri";
import toast from "react-hot-toast";

export default function R2FileUploader({
  label,
  accept,
  maxSize, // in MB
  value,
  onChange,
  restaurantSlug,
  subfolder,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = async (file) => {
    // 1. Validate File Type
    // accept format example: "image/jpeg, image/png" or ".glb, .gltf"
    const fileExtension = "." + file.name.split(".").pop().toLowerCase();
    const fileType = file.type;

    const acceptedTypes = accept.split(",").map((t) => t.trim().toLowerCase());
    const isValidType = acceptedTypes.some((type) => {
      if (type.startsWith(".")) return fileExtension === type;
      return fileType.match(new RegExp(type.replace("*", ".*")));
    });

    if (!isValidType) {
      toast.error(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    // 2. Validate Size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File is too large. Max size: ${maxSize}MB`);
      return;
    }

    if (!restaurantSlug) {
      toast.error("Restaurant slug is missing. Cannot upload.");
      return;
    }

    await uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setProgress(0);

    try {
      // 1. Get Presigned URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          restaurantSlug,
          subfolder,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload to R2
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          onChange(publicUrl);
          toast.success("File uploaded successfully");
          setUploading(false);
        } else {
          setUploading(false);
          toast.error("Upload failed");
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        toast.error("Upload error");
      };

      xhr.send(file);
    } catch (error) {
      console.error(error);
      setUploading(false);
      toast.error("Error starting upload");
    }
  };

  const handleRemove = () => {
    onChange("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isImage = value && (value.match(/\.(jpeg|jpg|png|webp)$/i) || accept.includes("image"));

  return (
    <div className="w-full">
      <label className="block text-xs text-text-dim mb-1 ml-1">{label}</label>

      {!value && !uploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors
            ${isDragging ? "border-primary bg-primary/10" : "border-gray-700 hover:border-gray-500 bg-dark-800"}
          `}
        >
          <RiUploadCloud2Line className="text-3xl text-gray-400 mb-2" />
          <p className="text-sm text-text-dim text-center">
            Drag & drop or <span className="text-primary">browse</span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Max {maxSize}MB ({accept.replace(/,/g, ", ")})
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {uploading && (
        <div className="bg-dark-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <RiLoader4Line className="animate-spin text-primary" />
            <span className="text-sm text-white">Uploading... {Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {value && !uploading && (
        <div className="relative group bg-dark-800 border border-gray-700 rounded-xl p-3 flex items-center gap-3">
          {isImage ? (
            <div className="w-12 h-12 relative rounded-md overflow-hidden bg-black/20 flex-shrink-0">
               {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-md bg-dark-700 flex items-center justify-center flex-shrink-0">
              <RiFileLine className="text-xl text-primary" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate font-medium">
              {value.split("/").pop()}
            </p>
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary hover:underline"
            >
              View File
            </a>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>
      )}
    </div>
  );
}
