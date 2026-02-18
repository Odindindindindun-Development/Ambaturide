// Local file storage configuration (switched from Cloudinary for development)
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.resolve(__dirname, 'uploads');
const dirs = [
  path.join(uploadDir, 'profile-pictures'),
  path.join(uploadDir, 'driver-license'),
  path.join(uploadDir, 'vehicle-images'),
  path.join(uploadDir, 'inquiries')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage for profile pictures
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, 'profile-pictures'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage for driver license images
const driverLicenseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, 'driver-license'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'license-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage for vehicle images
const vehicleImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, 'vehicle-images'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'vehicle-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage for inquiry attachments
const inquiryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(uploadDir, 'inquiries'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'inquiry-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Create multer upload instances
export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadDriverLicense = multer({
  storage: driverLicenseStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadVehicleImage = multer({
  storage: vehicleImageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadInquiry = multer({
  storage: inquiryStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Combined upload for driver signup (license + vehicle)
const driverSignupStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'licenseImage'
      ? 'driver-license'
      : 'vehicle-images';
    cb(null, path.join(uploadDir, folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const prefix = file.fieldname === 'licenseImage' ? 'license-' : 'vehicle-';
    cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
  }
});

export const uploadDriverSignup = multer({
  storage: driverSignupStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

// Helper to delete local image file
export const deleteFromCloudinary = async (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Extract filename from path (compatibility function)
export const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  return path.basename(url);
};
