import * as React from 'react'
import Svg, { Path, Rect } from 'react-native-svg'
import { SystemColors } from '../../shared/tokens'

const Scanner = ({ size = 24, color = SystemColors.PrimaryBlue }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {/* Камера */}
        <Path d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z" fill={color} />
        <Path d="M9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9Z" fill={color} />
        {/* Линии сканера */}
        <Rect x="3" y="7" width="2" height="2" rx="0.5" fill={SystemColors.LightBlue} />
        <Rect x="3" y="11" width="2" height="2" rx="0.5" fill={SystemColors.LightBlue} />
        <Rect x="3" y="15" width="2" height="2" rx="0.5" fill={SystemColors.LightBlue} />
        <Rect x="19" y="7" width="2" height="2" rx="0.5" fill={SystemColors.LightBlue} />
        <Rect x="19" y="11" width="2" height="2" rx="0.5" fill={SystemColors.LightBlue} />
        <Rect x="19" y="15" width="2" height="2" rx="0.5" fill={SystemColors.LightBlue} />
    </Svg>
);

export default Scanner;