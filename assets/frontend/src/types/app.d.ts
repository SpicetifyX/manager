export type AppManifest = {
  name: string;
  icon: string;
  activeIcon: string;
  subfiles: string[];
  subfiles_extension: string[];
  imageURL?: string;
};

export type AppInfo = {
  id: string;
  isEnabled: boolean;
} & AppManifest;
