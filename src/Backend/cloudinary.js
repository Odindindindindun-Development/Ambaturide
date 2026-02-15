// Cloudinary configuration for serverless file uploads
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile pictures
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ambaturide/profile-pictures',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
  },
});

// Storage for driver license images
const driverLicenseStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ambaturide/driver-license',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  },
});

// Storage for vehicle images
const vehicleImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ambaturide/vehicle-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }],
  },
});

// Storage for inquiry attachments
const inquiryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ambaturide/inquiries',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
  },
});

// Create multer upload instances
export const uploadProfilePicture = multer({ storage: profilePictureStorage });
export const uploadDriverLicense = multer({ storage: driverLicenseStorage });
export const uploadVehicleImage = multer({ storage: vehicleImageStorage });
export const uploadInquiry = multer({ storage: inquiryStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Combined upload for driver signup (license + vehicle)
export const uploadDriverSignup = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      const folder = file.fieldname === 'licenseImage' 
        ? 'ambaturide/driver-license' 
        : 'ambaturide/vehicle-images';
      return {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png'],
      };
    },
  }),
});

// Helper to delete image from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
  }
};

// Extract public_id from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
  return matches ? matches[1] : null;
};

export default cloudinary;
