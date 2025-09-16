import * as React from 'react'
import Svg, {Path} from 'react-native-svg'
import { Colors, SystemColors } from '../../shared/tokens'

const EnterOutline = () => (
<Svg 
width="24" height="24" 
viewBox="0 0 512 512">
    <Path fill="none" stroke={SystemColors.VeryLightBlue} strokeLinecap="round" 
    strokeLinejoin="round" strokeWidth="32" 
    d="M176 176v-40a40 40 0 0 1 40-40h208a40 40 0 0 1 40 40v240a40 40 0 0 1-40 40H216a40 40 0 0 1-40-40v-40">
    </Path>
    <Path fill="none" stroke={SystemColors.VeryLightBlue} strokeLinecap="round" 
    strokeLinejoin="round" strokeWidth="32" 
    d="m272 336l80-80l-80-80M48 256h288">
    </Path>
</Svg>
)
export default EnterOutline