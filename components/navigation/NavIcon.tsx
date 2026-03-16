import React from 'react';
import { View } from 'react-native';
import { SvgUri } from 'react-native-svg';

interface NavIconProps {
  active: boolean;
  activeIcon: string;
  inactiveIcon: string;
  size?: number;
}

export const NavIcon: React.FC<NavIconProps> = ({
  active,
  activeIcon,
  inactiveIcon,
  size = 24,
}) => {
  return (
    <View style={{ width: size, height: size }}>
      <SvgUri
        width={size}
        height={size}
        uri={active ? activeIcon : inactiveIcon}
      />
    </View>
  );
};