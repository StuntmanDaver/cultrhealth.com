'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { useState, useRef } from 'react';
import { Upload, Camera, X, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';

export function IDUploader() {
  const { formData, updateFormData } = useIntakeForm();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
      'image/gif',
      'application/pdf'
    ];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, WebP, HEIC, GIF) or PDF.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // Get presigned URL
      const presignedResponse = await fetch('/api/intake/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: file.type,
          purpose: 'id_document',
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignedResponse.json();

      // Check if this is a mock upload (development mode)
      const isMockUpload = uploadUrl.startsWith('data:');

      // Upload to S3 (or skip if mock)
      if (!isMockUpload) {
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
      } else {
        console.log('⚠️  DEV MODE: Skipping actual file upload (using mock)');
      }

      // Save the key in form data
      updateFormData({ idDocumentKey: key });

      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeUpload = () => {
    updateFormData({ idDocumentKey: undefined });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">Federal law requires ID verification for prescription medications.</p>
      </div>

      <div className="bg-mint/30 border border-forest-light/20 rounded-xl p-4">
        <h4 className="font-medium text-forest mb-2">Why we need your ID</h4>
        <p className="text-sm text-forest-muted">
          Federal and state regulations require us to verify your identity before prescribing medications.
          Your ID is stored securely and is only used for identity verification.
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-forest mb-3">
          Please upload a clear photo of the front of your government-issued ID.
        </p>
        <ul className="text-sm text-forest-muted mb-4 space-y-1">
          <li>• Driver's License</li>
          <li>• State ID</li>
          <li>• Passport</li>
        </ul>
      </div>

      {/* Upload Area */}
      {!formData.idDocumentKey ? (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/gif,application/pdf"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          <div
            className={`
              border-2 border-dashed rounded-xl p-4 md:p-8 text-center transition-all
              ${isUploading
                ? 'border-forest-light/30 bg-mint/20'
                : 'border-forest-light/30 hover:border-forest-light hover:bg-mint/20'
              }
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-forest-light animate-spin mb-3" />
                <p className="text-forest-muted font-medium">Uploading...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-mint rounded-xl flex items-center justify-center">
                    <Upload className="w-6 h-6 text-forest-light" />
                  </div>
                  <div className="w-12 h-12 bg-mint rounded-xl flex items-center justify-center">
                    <Camera className="w-6 h-6 text-forest-light" />
                  </div>
                </div>
                <p className="text-forest font-medium mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-forest-muted">
                  JPEG, PNG, WebP, HEIC, or PDF (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-forest-light/20 bg-mint/50 rounded-xl p-4">
          <div className="flex items-start gap-4">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="ID Preview"
                className="w-24 h-16 object-cover rounded-lg"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 text-forest">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">ID Uploaded Successfully</span>
              </div>
              <p className="text-sm text-forest-muted mt-1">
                Your ID has been securely uploaded.
              </p>
            </div>
            <button
              onClick={removeUpload}
              className="p-2 text-forest-muted hover:text-forest-dark hover:bg-forest-light/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{uploadError}</p>
        </div>
      )}

      <div className="text-sm text-forest-muted">
        <p className="font-medium mb-1">Photo Tips:</p>
        <ul className="space-y-0.5">
          <li>• Make sure all text is clearly readable</li>
          <li>• Avoid glare or shadows</li>
          <li>• Include all four corners of the ID</li>
          <li>• Ensure the photo is not blurry</li>
        </ul>
      </div>
    </div>
  );
}
