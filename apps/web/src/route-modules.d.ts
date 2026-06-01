declare module '*.jsx' {
  const routeModule: any;
  export default routeModule;
}

declare module '*.js' {
  const routeModule: any;
  export default routeModule;
}

declare module 'virtual:load-fonts.jsx' {
  export function LoadFonts(): null;
}
