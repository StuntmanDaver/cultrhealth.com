import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/asher-med-api';

/**
 * POST /api/intake/upload
 *
 * Gets a presigned URL for uploading files to Asher Med S3.
 * Used for ID documents, telehealth signatures, and compounded consent signatures.
 *
 * Request body:
 *   - contentType: string (e.g., 'image/jpeg', 'image/png')
 *   - purpose: string (e.g., 'id_document', 'telehealth_signature', 'compounded_consent')
 *
 * Response:
 *   - uploadUrl: string (presigned S3 URL for PUT)
 *   - key: string (S3 object key to reference the file)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentType, purpose } = body;

    // Validate content type
    const allowedContentTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'application/pdf',
    ];

    if (!contentType || !allowedContentTypes.includes(contentType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid content type. Allowed types: ${allowedContentTypes.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Validate purpose
    const allowedPurposes = [
      'id_document',
      'telehealth_signature',
      'compounded_consent',
      'prescription_photo',
    ];

    if (purpose && !allowedPurposes.includes(purpose)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid purpose. Allowed purposes: ${allowedPurposes.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Development mode: Mock upload if API key not configured
    const isDevelopment = process.env.NODE_ENV === 'development' && !process.env.ASHER_MED_API_KEY;

    if (isDevelopment) {
      // Generate mock key for development
      const mockKey = `dev/${purpose}/${Date.now()}-${Math.random().toString(36).substring(7)}`;

      console.log('⚠️  DEV MODE: Using mock upload (ASHER_MED_API_KEY not configured):', {
        purpose,
        contentType,
        mockKey,
      });

      // Return a mock data URL that simulates successful upload
      return NextResponse.json({
        success: true,
        uploadUrl: 'data:text/plain;base64,bW9ja191cGxvYWQ=', // Mock URL
        key: mockKey,
      });
    }

    // Production: Get presigned URL from Asher Med
    const presignedData = await getPresignedUploadUrl(contentType);

    // Log upload request (no PHI)
    console.log('Presigned URL generated:', {
      purpose,
      contentType,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      uploadUrl: presignedData.data.uploadUrl,
      key: presignedData.data.key,
    });
  } catch (error) {
    console.error('Failed to get presigned URL:', error);

    const errorMessage = error instanceof Error ? error.message : 'Failed to get upload URL';

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
