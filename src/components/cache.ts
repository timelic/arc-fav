// types.ts
interface CacheEntry {
  base64: string;
  timestamp: number;
}

interface ImageCache {
  [key: string]: CacheEntry;
}

// popup.ts
class ImageCacheManager {
  private readonly CACHE_KEY: string = 'image_cache';
  private readonly CACHE_EXPIRY: number = 24 * 60 * 60 * 1000; // 24小时过期
  private cache: ImageCache | null = null;

  constructor() {
    // 初始化时立即加载缓存
    this.loadCacheFromStorage();
  }

  // 从storage同步加载缓存到内存
  private loadCacheFromStorage(): void {
    chrome.storage.local.get([this.CACHE_KEY], (result) => {
      this.cache = result[this.CACHE_KEY] || {};
    });
  }

  // 同步获取图片，立即返回缓存或原始URL
  public getImage(imageUrl: string): string {
    // 如果缓存未加载完成，返回原始URL
    if (!this.cache) {
      this.cacheImageInBackground(imageUrl);
      return imageUrl;
    }

    const imageData = this.cache[imageUrl];

    // 如果缓存存在且未过期，返回缓存的base64数据
    if (imageData && Date.now() - imageData.timestamp < this.CACHE_EXPIRY) {
      return imageData.base64;
    }

    // 如果缓存不存在或已过期，触发后台缓存并返回原始URL
    this.cacheImageInBackground(imageUrl);
    return imageUrl;
  }

  // 在后台进行图片缓存
  private async cacheImageInBackground(imageUrl: string): Promise<void> {
    try {
      const base64Data = await this.imageToBase64(imageUrl);
      await this.saveImageCache(imageUrl, base64Data);

      // 更新内存中的缓存
      if (this.cache) {
        this.cache[imageUrl] = {
          base64: base64Data,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Background caching failed:', error);
    }
  }

  // 保存图片到缓存
  private async saveImageCache(imageUrl: string, base64Data: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.CACHE_KEY], (result) => {
        const cache: ImageCache = result[this.CACHE_KEY] || {};
        cache[imageUrl] = {
          base64: base64Data,
          timestamp: Date.now()
        };

        chrome.storage.local.set({ [this.CACHE_KEY]: cache }, () => {
          resolve();
        });
      });
    });
  }

  // 将图片转换为Base64
  private async imageToBase64(imageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.onerror = () => reject(new Error(`Failed to fetch image: ${imageUrl}`));
      xhr.open('GET', imageUrl);
      xhr.responseType = 'blob';
      xhr.send();
    });
  }

  // 清理过期缓存
  public async clearExpiredCache(): Promise<void> {
    if (!this.cache) return;

    const now = Date.now();
    let hasChanges = false;

    // 检查并删除过期项
    Object.keys(this.cache).forEach(url => {
      if (now - this.cache![url].timestamp >= this.CACHE_EXPIRY) {
        delete this.cache![url];
        hasChanges = true;
      }
    });

    // 如果有变更，更新存储
    if (hasChanges) {
      await new Promise<void>(resolve => {
        chrome.storage.local.set({ [this.CACHE_KEY]: this.cache }, () => resolve());
      });
    }
  }
}

export const imageCache = new ImageCacheManager();
