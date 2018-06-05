declare module "*.css";
declare module "*.scss";
declare module "*.sass";

declare module "*.ico";
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.gif";
declare module "*.svg";
declare module "*.eot";
declare module "*.ttf";
declare module "*.woff";
declare module "*.woff2";


declare module "gaikan";


interface DomainMap {
  [domain: string]: string;
}

// Pluggable interfaces:
interface PluggableEntry {
  App: React.ReactType;
}
interface Pluggable {
  (): PluggableEntry;
}

declare var APP: string;
declare var INITIAL_STATE: {};

declare interface Window {
  __REDUX_DEVTOOLS_EXTENSION__: any;
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
}

declare namespace NodeJS {
  interface Global {
  }
}
