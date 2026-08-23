import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.padelleboxd.app",
  appName: "PadelleBoxd",
  webDir: "public",
  server: {
    url: "https://padelle-boxd.vercel.app",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#09090b",
  },
  ios: {
    backgroundColor: "#09090b",
  },
};

export default config;
