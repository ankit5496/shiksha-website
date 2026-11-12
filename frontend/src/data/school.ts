/**
 * School profile.
 *
 * VERIFIED: only the school name and town (Shiksha Public School, Beawar, Rajasthan) were provided by the client.
 * Everything marked `demo: true` (or listed in DEMO_FIELDS) is placeholder content for the presentation and MUST be
 * replaced with information confirmed by the school management before publishing.
 */
export const school = {
  name: 'Shiksha Public School',
  shortName: 'SPS',
  town: 'Beawar',
  state: 'Rajasthan',
  country: 'India',
  tagline: 'Rooted in values. Ready for tomorrow.',
  // ---- DEMO / unverified contact details (clearly marked in the UI) ----
  address: 'Beawar, Rajasthan, India',
  addressNote: 'Exact street address to be confirmed by the school office',
  phone: '+91 00000 00000',
  phoneDisplay: '+91 XXXXX XXXXX (demo)',
  email: 'info@schooldemo.com',
  officeHours: [
    { days: 'Monday – Saturday', time: '8:00 AM – 2:00 PM (demo timings)' },
    { days: 'Sunday & Public Holidays', time: 'Closed' },
  ],
  mapQuery: 'Shiksha Public School, Beawar, Rajasthan',
  /** Approximate town-centre coordinates used for the transport demo (not the verified campus location). */
  coords: { lat: 26.1018, lng: 74.3205 },
  academicYear: '2026-27',
  principal: {
    name: 'Principal (name to be confirmed)',
    title: 'Principal',
  },
  social: { facebook: '#', instagram: '#', youtube: '#' },
};

export const DEMO_NOTICE =
  'Demonstration build: contact details, statistics, names, photographs and records shown here are sample content pending confirmation by the school.';
