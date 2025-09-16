import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text } from 'react-native-svg';

const DefaultProfileIcon = ({ size = 70, initials = 'ПП' }) => {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 70 70" fill="none">
        {/* Фон */}
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="#CCCCCC" />
        
        {/* Голова */}
        <Circle cx={size / 2} cy={size / 4} r={size / 5.83} fill="#FFFFFF" />
        
        {/* Тело */}
        <Path
          d={`M${size / 2} ${size / 1.75} 
               C${size / 5} ${size / 1.75}, 
               ${size / 4.66} ${size / 1.4}, 
               ${size / 4.66} ${size / 1.27} 
               V${size} 
               H${size - size / 4.66} 
               V${size / 1.27} 
               C${size - size / 4.66} ${size / 1.4}, 
               ${size - size / 5} ${size / 1.75}, 
               ${size / 2} ${size / 1.75}Z`}
          fill="#FFFFFF"
        />
        
        {/* Инициалы */}
        <Text
          x={size / 2}
          y={size / 2.33}
          fontFamily="Arial"
          fontSize={size / 3.5}
          fontWeight="bold"
          fill="#666666"
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          {initials}
        </Text>
      </Svg>
    </View>
  );
};

export default DefaultProfileIcon;