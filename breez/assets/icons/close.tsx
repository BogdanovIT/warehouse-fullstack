import * as React from 'react'
import Svg, {Path} from 'react-native-svg'
import { Colors, SystemColors } from '../../shared/tokens'

const CloseIcon = () => (
    <Svg 
        width={24}
        height={24}
        fill="none">
            <Path 
            stroke={SystemColors.VeryLightBlue}
            strokeLinecap='round'
            strokeWidth={1.5}
            d="M19 5 5 19M5 5l14 14"
            />
        </Svg>
)
export default CloseIcon