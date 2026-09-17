import SvgIcon from "@mui/material/SvgIcon";

export const SHADOW_COLOR = "#a855f7";

// Flame mark, for Team GO Rocket's Shadow Pokemon
export default function ShadowIcon(props) {
  return (
    <SvgIcon {...props}>
      <path d="M13.5 1.5c.6 3-1 4.6-2.6 6.2C9.2 9.4 7.5 11.1 7.5 14a6 6 0 0 0 12 0c0-3.4-2.1-5.6-3.6-7.3-1-1.2-1.8-2.2-2.4-5.2zM9.8 14.9c0-1.6.9-2.7 1.8-3.6.7.9 1.6 1.9 1.6 3.2 0 .8.6 1.5 1.4 1.5.5 0 .9-.2 1.2-.6.5.6.8 1.3.8 2.1a3.4 3.4 0 0 1-6.8 0c0-.9 0-1.8 0-2.6z" />
      <path d="M6 3.2c.3 1.6-.5 2.4-1.3 3.2C3.9 7.2 3 8.1 3 9.6a3 3 0 0 0 6 0c0-1.8-1.1-2.9-1.8-3.8-.5-.6-.9-1.1-1.2-2.6z" opacity=".55" />
    </SvgIcon>
  );
}
