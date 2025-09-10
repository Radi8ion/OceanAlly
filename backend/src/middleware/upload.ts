import multer from 'multer';

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// Create the multer instance
const upload = multer({ storage: storage });

export default upload;