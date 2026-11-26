import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "app.larder700",
  appName: "Healthy Dinners",
  webDir: "out",
  android: {
    allowMixedContent: false,
  },
  server: {
    androidScheme: "https",
  },
}

export default config
