declare module "*.css";
declare module "*.scss";
declare module "*.sass";

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
  App: React.ComponentClass<any>;
}
interface Pluggable {
  (): PluggableEntry;
}
