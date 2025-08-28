// lib/client/image-client.ts
'use client';

import { getImageUrl, ImageType } from "./actions/iamge.actions";

// Client-side function to get image URL
export async function getClientImageUrl(
  targetId: number, 
  imageType: ImageType

) {
  try {
    const result = await getImageUrl(targetId, imageType);
    if (result.success) {
      return result.imageUrl;
    }
    return null;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return null;
  }
}