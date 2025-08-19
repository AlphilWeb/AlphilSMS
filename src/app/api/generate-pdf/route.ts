// app/api/generate-pdf/route.ts
import { generateReceiptPdf, generateTranscriptPdf, generateStaffListPdf } from '@/lib/actions/pdf-generataion/pdf-generation.actions';
import { NextRequest } from 'next/server';
// import { generateReceiptPdf, generateTranscriptPdf, generateStaffListPdf } from '@/app/actions/documents';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, paymentId, studentId, role } = body;
    
    // In a real app, you would get userId from the session
    const userId = 1; // Placeholder - replace with actual auth
    
    let pdfBuffer: Buffer;
    
    switch (type) {
      case 'receipt':
        if (!paymentId) {
          return new Response('Payment ID required', { status: 400 });
        }
        pdfBuffer = await generateReceiptPdf(
          paymentId,
          userId,
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent') || undefined
        );
        break;
        
      case 'transcript':
        if (!studentId) {
          return new Response('Student ID required', { status: 400 });
        }
        pdfBuffer = await generateTranscriptPdf(
          studentId,
          userId,
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent') || undefined
        );
        break;
        
      case 'staff_list':
        pdfBuffer = await generateStaffListPdf(
          role,
          userId,
          request.headers.get('x-forwarded-for') || undefined,
          request.headers.get('user-agent') || undefined
        );
        break;
        
      default:
        return new Response('Invalid PDF type', { status: 400 });
    }
    
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}.pdf"`,

      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to generate PDF',
      { status: 500 }
    );
  }
}