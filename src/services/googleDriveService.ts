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
      parents: existingFileId ? undefined : ['appDataFolder'],
    };

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const contentType = 'application/json';
    const metadataPart = JSON.stringify(metadata);
    const contentPart = JSON.stringify(content);

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      metadataPart +
      delimiter +
      'Content-Type: ' + contentType + '\r\n\r\n' +
      contentPart +
      close_delim;

    const url = existingFileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const method = existingFileId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Drive save error response:', errorText);
      throw new Error(`Drive save failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  },
};
