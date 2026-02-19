export namespace main {
	
	export class AuthorInfo {
	    name: string;
	    url?: string;
	
	    static createFrom(source: any = {}) {
	        return new AuthorInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.url = source["url"];
	    }
	}
	export class AddonInfo {
	    name: string;
	    description: string;
	    preview?: string;
	    main: string;
	    id: string;
	    addonFileName: string;
	    isEnabled: boolean;
	    authors?: AuthorInfo[];
	    tags?: string[];
	    imageURL?: string;
	
	    static createFrom(source: any = {}) {
	        return new AddonInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.preview = source["preview"];
	        this.main = source["main"];
	        this.id = source["id"];
	        this.addonFileName = source["addonFileName"];
	        this.isEnabled = source["isEnabled"];
	        this.authors = this.convertValues(source["authors"], AuthorInfo);
	        this.tags = source["tags"];
	        this.imageURL = source["imageURL"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AppInfo {
	    name: string;
	    icon: string;
	    activeIcon: string;
	    subfiles: string[];
	    subfiles_extension: string[];
	    id: string;
	    isEnabled: boolean;
	    imageURL?: string;
	
	    static createFrom(source: any = {}) {
	        return new AppInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.icon = source["icon"];
	        this.activeIcon = source["activeIcon"];
	        this.subfiles = source["subfiles"];
	        this.subfiles_extension = source["subfiles_extension"];
	        this.id = source["id"];
	        this.isEnabled = source["isEnabled"];
	        this.imageURL = source["imageURL"];
	    }
	}
	export class AppSettings {
	    discordRpc: boolean;
	    closeToTray: boolean;
	    checkUpdatesOnLaunch: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.discordRpc = source["discordRpc"];
	        this.closeToTray = source["closeToTray"];
	        this.checkUpdatesOnLaunch = source["checkUpdatesOnLaunch"];
	    }
	}
	
	export class InstallStatus {
	    spotify: boolean;
	    spicetify: boolean;
	    patched: boolean;
	
	    static createFrom(source: any = {}) {
	        return new InstallStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.spotify = source["spotify"];
	        this.spicetify = source["spicetify"];
	        this.patched = source["patched"];
	    }
	}
	export class MarketplaceMeta {
	    name: string;
	    description?: string;
	    imageURL?: string;
	    authors?: AuthorInfo[];
	    tags?: string[];
	    stars?: number;
	
	    static createFrom(source: any = {}) {
	        return new MarketplaceMeta(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.imageURL = source["imageURL"];
	        this.authors = this.convertValues(source["authors"], AuthorInfo);
	        this.tags = source["tags"];
	        this.stars = source["stars"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ThemeInfo {
	    name: string;
	    description: string;
	    usercss?: string;
	    schemes?: string[];
	    preview?: string;
	    authors?: AuthorInfo[];
	    tags?: string[];
	    id: string;
	    isActive: boolean;
	    isBundled: boolean;
	    colorSchemes?: string[];
	    activeColorScheme?: string;
	    imageURL?: string;
	
	    static createFrom(source: any = {}) {
	        return new ThemeInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.description = source["description"];
	        this.usercss = source["usercss"];
	        this.schemes = source["schemes"];
	        this.preview = source["preview"];
	        this.authors = this.convertValues(source["authors"], AuthorInfo);
	        this.tags = source["tags"];
	        this.id = source["id"];
	        this.isActive = source["isActive"];
	        this.isBundled = source["isBundled"];
	        this.colorSchemes = source["colorSchemes"];
	        this.activeColorScheme = source["activeColorScheme"];
	        this.imageURL = source["imageURL"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

