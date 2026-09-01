export const uploadImageToCloudinary = async (
  fileOrBase64: File | string,
  folder: string = 'employees'
): Promise<string> => {
  const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dmemdpd69';
  const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default'; 

  if (!CLOUD_NAME) {
    throw new Error('Cloudinary cloud name is not configured.');
  }

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();

  if (typeof fileOrBase64 === 'string') {
    // If it's a base64 string
    formData.append('file', fileOrBase64);
  } else {
    // If it's a File object
    formData.append('file', fileOrBase64);
  }

  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
