import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTransformForBounds(
  kioskCoords: { x: number; y: number },
  placeCoords: { x: number; y: number },
  viewSize: { width: number; height: number },
  padding: number = 100
) {
  const bounds = {
    minX: Math.min(kioskCoords.x, placeCoords.x),
    maxX: Math.max(kioskCoords.x, placeCoords.x),
    minY: Math.min(kioskCoords.y, placeCoords.y),
    maxY: Math.max(kioskCoords.y, placeCoords.y),
  };

  const boundsWidth = bounds.maxX - bounds.minX;
  const boundsHeight = bounds.maxY - bounds.minY;

  const scaleX = viewSize.width / (boundsWidth + padding * 2);
  const scaleY = viewSize.height / (boundsHeight + padding * 2);
  const scale = Math.min(scaleX, scaleY, 1.5); // Cap max zoom at 1.5x

  const centerX = bounds.minX + boundsWidth / 2;
  const centerY = bounds.minY + boundsHeight / 2;

  const positionX = (viewSize.width / 2) - (centerX * scale);
  const positionY = (viewSize.height / 2) - (centerY * scale);

  return { x: positionX, y: positionY, scale };
}
