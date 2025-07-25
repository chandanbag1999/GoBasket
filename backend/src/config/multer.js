const multer = require('multer');

// Store file in memory buffer
const storage = multer.memoryStorage();

// Validate file types/sizes
const fileFilter = (req, file, cb) => {
  const isImage = /^image\/(jpeg|png)$/i.test(file.mimetype);
  const isPDF   = file.fieldname==='documents' && file.mimetype==='application/pdf';
  if (isImage || isPDF) return cb(null, true);
  cb(new Error('Only JPEG/PNG images or PDFs allowed'));
};

const limits = {
  fileSize: (file) => {
    // profile pic ≤2MB, docs ≤5MB
    return file.fieldname==='avatar' ? 2*1024*1024 : 5*1024*1024;
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5*1024*1024 } });

module.exports = upload;
