"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, X } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface PdfUploaderProps {
  onFilesChange: (files: File[]) => void;
  disabled: boolean;
}

export function PdfUploader({ onFilesChange, disabled }: PdfUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNewFiles = (newFiles: FileList | null) => {
    if (newFiles) {
      const acceptedFiles = Array.from(newFiles).filter(
        (file) => file.type === "application/pdf"
      );
      
      const uniqueNewFiles = acceptedFiles.filter(newFile => !files.some(existingFile => existingFile.name === newFile.name));

      if (uniqueNewFiles.length > 0) {
        const updatedFiles = [...files, ...uniqueNewFiles];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleNewFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const removeFile = (fileName: string) => {
    const updatedFiles = files.filter((file) => file.name !== fileName);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/30 p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/10" : "hover:bg-primary/5",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) => handleNewFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
        <UploadCloud className="h-12 w-12 text-primary" />
        <p className="font-semibold text-foreground">Drag & drop PDF files here</p>
        <p className="text-sm text-muted-foreground">or click to browse</p>
      </div>
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="font-medium text-sm text-muted-foreground">Uploaded files:</h4>
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.name} className="flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="h-5 w-5 flex-shrink-0 text-primary" />
                  <span className="truncate" title={file.name}>{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.name);
                  }}
                  disabled={disabled}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
