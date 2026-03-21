import { randomInt } from "crypto";

export class StringUtil {
  static capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  static capitalizeEachWord(str: string): string {
    if (!str) return '';
    return str.split(' ').map(StringUtil.capitalizeFirstLetter).join(' ');
  }

  static truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
  }

  static createSlug(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  static formatPhoneNumberUS(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (!match) return null;
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length <= 1) return '';
    return parts.pop()!.toLowerCase();
  }

  static formatLargeNumber(num: number): string {
    const absNum = Math.abs(num);
    if (absNum >= 1_000_000_000_000_000) return (num / 1_000_000_000_000_000).toFixed(2) + 'Qa';
    if (absNum >= 1_000_000_000_000) return (num / 1_000_000_000_000).toFixed(2) + 'T';
    if (absNum >= 1_000_000_000) return (num / 1_000_000_000).toFixed(2) + 'B';
    if (absNum >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M';
    if (absNum >= 1_000) return (num / 1_000).toFixed(2) + 'K';
    return num.toString();
  }

  static formatBytesToReadable(bytes: number, decimals = 2): string {
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) return 'Invalid';
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const value = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals));

    return `${value} ${sizes[i]}`;
  }

  static formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    return `${days > 0 ? `${days}g ` : ''}${hours}s ${minutes}dk`;
  }

  static sanitizeFileName = (name: string): string => {
    return name
      .normalize("NFKD")                  // UTF-8 normalize
      .replace(/[\u0300-\u036f]/g, "")    // aksanlı karakterleri temizle
      .replace(/[^a-zA-Z0-9.-]/g, "-")    // güvenli olmayan karakterleri '-' ile değiştir
      .replace(/-+/g, "-")                // ardışık '-' birleştir
      .replace(/^-|-$/g, "");             // baştaki ve sondaki '-' sil
  };

  static normalizeTR = (input: string) => {
    return input
      .trim()
      .toLocaleLowerCase("tr-TR")
      .normalize("NFC");
  }

  static toSlugTR = (input: string) => {
    return this.normalizeTR(input)
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/\s+/g, "-");
  }

  static generateRandomString = (length = 15): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = randomInt(0, charset.length);
      result += charset[randomIndex];
    }

    return result;
  }
}