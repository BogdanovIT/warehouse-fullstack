import * as React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { SystemColors } from '../../shared/tokens'

const Employees = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    {/* Человек 1 (центр) */}
    <Circle cx="12" cy="7" r="3" fill={SystemColors.VeryLightBlue} />
    <Path 
      d="M12 12c-3.3 0-6 2.7-6 6v1h12v-1c0-3.3-2.7-6-6-6z" 
      fill={SystemColors.VeryLightBlue} 
    />
    {/* Человек 2 (слева) */}
    <Circle cx="6" cy="10" r="2.5" fill={SystemColors.VeryLightBlue} opacity="0.7" />
    <Path 
      d="M6 14c-2.5 0-4.5 2-4.5 4.5v.5h5.5" 
      fill={SystemColors.VeryLightBlue} 
      opacity="0.7"
    />
    {/* Человек 3 (справа) */}
    <Circle cx="18" cy="10" r="2.5" fill={SystemColors.VeryLightBlue} opacity="0.7" />
    <Path 
      d="M18 14c2.5 0 4.5 2 4.5 4.5v.5H17" 
      fill={SystemColors.VeryLightBlue} 
      opacity="0.7"
    />
  </Svg>
)

export default Employees