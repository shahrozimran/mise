// Palette supplied by the user. Keep surfaces and text roles consistent.
export const palette = {
  midnight: "#06141B",
  navy: "#11212D",
  slate: "#253745",
  steel: "#4A5C6A",
  mist: "#9BA8AB",
  silver: "#CCD0CF",
} as const;
export const colors = {
  bg: palette.midnight,
  paper: palette.navy,
  pale: palette.slate,
  line: palette.slate,
  soft: palette.steel,
  ink: palette.silver,
  muted: palette.mist,
  accent: palette.silver,
  secondary: palette.mist,
  onAccent: palette.midnight,
  coral: palette.mist,
  blue: palette.silver,
  gold: palette.mist,
  error: palette.silver,
};
