import SvgIcon from "@mui/material/SvgIcon";

export const DYNAMAX_COLOR = "#ec4899";

// Crossed-blades mark, modelled on Pokemon GO's Dynamax symbol
export default function DynamaxIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M3 3l7.2 9L3 21h3.6l5.4-6.75L17.4 21H21l-7.2-9L21 3h-3.6L12 9.75 6.6 3z" />
    </SvgIcon>
  );
}
