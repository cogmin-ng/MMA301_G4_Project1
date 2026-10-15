import { API_BASE_URL } from './api-config';
import { Platform } from 'react-native';

export const uploadService = {
  /**
   * Chuyển đổi Web File / Blob sang chuỗi Base64 Data URL trên máy khách
   * @param {File | Blob} file
   * @returns {Promise<string>}
   */
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      if (typeof FileReader === 'undefined') {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Xử lý ảnh tải lên từ Web File object hoặc FormData để lưu trực tiếp vào CSDL
   * @param {File | Blob | FormData} fileData
   * @returns {Promise<string>} Chuỗi Base64 Data URL của ảnh
   */
  async uploadFile(fileData) {
    try {
      // 1. Nếu là Web File / Blob trên trình duyệt, chuyển đổi trực tiếp sang Base64
      if (typeof File !== 'undefined' && (fileData instanceof File || fileData instanceof Blob)) {
        const base64Url = await this.fileToBase64(fileData);
        if (base64Url) return base64Url;
      }

      // 2. Nếu là FormData hoặc môi trường khác, gửi lên backend để xử lý trong RAM
      const formData = new FormData();
      if (fileData instanceof FormData) {
        const response = await fetch(`${API_BASE_URL}/upload`, {
          method: 'POST',
          body: fileData,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Lỗi xử lý ảnh');
        }
        return data.url;
      }

      formData.append('file', fileData);
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi xử lý ảnh');
      }

      return data.url;
    } catch (err) {
      console.error('uploadService error:', err);
      throw err;
    }
  },

  /**
   * Xử lý chuỗi Base64 để lưu vào Database
   * @param {string} base64
   * @returns {Promise<string>}
   */
  async uploadBase64(base64) {
    try {
      if (!base64) return '';
      if (base64.startsWith('data:image/')) {
        return base64;
      }

      const response = await fetch(`${API_BASE_URL}/upload/base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64 }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Lỗi xử lý Base64');
      }

      return data.url;
    } catch (err) {
      console.error('uploadService base64 error:', err);
      throw err;
    }
  },
};
