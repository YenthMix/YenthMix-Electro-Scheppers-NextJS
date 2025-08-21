import { NextResponse } from 'next/server';
import { registerFileWithBotpress, uploadFileContent } from '../../../../lib/services/botpress.js';
import { UPLOAD_CONFIG } from '../../../../lib/config.js';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > UPLOAD_CONFIG.maxFileSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    console.log(`📁 File upload received: ${file.name} (${file.size} bytes)`);
    console.log(`📁 File type: ${file.type}`);

    // Convert File to a format compatible with our Botpress service
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileObj = {
      originalname: file.name,
      mimetype: file.type,
      size: file.size
    };

    // Register file with Botpress
    const registrationResult = await registerFileWithBotpress(
      fileObj, 
      title || file.name
    );

    // Upload file content to Botpress storage
    await uploadFileContent(
      registrationResult.uploadUrl, 
      fileBuffer, 
      file.type
    );

    console.log(`✅ File uploaded successfully: ${registrationResult.fileName}`);

    return NextResponse.json({
      success: true,
      message: 'File uploaded to knowledge base successfully',
      fileId: registrationResult.fileId,
      fileName: registrationResult.fileName,
      fileKey: registrationResult.fileKey,
      title: registrationResult.title
    });

  } catch (error) {
    console.error('❌ File upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload file to knowledge base' },
      { status: 500 }
    );
  }
}
