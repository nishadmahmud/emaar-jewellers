"use client";
import React, { useRef, useState, useEffect } from "react";
import { SquarePen, Trash2, Upload } from "lucide-react";
import Image from "next/image";

export const ImageUploader = ({
  number,
  uploadImmediately = false,
  uploadHandler,
  onDelete,
  onImageChange,
  clearUploader,
  setClearUploader,
  existingImageUrl = null,
}) => {
  const [image, setImage] = useState(null); // { file, data_url }
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (existingImageUrl && !image) {
      setImage({ data_url: existingImageUrl, file: null });
    }
  }, [existingImageUrl, image]);

  useEffect(() => {
    if (clearUploader) {
      setImage(null);
      if (setClearUploader) setClearUploader(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [clearUploader, setClearUploader]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data_url = URL.createObjectURL(file);
    const newImage = { file, data_url };
    setImage(newImage);

    if (onImageChange) {
      onImageChange(newImage);
    }

    if (uploadImmediately && uploadHandler) {
      try {
        await uploadHandler(newImage);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleRemove = () => {
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onDelete) onDelete();
    if (onImageChange) onImageChange(null);
  };

  return (
    <div className="App w-full">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {image ? (
        <div className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
          {/* Image Container */}
          <div className="aspect-square relative w-full h-full">
            <Image
              src={image.data_url || "/placeholder.svg"}
              alt={`image-${number || 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />

            {/* Overlay with buttons - appears on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white text-gray-700 px-2 py-1.5 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                >
                  <SquarePen size={18} />
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="bg-red-500 text-white px-2 py-1.5 rounded-md text-sm font-medium hover:bg-red-600 transition-colors duration-150 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Image number indicator */}
          {number && (
            <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {number}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-200 rounded-lg p-8 text-center hover:border-blue-300 transition-colors cursor-pointer w-full"
        >
          <div className="space-y-3">
            <Upload className="w-8 h-8 text-blue-300 mx-auto" />
            <p className="text-sm text-gray-600">
              Click to upload file
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
