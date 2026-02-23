'use client';

import { useIntakeForm } from '@/lib/contexts/intake-form-context';
import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, FileText, Info } from 'lucide-react';

export function ConsentForms() {
  const { formData, updateFormData } = useIntakeForm();
  const [expandedConsent, setExpandedConsent] = useState<'telehealth' | 'compounded' | null>(null);
  const [isUploadingTelehealth, setIsUploadingTelehealth] = useState(false);
  const [isUploadingCompounded, setIsUploadingCompounded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const telehealthCanvasRef = useRef<HTMLCanvasElement>(null);
  const compoundedCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingTelehealth, setIsDrawingTelehealth] = useState(false);
  const [isDrawingCompounded, setIsDrawingCompounded] = useState(false);

  // Initialize canvases
  useEffect(() => {
    [telehealthCanvasRef, compoundedCanvasRef].forEach((ref) => {
      const canvas = ref.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#1c1917';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
        }
      }
    });
  }, []);

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement | null,
    setIsDrawing: (v: boolean) => void
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement | null,
    isDrawing: boolean
  ) => {
    if (!isDrawing || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (setIsDrawing: (v: boolean) => void) => {
    setIsDrawing(false);
  };

  const clearCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const uploadSignature = async (
    canvas: HTMLCanvasElement | null,
    purpose: 'telehealth_signature' | 'compounded_consent',
    setIsUploading: (v: boolean) => void
  ) => {
    if (!canvas) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create image'));
        }, 'image/png');
      });

      // Get presigned URL
      const presignedResponse = await fetch('/api/intake/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'image/png',
          purpose,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, key } = await presignedResponse.json();

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/png',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload signature');
      }

      // Save the key
      if (purpose === 'telehealth_signature') {
        updateFormData({ telehealthSignatureKey: key });
      } else {
        updateFormData({ compoundedConsentKey: key });
      }
    } catch (error) {
      console.error('Signature upload error:', error);
      setUploadError('Failed to save signature. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-mint/40 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-forest shrink-0 mt-0.5" />
        <p className="text-sm text-forest-muted">Standard telehealth consent. You can withdraw anytime.</p>
      </div>

      {/* Telehealth Consent */}
      <div className="border border-stone-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedConsent(expandedConsent === 'telehealth' ? null : 'telehealth')}
          className="w-full flex items-center justify-between p-4 text-left bg-stone-50 hover:bg-stone-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-stone-500" />
            <div>
              <p className="font-medium text-stone-900">Telehealth Consent</p>
              <p className="text-sm text-stone-500">Required for telehealth services</p>
            </div>
          </div>
          {formData.telehealthSignatureKey ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          ) : (
            <span className="text-xs text-red-500 font-medium">Required</span>
          )}
        </button>

        {expandedConsent === 'telehealth' && (
          <div className="p-4 border-t border-stone-200">
            <div className="bg-stone-50 rounded-lg p-4 max-h-48 overflow-y-auto mb-4 text-sm text-stone-600">
              <p className="mb-2">
                <strong>INFORMED CONSENT FOR TELEHEALTH SERVICES</strong>
              </p>
              <p className="mb-2">
                I hereby consent to receiving telehealth services from <span className="font-display font-bold tracking-[0.08em]">CULTR</span> Health and its affiliated healthcare providers.
                I understand that telehealth involves the use of electronic communications to enable healthcare providers to
                provide consultations, make diagnoses, recommend treatments, and prescribe medications at a distance.
              </p>
              <p className="mb-2">
                I understand that I have the right to withhold or withdraw my consent to telehealth at any time.
                I understand that my healthcare information will be protected in accordance with HIPAA regulations.
              </p>
              <p>
                By signing below, I acknowledge that I have read and understand this consent, and I voluntarily agree
                to receive telehealth services.
              </p>
            </div>

            {!formData.telehealthSignatureKey ? (
              <>
                <p className="text-sm font-medium text-stone-700 mb-2">Sign below to consent:</p>
                <div className="border-2 border-stone-300 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={telehealthCanvasRef}
                    width={500}
                    height={150}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={(e) => startDrawing(e, telehealthCanvasRef.current, setIsDrawingTelehealth)}
                    onMouseMove={(e) => draw(e, telehealthCanvasRef.current, isDrawingTelehealth)}
                    onMouseUp={() => stopDrawing(setIsDrawingTelehealth)}
                    onMouseLeave={() => stopDrawing(setIsDrawingTelehealth)}
                    onTouchStart={(e) => startDrawing(e, telehealthCanvasRef.current, setIsDrawingTelehealth)}
                    onTouchMove={(e) => draw(e, telehealthCanvasRef.current, isDrawingTelehealth)}
                    onTouchEnd={() => stopDrawing(setIsDrawingTelehealth)}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => clearCanvas(telehealthCanvasRef.current)}
                    className="text-sm text-stone-500 hover:text-stone-700"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => uploadSignature(telehealthCanvasRef.current, 'telehealth_signature', setIsUploadingTelehealth)}
                    disabled={isUploadingTelehealth}
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-all"
                  >
                    {isUploadingTelehealth ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Save Signature'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Consent signed</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compounded Medication Consent */}
      <div className="border border-stone-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setExpandedConsent(expandedConsent === 'compounded' ? null : 'compounded')}
          className="w-full flex items-center justify-between p-4 text-left bg-stone-50 hover:bg-stone-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-stone-500" />
            <div>
              <p className="font-medium text-stone-900">Compounded Medication Consent</p>
              <p className="text-sm text-stone-500">Required for compounded medications</p>
            </div>
          </div>
          {formData.compoundedConsentKey ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          ) : (
            <span className="text-xs text-red-500 font-medium">Required</span>
          )}
        </button>

        {expandedConsent === 'compounded' && (
          <div className="p-4 border-t border-stone-200">
            <div className="bg-stone-50 rounded-lg p-4 max-h-48 overflow-y-auto mb-4 text-sm text-stone-600">
              <p className="mb-2">
                <strong>CONSENT FOR COMPOUNDED MEDICATION</strong>
              </p>
              <p className="mb-2">
                I understand that the medication prescribed to me may be a compounded medication. Compounded medications
                are customized preparations made by a licensed compounding pharmacy to meet individual patient needs.
              </p>
              <p className="mb-2">
                I acknowledge that compounded medications are not FDA-approved, but the individual ingredients used
                may be FDA-approved. The compounding pharmacy operates under state board of pharmacy regulations.
              </p>
              <p className="mb-2">
                I understand that I should report any adverse reactions or side effects to my healthcare provider immediately.
              </p>
              <p>
                By signing below, I consent to receiving compounded medication as part of my treatment plan.
              </p>
            </div>

            {!formData.compoundedConsentKey ? (
              <>
                <p className="text-sm font-medium text-stone-700 mb-2">Sign below to consent:</p>
                <div className="border-2 border-stone-300 rounded-lg overflow-hidden bg-white">
                  <canvas
                    ref={compoundedCanvasRef}
                    width={500}
                    height={150}
                    className="w-full touch-none cursor-crosshair"
                    onMouseDown={(e) => startDrawing(e, compoundedCanvasRef.current, setIsDrawingCompounded)}
                    onMouseMove={(e) => draw(e, compoundedCanvasRef.current, isDrawingCompounded)}
                    onMouseUp={() => stopDrawing(setIsDrawingCompounded)}
                    onMouseLeave={() => stopDrawing(setIsDrawingCompounded)}
                    onTouchStart={(e) => startDrawing(e, compoundedCanvasRef.current, setIsDrawingCompounded)}
                    onTouchMove={(e) => draw(e, compoundedCanvasRef.current, isDrawingCompounded)}
                    onTouchEnd={() => stopDrawing(setIsDrawingCompounded)}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button
                    onClick={() => clearCanvas(compoundedCanvasRef.current)}
                    className="text-sm text-stone-500 hover:text-stone-700"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => uploadSignature(compoundedCanvasRef.current, 'compounded_consent', setIsUploadingCompounded)}
                    disabled={isUploadingCompounded}
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-all"
                  >
                    {isUploadingCompounded ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Save Signature'
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Consent signed</span>
              </div>
            )}
          </div>
        )}
      </div>

      {uploadError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{uploadError}</p>
        </div>
      )}
    </div>
  );
}
