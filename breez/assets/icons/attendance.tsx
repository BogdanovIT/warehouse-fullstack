import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import { SystemColors } from '../../shared/tokens'

const Attendance = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24">
    {/* Основание песочных часов сверху */}
    <Path 
      fill={SystemColors.VeryLightBlue} 
      d="M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4V2z"
    />
    {/* Линия по центру (перешеек часов) */}
    <Path 
      fill={SystemColors.VeryLightBlue} 
      d="M8 12h8v2H8z"
    />
    {/* Календарный листок снизу */}
    <Path 
      fill={SystemColors.VeryLightBlue} 
      d="M8 20h8v-3H8v3z"
    />
  </Svg>
)

export default Attendance