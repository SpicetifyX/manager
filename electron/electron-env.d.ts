/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    APP_ROOT: string;
    APP_PATH: string;
    VITE_PUBLIC: string;
  }
}
