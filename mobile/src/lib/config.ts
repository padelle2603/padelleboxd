const envUrl = (process.env.EXPO_PUBLIC_API_URL ?? '') as string;

export const API_URL = envUrl.replace(/\/+$/, '') || 'https://padelle-boxd.vercel.app';