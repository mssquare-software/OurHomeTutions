import { useColor } from '@/hooks/useColor';
import { AuroraTheme } from '@/theme/aurora';
import React, { forwardRef } from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  TextStyle,
} from 'react-native';

type TextVariant =
  | 'body'
  | 'title'
  | 'subtitle'
  | 'caption'
  | 'heading'
  | 'link';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  lightColor?: string;
  darkColor?: string;
  children: React.ReactNode;
}

export const Text = forwardRef<RNText, TextProps>(
  (
    { variant = 'body', lightColor, darkColor, style, children, ...props },
    ref
  ) => {
    const textColor = useColor('text', { light: lightColor, dark: darkColor });
    const mutedColor = useColor('textMuted');

    const getTextStyle = (): TextStyle => {
      const baseStyle: TextStyle = {
        color: textColor,
        fontFamily: AuroraTheme.typography.fontFamily.body,
      };

      switch (variant) {
        case 'heading':
          return {
            ...baseStyle,
            fontSize: AuroraTheme.typography.scale.h2.size,
            fontWeight: AuroraTheme.typography.scale.h2.weight as any,
          };
        case 'title':
          return {
            ...baseStyle,
            fontSize: AuroraTheme.typography.scale.h3.size,
            fontWeight: AuroraTheme.typography.scale.h3.weight as any,
          };
        case 'subtitle':
          return {
            ...baseStyle,
            fontSize: AuroraTheme.typography.scale.bodyLarge.size,
            fontWeight: AuroraTheme.typography.scale.bodyLarge.weight as any,
          };
        case 'caption':
          return {
            ...baseStyle,
            fontSize: AuroraTheme.typography.scale.caption.size,
            fontWeight: AuroraTheme.typography.scale.caption.weight as any,
            color: mutedColor,
          };
        case 'link':
          return {
            ...baseStyle,
            fontSize: AuroraTheme.typography.scale.button.size,
            fontWeight: AuroraTheme.typography.scale.button.weight as any,
            textDecorationLine: 'underline',
          };
        default: // 'body'
          return {
            ...baseStyle,
            fontSize: AuroraTheme.typography.scale.bodyBase.size,
            fontWeight: AuroraTheme.typography.scale.bodyBase.weight as any,
          };
      }
    };

    return (
      <RNText ref={ref} style={[getTextStyle(), style]} {...props}>
        {children}
      </RNText>
    );
  }
);
