import { google } from "googleapis";

const googleEmail = import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const googleKey = import.meta.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;

if (!googleEmail || !googleKey) {
  console.error("❌ ERROR: Google Drive environment variables missing!");
}

const auth = new google.auth.JWT({
  email: googleEmail,
  key: googleKey ? googleKey.replace(/\\n/g, "\n") : undefined,
  scopes: ["https://www.googleapis.com/auth/drive.readonly"],
});

const drive = google.drive({ version: "v3", auth });
const ROOT_ID = import.meta.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

export interface DriveItem {
  id: string;
  name: string;
  mimeType?: string;
  webContentLink?: string;
}

// --- MEKANISME CACHE SEDERHANA ---
const CACHE = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 Jam

function getCachedData(key: string) {
  const cached = CACHE.get(key);
  if (cached && cached.expiry > Date.now()) {
    console.log(`[DRIVE CACHE] Hit: ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  CACHE.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

export async function getFolders(parentId: string): Promise<DriveItem[]> {
  const cacheKey = `folders_${parentId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  const res = await drive.files.list({
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id, name)",
    orderBy: "name desc",
  });
  
  const folders = (res.data.files as DriveItem[]) || [];
  setCachedData(cacheKey, folders);
  return folders;
}

export async function getMediaFiles(
  folderId: string,
  pageToken?: string | null,
  limit: number = 4,
): Promise<{ files: DriveItem[]; nextPageToken: string | null }> {
  const cacheKey = `media_${folderId}_${pageToken || 'first'}_${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, webContentLink)",
      pageSize: limit,
      pageToken: pageToken || undefined,
    });

    const result = {
      files: (response.data.files as DriveItem[]) || [],
      nextPageToken: response.data.nextPageToken || null,
    };
    
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Error fetching media files:", error);
    throw error;
  }
}

/**
 * Mengambil foto terbaru secara global (diurutkan berdasarkan waktu pembuatan)
 */
export async function getLatestMedia(limit: number = 4): Promise<DriveItem[]> {
  const cacheKey = `latest_media_${limit}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const res = await drive.files.list({
      // Mencari semua file gambar yang tidak ada di sampah
      q: "mimeType contains 'image/' and trashed = false",
      fields: "files(id, name, webContentLink)",
      orderBy: "createdTime desc",
      pageSize: limit,
    });
    
    const files = (res.data.files as DriveItem[]) || [];
    setCachedData(cacheKey, files);
    return files;
  } catch (error) {
    console.error("Error fetching latest media:", error);
    return [];
  }
}

export async function getArchiveNavigation(
  yearId?: string | null,
  monthId?: string | null,
  activityId?: string | null,
): Promise<{ data: DriveItem[]; view: string; baseUrl: string }> {
  try {
    let data: DriveItem[] = [];
    let view = "years";
    let baseUrl = "?yearId=";

    if (activityId) {
      view = "files";
      return { data: [], view, baseUrl: "" };
    }

    if (monthId && yearId) {
      data = await getFolders(monthId);
      view = "activities";
      baseUrl = `?yearId=${yearId}&monthId=${monthId}&activityId=`;
    } else if (yearId) {
      data = await getFolders(yearId);
      view = "months";
      baseUrl = `?yearId=${yearId}&monthId=`;
    } else {
      data = await getFolders(ROOT_ID);
      view = "years";
      baseUrl = "?yearId=";
    }

    return { data, view, baseUrl };
  } catch (error) {
    console.error("Fungsi getArchiveNavigation Error:", error);
    throw new Error("Gagal mengambil struktur arsip.");
  }
}
