import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const cloudinaryConfig = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

const uploadOnCloudinary = async (
  localFilePath,
  options = {
    resource_type: "auto",
    folder: 'playHub',
  }
) => {
  cloudinaryConfig();
  try {
    if (!localFilePath) return;
    const response = await cloudinary.uploader.upload(localFilePath, options);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};
const deleteOnCloudinary = async (publicId, type = "auto") => {
  // console.log([...publicId]);
  cloudinaryConfig();
  try {
    if (!publicId) return;
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
      folder:"playHub"
    });
    return response;
  } catch (error) {
    return null;
  }
};
export { uploadOnCloudinary, deleteOnCloudinary };

// cloudinary.v2.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function(error, result) {console.log(result); });
