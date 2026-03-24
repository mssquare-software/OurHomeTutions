import { useColorScheme } from "./use-color-scheme";
import { AuroraTheme } from "@/theme/aurora";

export function useColor(
  colorName: "text" | "textMuted" | "background",
  props?: { light?: string; dark?: string }
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props?.[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    if (colorName === "text") return AuroraTheme.colors.text.primary;
    if (colorName === "textMuted") return AuroraTheme.colors.text.secondary;
    return AuroraTheme.colors.surface.background;
  }
}
