// SAMPLE testimonials, for reviewing the layout of the home page's
// "Testimonials" section. Real testimonials are NOT added here: they are added
// and switched on in the admin page (admin/index.html), which keeps them in the
// Supabase database.
//
// These samples show only when no real testimonials are switched on, and only
// on your own copy of the site (a file, or localhost) or with
// ?testimonialsPreview in the address, each tagged "Sample: preview only".
// Visitors on the live site never see them, so they can stay.
//
// Shape (the same fields as the admin page's form):
//   { quote: '…', story: '…', name: 'A. Wanjiru', detail: 'Student, Australia, 2026',
//     photo: 'assets/…/photo.jpg', rating: 5 }
// - quote: their words, shown large (a sentence or two reads best)
// - story: optional, more of their words, shown smaller under the quote
// - detail: optional, who they are, shown under their name
// - photo: optional, a square photo, shown round; without one, their initials
// - rating: optional, the score out of 5 (4.5 is fine), shown on their card;
//   with two or more ratings, beside the average of them all
window.TESTIMONIALS = [
  { sample: true, quote: 'Every step was explained clearly, so I always knew what to do next.', story: 'From choosing a course to booking my visa appointment, I was kept up to date and every question I had was answered.', name: 'A. Student', detail: 'Student, Germany', rating: 5 },
  { sample: true, quote: 'The team was quick to reply and patient with all of our questions.', story: 'As parents we wanted to understand the costs and the timeline, and they took the time to walk us through both.', name: 'B. Parent', detail: 'Parent, Australia', rating: 4.5 },
  { sample: true, quote: 'I felt supported from my first consultation right up to my departure.', name: 'C. Student', detail: 'Student, Canada', rating: 5 }
];
