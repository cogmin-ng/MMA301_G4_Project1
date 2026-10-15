const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// 1. Cấu hình Multer lưu vào RAM (MemoryStorage) - Không lưu tệp tĩnh công khai ra ổ đĩa
const storage = multer.memoryStorage();

// Bộ lọc định dạng ảnh
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const isExtValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const isMimeValid = allowedTypes.test(file.mimetype);

  if (isExtValid || isMimeValid) {
    return cb(null, true);
  }
  cb(new Error('Chỉ chấp nhận các tệp định dạng ảnh (JPG, PNG, WEBP, GIF)!'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB tối đa
  fileFilter: fileFilter,
});

// 2. Endpoint upload FormData: POST /api/upload
// Mã hóa ảnh sang Data URL Base64 để lưu trữ trực tiếp vào CSDL MySQL (LONGTEXT)
router.post('/', (req, res) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Lỗi upload: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Vui lòng chọn tệp hình ảnh để tải lên.' });
    }

    const mime = req.file.mimetype || 'image/jpeg';
    const base64Data = req.file.buffer.toString('base64');
    const dataUrl = `data:${mime};base64,${base64Data}`;

    return res.status(200).json({
      success: true,
      message: 'Mã hóa ảnh thành công để lưu vào Database!',
      url: dataUrl,
    });
  });
});

// 3. Endpoint upload Base64: POST /api/upload/base64
router.post('/base64', (req, res) => {
  try {
    const { base64 } = req.body;
    if (!base64) {
      return res.status(400).json({ error: 'Thiếu dữ liệu hình ảnh dạng Base64.' });
    }

    let normalizedDataUrl = base64;
    if (!base64.startsWith('data:')) {
      normalizedDataUrl = `data:image/jpeg;base64,${base64}`;
    }

    return res.status(200).json({
      success: true,
      message: 'Dữ liệu ảnh Base64 sẵn sàng lưu vào Database!',
      url: normalizedDataUrl,
    });
  } catch (error) {
    console.error('Lỗi upload base64:', error);
    return res.status(500).json({ error: 'Không thể xử lý tệp ảnh tải lên.' });
  }
});

module.exports = router;
