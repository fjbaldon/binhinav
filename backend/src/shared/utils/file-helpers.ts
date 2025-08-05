import { promises as fs } from 'fs';
import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export const adFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg|mp4|webm|mov)$/i)) {
    return callback(new BadRequestException('Only image (jpg, jpeg, png, gif, svg) or video (mp4, webm, mov) files are allowed!'), false);
  }
  callback(null, true);
};

export const imageFileFilter = (req, file, callback) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/i)) {
    return callback(new BadRequestException('Only image files (jpg, jpeg, png, gif, svg) are allowed!'), false);
  }
  callback(null, true);
};

export const editFileName = (req, file, callback) => {
  const name = file.originalname.split('.')[0];
  const fileExtName = extname(file.originalname);
  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

export const deleteFile = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error(`Error deleting file at ${filePath}:`, err);
  }
};
