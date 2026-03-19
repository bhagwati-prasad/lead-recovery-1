"use client";

import React, { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { validateUploadFile } from "../utils";

type LeadUploadAreaProps = {
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
};

export function LeadUploadArea({ onUpload, isLoading = false }: LeadUploadAreaProps) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setSuccess(null);

      const validation = await validateUploadFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }

      try {
        await onUpload(file);
        setSuccess(`Successfully imported leads from ${file.name}`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to upload leads"
        );
      }
    },
    [onUpload]
  );

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <Card title="Import Leads">
      <div
        className={`lead-upload-area ${dragActive ? "lead-upload-area--active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <svg
          className="lead-upload-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="lead-upload-title">Drag and drop your leads file here</p>
        <p className="lead-upload-hint">or click to select from your computer</p>
        <p className="lead-upload-formats">
          Supported formats: CSV, JSON, XLSX (up to 10 MB)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json,.xlsx,.xls"
          onChange={handleFileInput}
          disabled={isLoading}
          className="lead-upload-input"
          aria-label="Upload leads file"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="lead-upload-button"
        >
          {isLoading ? "Uploading..." : "Select File"}
        </Button>

        {error && (
          <div role="alert" className="lead-upload-error">
            <strong>Error:</strong> {error}
          </div>
        )}
        {success && (
          <div role="status" className="lead-upload-success">
            <strong>Success:</strong> {success}
          </div>
        )}
      </div>
    </Card>
  );
}
