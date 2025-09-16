import * as React from 'react'
import { Svg, Rect} from 'react-native-svg'
import { SystemColors } from '../../shared/tokens'
const MenuIcon = () => (
    <Svg
        width={26}
        height={24}
        fill='none'
        viewBox='0 0 26 24'
        >
    <Rect width={10} height={1.65} x={4.96} y={4} fill={SystemColors.VeryLightBlue} rx={0.825} />
    <Rect width={16} height={1.65} x={4.96} y={8.65} fill={SystemColors.VeryLightBlue} rx={0.825} />
    <Rect width={12} height={1.65} x={4.96} y={13.3} fill={SystemColors.VeryLightBlue} rx={0.825} />
    <Rect width={16} height={1.65} x={4.96} y={17.95} fill={SystemColors.VeryLightBlue} rx={0.825} />
    </Svg>
)
export default MenuIcon