import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { processDocument } from '../services/documentParser';
import { auditLogRepository } from '../repositories/auditLogRepository';

const router = Router();

// Multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and TXT allowed.'));
    }
  }
});

/**
 * POST /documents/upload - Upload and analyze document
 */
router.post('/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    console.log(`[Document Upload] Processing: ${req.file.originalname}`);

    const result = await processDocument(req.file);

    await auditLogRepository.create({
      userId: req.user!.userId,
      action: 'document_upload',
      resource: 'document',
      details: {
        filename: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        s3_key: result.s3_key,
        risk_score: result.analysis.risk_score
      },
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent')
    });

    res.json({
      message: 'Document processed successfully',
      document: {
        filename: result.parsed.filename,
        type: result.parsed.type,
        metadata: result.parsed.metadata,
        s3_key: result.s3_key
      },
      analysis: result.analysis
    });
  } catch (error: any) {
    console.error('[Document Upload]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
