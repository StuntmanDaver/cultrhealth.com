'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Upload,
  Shield,
  FlaskConical,
  File,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import Button from '@/components/ui/Button'

// --------------------------------------------------
// Types
// --------------------------------------------------

interface Document {
  id: number
  purpose: string
  contentType: string
  previewUrl: string | null
  uploadedAt: string
}

// --------------------------------------------------
// Constants
// --------------------------------------------------

const PURPOSE_LABELS: Record<string, string> = {
  portal_id: 'Government ID',
  portal_prescription: 'Prescription',
  portal_lab_results: 'Lab Results',
  portal_other: 'Other Document',
  id_document: 'Government ID',
  telehealth_signature: 'Telehealth Consent',
  compounded_consent: 'Compounded Consent',
  prescription_photo: 'Prescription Photo',
}

const PURPOSE_ICONS: Record<string, typeof Shield> = {
  portal_id: Shield,
  id_document: Shield,
  portal_prescription: FileText,
  prescription_photo: FileText,
  portal_lab_results: FlaskConical,
  telehealth_signature: FileText,
  compounded_consent: FileText,
  portal_other: File,
}

const UPLOAD_PURPOSES = [
  { value: 'portal_id', label: 'Government ID' },
  { value: 'portal_prescription', label: 'Prescription' },
  { value: 'portal_lab_results', label: 'Lab Results' },
  { value: 'portal_other', label: 'Other' },
]

const ACCEPTED_TYPES = 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,application/pdf'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function DocumentsClient() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Upload state
  const [selectedPurpose, setSelectedPurpose] = useState('portal_id')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/portal/documents')
      if (res.status === 401) return // auth guard handles redirect
      if (!res.ok) throw new Error('Failed to load documents')
      const data = await res.json()
      if (data.success) {
        setDocuments(data.documents)
      } else {
        throw new Error(data.error || 'Failed to load documents')
      }
    } catch {
      setError('Unable to load your documents right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/portal/documents')
        if (cancelled) return
        if (res.status === 401) return
        if (!res.ok) throw new Error('Failed to load documents')
        const data = await res.json()
        if (cancelled) return
        if (data.success) {
          setDocuments(data.documents)
        } else {
          throw new Error(data.error || 'Failed to load documents')
        }
      } catch {
        if (!cancelled) setError('Unable to load your documents right now.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // File selection handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)
    setUploadError(null)
    setUploadSuccess(false)

    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File is too large. Maximum size is 10MB.')
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setSelectedFile(file)
  }

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      // 1. Get presigned URL from our API
      const res = await fetch('/api/portal/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: selectedFile.type,
          purpose: selectedPurpose,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to prepare upload')
      }

      const { uploadUrl } = await res.json()

      // 2. Upload directly to S3 (skip for mock mode)
      if (!uploadUrl.startsWith('data:')) {
        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedFile,
          headers: { 'Content-Type': selectedFile.type },
        })
        if (!putRes.ok) {
          throw new Error('Failed to upload file')
        }
      }

      // 3. Success
      setUploadSuccess(true)
      setSelectedFile(null)
      setSelectedPurpose('portal_id')
      if (fileInputRef.current) fileInputRef.current.value = ''

      // Re-fetch document list to show new entry
      await fetchDocuments()

      // Auto-clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Format date
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Get icon for purpose
  const getPurposeIcon = (purpose: string) => {
    const IconComponent = PURPOSE_ICONS[purpose] || File
    return <IconComponent className="w-5 h-5 text-brand-primary/40" />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/portal/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-brand-primary/50 hover:text-brand-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-brand-primary">
          Your Documents
        </h1>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-brand-primary/5 p-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-brand-primary/10 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-brand-primary/10 rounded w-1/4" />
                </div>
                <div className="h-8 bg-brand-primary/10 rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 mb-6">
          <p className="text-red-800 text-sm mb-2">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchDocuments}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && documents.length === 0 && (
        <div className="text-center py-12 mb-8">
          <FileText className="w-12 h-12 text-brand-primary/30 mx-auto mb-4" />
          <h2 className="font-display text-2xl text-brand-primary mb-2">
            No Documents Yet
          </h2>
          <p className="text-brand-primary/60 mb-6">
            Upload your first document to get started, or complete your medical intake.
          </p>
          <Link href="/intake">
            <Button variant="primary" size="lg">
              Start Intake
            </Button>
          </Link>
        </div>
      )}

      {/* Document List */}
      {!isLoading && !error && documents.length > 0 && (
        <div className="space-y-3 mb-8">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-brand-primary/5 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-primary/[0.04] flex items-center justify-center">
                  {getPurposeIcon(doc.purpose)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-primary text-sm">
                    {PURPOSE_LABELS[doc.purpose] || doc.purpose}
                  </p>
                  <p className="text-xs text-brand-primary/40">
                    {formatDate(doc.uploadedAt)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {doc.previewUrl ? (
                    <a
                      href={doc.previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:text-brand-primaryHover transition-colors"
                    >
                      View
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-brand-primary/30">
                      Preview unavailable
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Section */}
      {!isLoading && !error && (
        <div className="rounded-xl border border-brand-primary/5 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="w-5 h-5 text-brand-primary/50" />
            <h2 className="font-display text-lg font-semibold text-brand-primary">
              Upload New Document
            </h2>
          </div>

          {/* Upload Success */}
          {uploadSuccess && (
            <div className="rounded-lg bg-green-50 border border-green-100 p-3 mb-4">
              <p className="text-green-800 text-sm">Document uploaded successfully.</p>
            </div>
          )}

          {/* Upload Error */}
          {uploadError && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 mb-4">
              <p className="text-red-800 text-sm">{uploadError}</p>
            </div>
          )}

          {/* Purpose Selector */}
          <div className="mb-4">
            <label
              htmlFor="upload-purpose"
              className="block text-sm font-medium text-brand-primary/70 mb-1.5"
            >
              Document Type
            </label>
            <select
              id="upload-purpose"
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="w-full rounded-lg border border-brand-primary/10 px-3 py-2 text-sm text-brand-primary bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary/30"
            >
              {UPLOAD_PURPOSES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Input Area */}
          <div className="mb-4">
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-brand-primary/70 mb-1.5"
            >
              File
            </label>
            <div
              className="relative border-2 border-dashed border-brand-primary/10 rounded-lg p-6 text-center hover:border-brand-primary/20 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-brand-primary/20 mx-auto mb-2" />
              <p className="text-sm text-brand-primary/50">
                Click to select a file
              </p>
              <p className="text-xs text-brand-primary/30 mt-1">
                Images or PDF, up to 10MB
              </p>
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleFileSelect}
                className="sr-only"
              />
            </div>
          </div>

          {/* File Error */}
          {fileError && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 mb-4">
              <p className="text-red-800 text-sm">{fileError}</p>
            </div>
          )}

          {/* Selected File Info */}
          {selectedFile && (
            <div className="rounded-lg bg-brand-primary/[0.03] p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-primary truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-brand-primary/40">
                    {formatSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="text-brand-primary/40 hover:text-brand-primary/60 text-sm ml-3"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            variant="primary"
            size="md"
            onClick={handleUpload}
            isLoading={isUploading}
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Document
          </Button>
        </div>
      )}
    </div>
  )
}
