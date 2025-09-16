import * as React from 'react'
import Svg, {Path} from 'react-native-svg'
import { Colors, SystemColors } from '../../shared/tokens'

const EyeClosedIconReg = () => (
    <Svg
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
  >
    <Path
      stroke={SystemColors.PrimaryBlue}  // Если нужна заливка, поменяй на fill
      strokeWidth={1.5}  // Толщина линии (если stroke)
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
    />
    <Path
      stroke={SystemColors.PrimaryBlue}
      strokeWidth={1.5}
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
    <Path
      stroke={SystemColors.PrimaryBlue}
      strokeWidth={1.5}
      strokeLinecap="round"
      d="M18 6l-12 12"  // Диагональная линия (перечёркивание глаза)
    />
  </Svg>
)
export default EyeClosedIconReg