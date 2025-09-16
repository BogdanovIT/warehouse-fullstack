import * as React from 'react'
import Svg, {Path} from 'react-native-svg'
import { SystemColors } from '../../shared/tokens'

const HomePage = () => (

<Svg width="24" height="24" viewBox="0 0 48 48">
    <Path fill="none" stroke={SystemColors.VeryLightBlue} strokeWidth = {2.5}
    stroke-linecap="round" stroke-linejoin="round" d="M4.5 11.5a3 3 0 0 1 3-3h8.718a4 4 0 0 1 2.325.745l4.914 3.51a4 4 0 0 0 2.325.745H40.5a3 3 0 0 1 3 3v20a3 3 0 0 1-3 3h-33a3 3 0 0 1-3-3z"></Path>
    <Path fill="none" stroke={SystemColors.VeryLightBlue} strokeWidth = {2.5} stroke-linecap="round" stroke-linejoin="round" d="M19.529 24.971V32.5h8.942v-7.529m1.852 1.852L24 20.5l-6.323 6.323">
    </Path>
    </Svg>)

export default HomePage