import { IconType } from "react-icons";

export const iconLibrary: Record<string, IconType> = {};

export type IconLibrary = typeof iconLibrary;
export type IconName = keyof IconLibrary;
