import { promises as fs } from 'fs';
import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

// Re-usable file filter for Multer
export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return callback(new BadRequestException('Only image files are allowed!'), false);
  }
  callback(null, true);
};

// Re-usable filename editor for Multer
export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

// Re-usable file deleter
export const deleteFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    // Log the error but don't block the request if file doesn't exist
    console.error(`Error deleting file at ${filePath}:`, err);
  }
};
