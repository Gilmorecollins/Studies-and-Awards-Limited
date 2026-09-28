// Feedback shown in the "Testimonials" section of the home page: a card for
// each person, in this order.
//
// BEFORE YOU DEPLOY: the three entries below are SAMPLES (marked `sample: true`)
// so the layout can be reviewed. Replace them with real quotes. Sample entries
// only ever appear on your own copy of the site (a file, or localhost), never on
// a real website address, and `node tools/generate-countries.mjs --check` will
// refuse to pass once the site address (SITE_URL) is set while any sample
// remains.
//
// A real quote is a person's own words, published with their agreement, under
// a name they are happy to use. Shape:
//   { quote: '…', story: '…', name: 'A. Wanjiru', detail: 'Student, Australia, 2026',
//     photo: 'assets/testimonials/a-wanjiru.jpg', rating: 5 }
// - quote: their words, shown large (a sentence or two reads best)
// - story: optional, more of their words, shown smaller under the quote
// - detail: optional, who they are, shown under their name
// - photo: optional, a square photo (at least 144 x 144 pixels), shown round,
//   used only with their agreement; without one, their initials show instead
// - rating: optional, the score they gave out of 5 (4.5 is fine), shown on
//   their card; with two or more ratings, beside the average of them all.
// (Leave `sample` out for a real quote.)
window.TESTIMONIALS = [
  { sample: true, quote: 'Every step was explained clearly, so I always knew what to do next.', story: 'From choosing a course to booking my visa appointment, I was kept up to date and every question I had was answered.', name: 'A. Student', detail: 'Student, Germany', rating: 5 },
  { sample: true, quote: 'The team was quick to reply and patient with all of our questions.', story: 'As parents we wanted to understand the costs and the timeline, and they took the time to walk us through both.', name: 'B. Parent', detail: 'Parent, Australia', rating: 4.5 },
  { sample: true, quote: 'I felt supported from my first consultation right up to my departure.', name: 'C. Student', detail: 'Student, Canada', rating: 5 }
];
