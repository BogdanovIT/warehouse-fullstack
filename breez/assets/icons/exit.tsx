import * as React from 'react'
import Svg, {Path} from 'react-native-svg'
import { Colors, SystemColors } from '../../shared/tokens';

const ExitOutline = () => (
<Svg  
width="24" 
height="24" 
viewBox="0 0 512 512">
    <Path fill="none" stroke={SystemColors.VeryLightBlue} strokeLinecap="round" strokeLinejoin="round" 
    strokeWidth="32" 
    d="M320 176v-40a40 40 0 0 0-40-40H88a40 40 0 0 0-40 40v240a40 40 0 0 0 40 40h192a40 40 0 0 0 40-40v-40m64-160l80 80l-80 80m-193-80h273">
    </Path>
    </Svg>
);
export default ExitOutline
