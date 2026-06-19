/// <reference types="vite/client" />
import type { FirestoreIdeApi } from '@shared/types/api';

declare global {
  interface Window {
    /** Bridge exposed by the preload script. */
    api: FirestoreIdeApi;
  }
}
