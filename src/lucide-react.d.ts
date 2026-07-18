declare module 'lucide-react' {
  import type { FC, SVGProps } from 'react'
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string
    absoluteStrokeWidth?: boolean
  }
  export type Icon = FC<IconProps>
  export const Key: Icon
  export const Github: Icon
  export const ChevronRight: Icon
  export const RefreshCw: Icon
  export const Folder: Icon
  export const File: Icon
  export const FileText: Icon
  export const Plus: Icon
  export const ArrowLeft: Icon
  export const Save: Icon
  export const Settings: Icon
  export const LogOut: Icon
  export const Sun: Icon
  export const Moon: Icon
  export const AlertTriangle: Icon
  export const Check: Icon
  export const X: Icon
  export const MoreHorizontal: Icon
  export const Search: Icon
  export const Clock: Icon
  export const Bold: Icon
  export const Italic: Icon
  export const Strikethrough: Icon
  export const Heading: Icon
  export const Quote: Icon
  export const Code: Icon
  export const List: Icon
  export const Link: Icon
  export const Image: Icon
  export const Table: Icon
  export const Trash2: Icon
  export const FileEdit: Icon
}
