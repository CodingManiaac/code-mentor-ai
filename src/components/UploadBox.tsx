"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  onFileUpload: (file: File) => void;
}

export default function UploadBox({
  onFileUpload,
}: Props) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({
      multiple: false,
    });

  return (
    <div
      {...getRootProps()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition ${
        isDragActive
          ? "border-blue-500 bg-blue-500/10"
          : "border-zinc-700"
      }`}
    >
      <input {...getInputProps()} />

      <p>
        📁 Drag & Drop a file
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        or click to upload
      </p>
    </div>
  );
}