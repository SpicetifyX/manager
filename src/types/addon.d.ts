export type AddonManifest = {
  name: string;
  description: string;
  preview?: string;
  main: string;
  readme?: string;
  authors?: { name: string; url?: string }[];
  tags?: string[];
};

export type AddonInfo = {
  id: string;
  addonFileName: string;
  isEnabled: boolean;
} & AddonManifest;
