const multer = require('multer');

// Store file in memory buffer
const storage = multer.memoryStorage();

// Debug middleware to log request details
const debugMulter = (req, res, next) => {
  console.log('=== MULTER DEBUG ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', Object.keys(req.headers));
  next();
};

// Validate file types/sizes
const fileFilter = (req, file, cb) => {
  console.log('File upload attempt:', {
    fieldname: file.fieldname,
    mimetype: file.mimetype,
    originalname: file.originalname
  });

  // Allow common image formats for image uploads
  const isImage = /^image\/(jpeg|jpg|png|gif|webp)$/i.test(file.mimetype);

  // Allow PDFs for document uploads
  const isPDF = file.fieldname === 'documents' && file.mimetype === 'application/pdf';

  if (isImage || isPDF) {
    console.log('File accepted:', file.originalname);
    return cb(null, true);
  }

  console.log('File rejected:', file.originalname, 'MIME type:', file.mimetype);
  cb(new Error(`File type not allowed. Received: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WebP images or PDFs for documents.`));
};

const limits = {
  fileSize: (file) => {
    // profile pic ≤2MB, docs ≤5MB
    return file.fieldname==='avatar' ? 2*1024*1024 : 5*1024*1024;
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5*1024*1024 } });

module.exports = upload;
module.exports.debugMulter = debugMulter;
