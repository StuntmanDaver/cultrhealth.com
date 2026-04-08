import { NextRequest, NextResponse } from 'next/server';
import { isAdminEmail } from '@/lib/auth';
import { sql } from '@vercel/postgres';
import { createAdminAction } from '@/lib/creators/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('cookie') || ''; // We might use standard JWT verify, but for simple admin routes let's do a basic session check if possible.
    // In this app, admin routes typically check session email against isAdminEmail
    const sessionCookie = request.cookies.get('session');
    
    // For simplicity, we assume verifyAuth or another helper is used. 
    // Here we'll do a quick verify (assuming similar to existing admin routes)
    // A robust implementation would use full JWT decoding, but let's just assume we have access to email.
    // Wait, the plan says "Use verifyAdmin" - actually we can import verifyAuth and then check isAdminEmail.
    const { verifyAuth } = await import('@/lib/auth');
    const auth = await verifyAuth(request);
    
    if (!auth.authenticated || !auth.email || !isAdminEmail(auth.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql`
      SELECT id, version_string, status, created_at, created_by, published_at, published_by 
      FROM dosing_rule_versions 
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    return NextResponse.json({ versions: result.rows });
  } catch (error) {
    console.error('Admin Dosing Rules GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch rule versions' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { verifyAuth } = await import('@/lib/auth');
    const auth = await verifyAuth(request);
    
    if (!auth.authenticated || !auth.email || !isAdminEmail(auth.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, rules_json, version_string } = body;

    if (action === 'draft') {
      const result = await sql`
        INSERT INTO dosing_rule_versions (version_string, rules_json, status, created_by)
        VALUES (${version_string}, ${JSON.stringify(rules_json)}, 'draft', ${auth.email})
        RETURNING id, version_string, status
      `;

      await createAdminAction({
        admin_email: auth.email,
        action_type: 'create_dosing_rules_draft',
        entity_type: 'dosing_rule_versions',
        entity_id: result.rows[0].id,
        metadata: { version_string }
      });

      return NextResponse.json({ success: true, version: result.rows[0] });
    }

    if (action === 'publish') {
      // Archive existing published
      await sql`UPDATE dosing_rule_versions SET status = 'archived' WHERE status = 'published'`;
      
      const result = await sql`
        UPDATE dosing_rule_versions 
        SET status = 'published', published_at = NOW(), published_by = ${auth.email}
        WHERE version_string = ${version_string}
        RETURNING id, version_string, status
      `;

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      }

      await createAdminAction({
        admin_email: auth.email,
        action_type: 'publish_dosing_rules',
        entity_type: 'dosing_rule_versions',
        entity_id: result.rows[0].id,
        metadata: { version_string }
      });

      return NextResponse.json({ success: true, version: result.rows[0] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin Dosing Rules POST error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
