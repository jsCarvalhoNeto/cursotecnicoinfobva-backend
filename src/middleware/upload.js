import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual (equivalente ao __dirname do CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar armazenamento
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Criar diretório de uploads se não existir
    const uploadDir = path.join(__dirname, '../public/uploads/activities');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtrar tipos de arquivos permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',           // PDF
    'text/plain',               // TXT
    'application/vnd.ms-powerpoint', // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'application/msword',       // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/zip',          // ZIP
    'image/jpeg',              // JPG
    'image/png',               // PNG
    'image/gif',               // GIF
    'image/webp'               // WEBP
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limite de 10MB
  }
});

export default upload;
