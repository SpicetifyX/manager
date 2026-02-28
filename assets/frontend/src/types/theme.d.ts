export type ThemeManifestEntry = {
  name: string;
  description: string;
  usercss?: string;
  schemes?: string[];
  include?: string[];
  preview?: string;
  imageURL?: string;
  authors?: { name: string; url?: string }[];
  tags?: string[];
};

export type ThemeInfo = {
  id: string;
  isActive: boolean;
  isBundled?: boolean;
  colorSchemes?: string[];
  activeColorScheme?: string;
} & ThemeManifestEntry;
