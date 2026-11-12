/**
 * Stock photographs (Unsplash) used as DEMO imagery. Replace with the school's own
 * photographs (e.g. via Cloudinary) before going live – see README "Replacing demo content".
 */
const u = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const img = {
  hero: u('1509062522246-3755977927d7', 2000),
  classroom: u('1580582932707-520aed937b7b'),
  handsUp: u('1577896851231-70ef18881754'),
  prePrimary: u('1588072432836-e10032774350'),
  apple: u('1503676260728-1c00da094a0b'),
  primaryWriting: u('1529390079861-591de354faf5'),
  boyWriting: u('1560785496-3c9d27877182'),
  secondary: u('1571260899304-425eee4c7efc'),
  classroom2: u('1567057419565-4349c49d8a04'),
  library: u('1498243691581-b145c3f54a5a'),
  libraryAisle: u('1427504494785-3a9ca7044f45'),
  libraryGlass: u('1564981797816-1043664bf78d'),
  scienceLab: u('1532094349884-543bc11b234d'),
  computerLab: u('1610484826967-09c5720778c7'),
  maths: u('1596495577886-d920f1fb7238'),
  books: u('1497633762265-9d179a990aa6'),
  track: u('1461896836934-ffe607ba8211'),
  football: u('1574629810360-7efbbe195018'),
  yoga: u('1571019613454-1cb2f99b2d8b'),
  auditorium: u('1519452575417-564c1401ecc0'),
  hall: u('1606761568499-6d2451b23c66'),
  graduation: u('1541339907198-e08756dedf3f'),
  colours: u('1503454537195-1dcabb73ffb9'),
  happyKids: u('1488521787991-ed7bbaae773c'),
  backpacks: u('1594608661623-aa0bd3a69d98'),
  laughing: u('1472162072942-cd5147eb3902'),
};

export const thumb = (src: string, w = 600) => src.replace(/w=\d+/, `w=${w}`);

/** CC0 sample clips (MDN) used as DEMO videos. */
export const demoVideos = {
  flower: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  friday: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
};

export const avatar = (name: string, bg = '0B1A33', color = 'D2A845') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=${color}&bold=true&size=128`;
