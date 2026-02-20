declare global {
  interface Window {
    Marketplace: Record<string, unknown>;
  }
}

export type TabItemConfig = {
  name: string;
  enabled: boolean;
};

export type SortBoxOption = {
  key: string;
  value: string;
};

export type RepoTopic = "spicetify-extensions" | "spicetify-themes" | "spicetify-apps";

export type TabType = "Extensions" | "Themes" | "Snippets" | "Apps" | "Installed";

export type ResetCategory = "extensions" | "snippets" | "theme";

export type CardType = "extension" | "theme" | "snippet" | "app";

export type RepoType = "extension" | "theme" | "app";

export type Author = {
  name: string;
  url: string;
};

export type Snippet = {
  title: string;
  description: string;
  code: string;
  preview?: string;
  imageURL?: string;
  manifest: undefined;
  subtitle: undefined;
  authors: undefined;
  user: undefined;
  repo: undefined;
  branch: undefined;
  archived: undefined;
  extensionURL: undefined;
  readmeURL: undefined;
  stars: undefined;
  tags: undefined;
  cssURL: undefined;
  schemesURL: undefined;
  include: undefined;
  lastUpdated: undefined;
  created: undefined;
};

export type Manifest = {
  name: string;
  description: string;
  main: string;
  authors: Author[];
  preview: string;
  readme: string;
  tags?: string[];
  usercss?: string;
  schemes?: string[];
  include?: string[];
};

export type CardItem = {
  manifest: Manifest;
  title: string;
  subtitle: string;
  authors: Author[];
  installed?: boolean;
  user: string;
  repo: string;
  branch: string;
  archived: boolean;
  imageURL: string;
  extensionURL: string;
  readmeURL: string;
  tags: string[];
  lastUpdated: string;
  created: string;
  name: string;
  stargazers_count: number;
  cssURL?: string;
  schemesURL?: string;
  include?: string[];
  code: undefined;
  description: undefined;
};

export type VisualConfig = {
  stars: boolean;
  tags: boolean;
  showArchived: boolean;
  hideInstalled: boolean;
  colorShift: boolean;
  themeDevTools: boolean;
  albumArtBasedColors: boolean;
  albumArtBasedColorsMode: "monochromeLight" | "monochromeDark" | "quad" | "triad" | "analogic" | "analogicComplement";
  albumArtBasedColorsVibrancy: "DESATURATED" | "LIGHT_VIBRANT" | "PROMINENT" | "VIBRANT";
  type: boolean;
  followers: boolean;
};

export type ColourScheme = {
  [key: string]: string;
};

export type SchemeIni = {
  [key: string]: ColourScheme;
};

export type SortMode = "a-z" | "z-a" | "newest" | "oldest" | "stars" | "lastUpdated" | "mostStale";

export type Config = {
  visual: VisualConfig;
  tabs: TabItemConfig[];
  activeTab: string;
  theme: {
    activeThemeKey?: string;
    schemes?: SchemeIni;
    activeScheme?: string | null;
  };
  sort: SortMode;
};
