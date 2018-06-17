const full = `
  _                                _
 | |_   _  _   _ _    _ _    ___  | |      _ _    ___  __ __ __
 |  _| | || | | ' \\  | ' \\  / -_) | |  _  | ' \\  / _ \\ \\ V  V /
  \\__|  \\_,_| |_||_| |_||_| \\___| |_| (_) |_||_| \\___/  \\_/\\_/
`;

const compact = '  tunnel.now';

module.exports = () => console.log(
  process.stdout.columns < 65
    ? compact
    : full
);
