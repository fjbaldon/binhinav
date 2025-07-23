import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the optimal zoom and position to fit two points within the viewport.
 * @param kioskCoords - The {x, y} coordinates of the kiosk.
 * @param placeCoords - The {x, y} coordinates of the destination place.
 * @param viewSize - The {width, height} of the map viewport.
 * @param padding - The amount of padding (in pixels) to leave around the bounds.
 * @returns An object with { x, y, scale } for the map transform.
 */
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

  // Calculate the required scale to fit the bounds into the view
  const scaleX = viewSize.width / (boundsWidth + padding * 2);
  const scaleY = viewSize.height / (boundsHeight + padding * 2);
  const scale = Math.min(scaleX, scaleY, 1.5); // Cap max zoom at 1.5x

  // Calculate the center of the bounds
  const centerX = bounds.minX + boundsWidth / 2;
  const centerY = bounds.minY + boundsHeight / 2;

  // Calculate the required position to center the bounds in the view
  const positionX = (viewSize.width / 2) - (centerX * scale);
  const positionY = (viewSize.height / 2) - (centerY * scale);

  return { x: positionX, y: positionY, scale };
}
