/**
 * Google Drive Service
 * 
 * This service handles saving and loading the user's data directly into 
 * their personal Google Drive "App Data" folder.
 */

const FILE_NAME = 'expense_tracker_backup.json';

export const googleDriveService = {
  async findFile(accessToken: string) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${FILE_NAME}' and spaces='appDataFolder'&fields=files(id, name)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
  },

  async getFileContent(accessToken: string, fileId: string) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    if (!response.ok) return null;
    return await response.json();
  },

  async saveFile(accessToken: string, content: any, existingFileId?: string) {
    const metadata = {
      name: FILE_NAME,
      parents: ['appDataFolder'],
    };

    const formData = new FormData();
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append(
      'file',
      new Blob([JSON.stringify(content)], { type: 'application/json' })
    );

    const url = existingFileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const method = existingFileId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    return await response.json();
  },
};
