import Svg, { Path, Circle } from "react-native-svg";
import { Colors, SystemColors } from "../../shared/tokens";

const EyeOpenIconReg = () => (
  <Svg
    width={24}
    height={24}
    fill="none"
    viewBox="0 0 24 24"
  >
    {/* Контур глаза */}
    <Path
      stroke={SystemColors.PrimaryBlue}
      strokeWidth={1.5}
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
    />
    {/* Зрачок (круг) */}
    <Circle
      cx={12}
      cy={12}
      r={3}
      stroke={SystemColors.PrimaryBlue}
      strokeWidth={1.5}
    />
  </Svg>
);

export default EyeOpenIconReg;