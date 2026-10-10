import type { ImgHTMLAttributes } from 'react'
import { useTheme } from '../lib/theme'

interface PictureProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** glowing on a transparent background, for the dark theme */
  dark: string
  /** the same picture lit for a white page */
  light: string
}

/** A picture that has one version per theme. Both have transparent backgrounds. */
export function Picture({ dark, light, ...rest }: PictureProps) {
  return <img src={useTheme() === 'dark' ? dark : light} {...rest} />
}
