import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDrivePreviewUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // Robust regex to extract ID from various Drive URL formats (standard ID length is ~33 chars)
  const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/) || 
                  url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
  
  const fileId = idMatch ? idMatch[1] : null;
  
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return url;
}

export function getVideoEmbedUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // YouTube detection
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?origin=http://localhost:3000&enablejsapi=1&rel=0`;
  }

  // Google Drive detection
  const driveIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]{25,})/) || 
                       url.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
  
  const fileId = driveIdMatch ? driveIdMatch[1] : null;
  
  if (fileId) {
    // /preview format as requested
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  
  return url;
}
