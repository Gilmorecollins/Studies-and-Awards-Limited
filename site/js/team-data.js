// Team data, used by the Team page AND by the site-wide "Book Free Consultation"
// chooser. Shape (TeamMember):
//   { id, name, role, department, helpsWith, whatsapp, startHere?, shortBio, fullBio: string[], photo, thumb, card, linkedin? }
// photo should be a 4:5 portrait (e.g. 960x1200) for the best crop in the slider.
// thumb is the small square head-and-shoulders portrait (assets/team/thumbs/<id>.jpg,
// used on the Team page's journey stops) and card the 5:4 portrait on the
// "Book Free Consultation" cards (assets/team/cards/<id>.jpg). Both are made from
// the photo by `node tools/make-team-thumbs.mjs`; re-run it if a photo changes.
//
// Consultation chooser: when a visitor clicks any "Book Free Consultation" button
// they pick who to talk to and go straight to that person's WhatsApp.
//   - whatsapp: the person's number, e.g. '0712 345 678' or '+254 712 345 678'
//     (a leading 0 is read as Kenya, +254). Leave it '' and the person is left out
//     of the chooser. Until at least one person has a number, the buttons keep
//     opening an email exactly as before.
//   - department: used for the filter buttons above the list.
//   - helpsWith: one line telling a visitor what to come to this person for.
//   - startHere: true on ONE person to offer them first: their card leads the
//     list with a "Not sure? Start here" tag, for visitors who don't know who to
//     ask. Remove it and everyone is shown in the order below.
//   People are listed in the same order as they appear below (the Team page order).
//   Preview the full chooser (including people with no number yet) by adding
//   ?consultPreview to any page's address.
//
// These are public web pages: use numbers people are happy to have published
// (a work WhatsApp / business line is safer than a personal one).
//
// Bios are drafted from each person's role only — no invented specifics
// (no made-up years of experience, schools, etc.). Swap in real detail
// whenever you have it. Last names and real linkedin URLs are still
// missing for most people — fill those in when ready.
// The order the department filter buttons appear in the consultation chooser
// (front-line first). It sets only the filter buttons, not the order of people.
window.CONSULT_DEPARTMENTS = [
  'Customer Experience',
  'Client Relations',
  'Applications',
  'IELTS & PTE',
  'Compliance & Verification',
  'Administration & Accounts',
  'Operations',
  'Magister Sacco',
  'Masomo Welfare',
  'Management'
];

window.TEAM_MEMBERS = [
  {
    id: 'evelyne-choge',
    name: 'Evelyne Choge',
    role: 'Director',
    department: 'Management',
    helpsWith: 'Partnerships, strategy and anything that needs senior attention.',
    whatsapp: '+254721796500',
    shortBio: 'Evelyne is the Director at Studies and Awards Limited, overseeing the organisation’s strategy and day-to-day operations.',
    fullBio: [
      'Evelyne Choge is the Director at Studies and Awards Limited, based in Eldoret. She sets the direction for how the team supports students across every stage of their study-abroad journey, from the first consultation through to departure.',
      'Evelyne works closely with each department to make sure students get consistent, personal guidance regardless of which destination or counsellor they’re paired with, and stays involved in the partnerships that keep the company’s advice current.'
    ],
    photo: 'assets/team/evelyne-choge.jpg',
    thumb: 'assets/team/thumbs/evelyne-choge.jpg',
    card: 'assets/team/cards/evelyne-choge.jpg',
    linkedin: '#'
  },
  {
    id: 'mourine',
    name: 'Mourine',
    role: 'General Manager',
    department: 'Management',
    helpsWith: 'Day-to-day operations across every destination we support.',
    whatsapp: '+254743449328',
    shortBio: 'Mourine is the General Manager at Studies and Awards Limited, overseeing the team’s day-to-day work across every destination.',
    fullBio: [
      'Mourine is the General Manager at Studies and Awards Limited, overseeing day-to-day operations across every destination the company supports.',
      'She works across departments to keep applications, compliance and client communication running smoothly, so students have one consistent experience from enquiry to enrolment.'
    ],
    photo: 'assets/team/mourine.jpg',
    thumb: 'assets/team/thumbs/mourine.jpg',
    card: 'assets/team/cards/mourine.jpg',
    linkedin: '#'
  },
  {
    id: 'beatrice',
    name: 'Beatrice',
    role: 'Assistant Manager',
    department: 'Management',
    helpsWith: 'Keeping the office and the departments running smoothly for you.',
    whatsapp: '+254729057921',
    shortBio: 'Beatrice is the Assistant Manager at Studies and Awards Limited, supporting the team’s day-to-day operations.',
    fullBio: [
      'Beatrice is the Assistant Manager at Studies and Awards Limited, supporting the day-to-day running of the office and the wider team.',
      'She helps coordinate between departments and keeps things moving for students at every stage of their application.'
    ],
    photo: 'assets/team/beatrice.jpg',
    thumb: 'assets/team/thumbs/beatrice.jpg',
    card: 'assets/team/cards/beatrice.jpg',
    linkedin: '#'
  },
  {
    id: 'joyner',
    name: 'Joyner',
    role: 'Assistant General Manager',
    department: 'Management',
    helpsWith: 'Coordinating the team so nothing is missed on your file.',
    whatsapp: '+254796570026',
    shortBio: 'Joyner is the Assistant General Manager at Studies and Awards Limited, supporting operations across the team.',
    fullBio: [
      'Joyner is the Assistant General Manager at Studies and Awards Limited, supporting the General Manager in coordinating the team’s daily operations.',
      'She helps keep departments like applications, compliance and client relations working together smoothly, so nothing falls through the cracks on a student’s file.'
    ],
    photo: 'assets/team/joyner.jpg',
    thumb: 'assets/team/thumbs/joyner.jpg',
    card: 'assets/team/cards/joyner.jpg',
    linkedin: '#'
  },
  {
    id: 'tebby',
    name: 'Tebby',
    role: 'Administration and Accounts',
    department: 'Administration & Accounts',
    helpsWith: 'Payments, scheduling and other office administration.',
    whatsapp: '+254795907104',
    shortBio: 'Tebby manages administration and accounts at Studies and Awards Limited, keeping the office and finances running smoothly.',
    fullBio: [
      'Tebby handles Administration and Accounts at Studies and Awards Limited, keeping the office running and managing the company’s day-to-day finances.',
      'She’s often the first point of contact for anything administrative, from scheduling to payments, keeping things organised behind the scenes so the counselling team can focus on students.'
    ],
    photo: 'assets/team/tebby.jpg',
    thumb: 'assets/team/thumbs/tebby.jpg',
    card: 'assets/team/cards/tebby.jpg',
    linkedin: '#'
  },
  {
    id: 'witney',
    name: 'Witney',
    role: 'IELTS and PTE Tutor',
    department: 'IELTS & PTE',
    helpsWith: 'Preparing for the IELTS and PTE English tests.',
    whatsapp: '+254719400272',
    shortBio: 'Witney tutors IELTS and PTE at Studies and Awards Limited, preparing students for the language requirements of their destination.',
    fullBio: [
      'Witney is the IELTS and PTE Tutor at Studies and Awards Limited, preparing students for the English-language tests most destinations require before they can enrol.',
      'She works with students individually and in groups, building test-taking skills and confidence so they can meet the score their chosen university or visa needs.'
    ],
    photo: 'assets/team/witney.jpg',
    thumb: 'assets/team/thumbs/witney.jpg',
    card: 'assets/team/cards/witney.jpg',
    linkedin: '#'
  },
  {
    id: 'canisius-yego',
    name: 'Canisius Yego',
    role: 'Compliance and Verification Manager',
    department: 'Compliance & Verification',
    helpsWith: 'Leading the review of your documents so applications go out complete and accurate.',
    whatsapp: '+254746492493',
    shortBio: 'Canisius is the Compliance and Verification Manager at Studies and Awards Limited, making sure every application meets the required standards.',
    fullBio: [
      'Canisius Yego is the Compliance and Verification Manager at Studies and Awards Limited, leading the team that reviews student documentation before it’s submitted to partner institutions and visa authorities.',
      'His focus is on accuracy and accountability: making sure every file is complete, verified and compliant, so students’ applications go out right the first time.'
    ],
    photo: 'assets/team/canisius-yego.jpg',
    thumb: 'assets/team/thumbs/canisius-yego.jpg',
    card: 'assets/team/cards/canisius-yego.jpg',
    linkedin: '#'
  },
  {
    id: 'dennis',
    name: 'Dennis',
    role: 'Compliance and Verification',
    department: 'Compliance & Verification',
    helpsWith: 'Checking your documents before they go to institutions and visa authorities.',
    whatsapp: '+254110652545',
    shortBio: 'Dennis handles compliance and verification at Studies and Awards Limited, making sure every application meets the right standards.',
    fullBio: [
      'Dennis leads Compliance and Verification at Studies and Awards Limited, reviewing student documentation before it’s submitted to partner institutions and visa authorities.',
      'His work is about catching errors and missing paperwork early, so applications go out complete and accurate the first time.'
    ],
    photo: 'assets/team/dennis.jpg',
    thumb: 'assets/team/thumbs/dennis.jpg',
    card: 'assets/team/cards/dennis.jpg',
    linkedin: '#'
  },
  {
    id: 'winnie',
    name: 'Winnie',
    role: 'Application Manager',
    department: 'Applications',
    helpsWith: 'Overseeing how your applications to universities and colleges abroad are prepared and submitted.',
    whatsapp: '+254727842613',
    shortBio: 'Winnie is the Application Manager at Studies and Awards Limited, overseeing how student applications are prepared and submitted.',
    fullBio: [
      'Winnie is the Application Manager at Studies and Awards Limited, overseeing the Applications department and how students’ applications to partner universities and colleges abroad are prepared and submitted.',
      'Working alongside the rest of the team, Winnie helps make sure each application is complete and accurate before it goes out, so students avoid the delays that come from a missing document or a rushed form.'
    ],
    photo: 'assets/team/winnie.jpg',
    thumb: 'assets/team/thumbs/winnie.jpg',
    card: 'assets/team/cards/winnie.jpg',
    linkedin: '#'
  },
  {
    id: 'joy',
    name: 'Joy',
    role: 'Applications',
    department: 'Applications',
    helpsWith: 'Guiding your applications to partner universities and colleges abroad.',
    whatsapp: '+254758496566',
    shortBio: 'Joy handles applications at Studies and Awards Limited, guiding students through their submissions to partner institutions.',
    fullBio: [
      'Joy works on Applications at Studies and Awards Limited, guiding students through their submissions to partner universities and colleges abroad.',
      'She checks each application for completeness and accuracy before it goes out, helping students avoid the delays that come from a missing document or a rushed form.'
    ],
    photo: 'assets/team/joy.jpg',
    thumb: 'assets/team/thumbs/joy.jpg',
    card: 'assets/team/cards/joy.jpg',
    linkedin: '#'
  },
  {
    id: 'ian',
    name: 'Ian',
    role: 'Applications',
    department: 'Applications',
    helpsWith: 'Preparing and submitting your applications to universities and colleges abroad.',
    whatsapp: '+254719648200',
    shortBio: 'Ian works in the Applications department at Studies and Awards Limited, helping students prepare and submit their applications.',
    fullBio: [
      'Ian works in the Applications department at Studies and Awards Limited, helping students prepare and submit their applications to partner universities and colleges abroad.',
      'Ian checks that each application is complete before it goes out, helping students avoid the delays that come from a missing document or a rushed form.'
    ],
    photo: 'assets/team/ian.jpg',
    thumb: 'assets/team/thumbs/ian.jpg',
    card: 'assets/team/cards/ian.jpg',
    linkedin: '#'
  },
  {
    id: 'tina',
    name: 'Tina',
    role: 'Client Relations',
    department: 'Client Relations',
    helpsWith: 'Following up on your application and answering questions as it moves forward.',
    whatsapp: '+254792153303',
    shortBio: 'Tina works in Client Relations at Studies and Awards Limited, staying in touch with students throughout their application.',
    fullBio: [
      'Tina works in Client Relations at Studies and Awards Limited, staying in touch with students throughout their application so they always know what’s happening and what’s next.',
      'She helps bridge the gap between students and the rest of the team, following up on outstanding steps and answering questions as they come up.'
    ],
    photo: 'assets/team/tina.jpg',
    thumb: 'assets/team/thumbs/tina.jpg',
    card: 'assets/team/cards/tina.jpg',
    linkedin: '#'
  },
  {
    id: 'rahab',
    name: 'Rahab Cherono',
    role: 'Customer Experience',
    department: 'Customer Experience',
    helpsWith: 'Your first questions about studying abroad, and what to do next.',
    whatsapp: '+254792376637',
    startHere: true,
    shortBio: 'Rahab looks after Customer Experience at Studies and Awards Limited, making sure every student’s journey with us feels supported.',
    fullBio: [
      'Rahab Cherono looks after Customer Experience at Studies and Awards Limited, making sure every student who reaches out gets a clear, timely response.',
      'She helps students find their footing at the start of the process and stays a familiar point of contact as their application moves forward.'
    ],
    photo: 'assets/team/rahab.jpg',
    thumb: 'assets/team/thumbs/rahab.jpg',
    card: 'assets/team/cards/rahab.jpg',
    linkedin: '#'
  },
  {
    id: 'talaam',
    name: 'Talaam',
    role: 'Magister Sacco',
    department: 'Magister Sacco',
    helpsWith: 'Questions about Magister Sacco.',
    whatsapp: '+254707248824',
    shortBio: 'Talaam works in the Magister Sacco department at Studies and Awards Limited.',
    fullBio: [
      'Talaam works in the Magister Sacco department at Studies and Awards Limited.',
      'If you have a question about Magister Sacco, Talaam is the person to ask.'
    ],
    photo: 'assets/team/talaam.jpg',
    thumb: 'assets/team/thumbs/talaam.jpg',
    card: 'assets/team/cards/talaam.jpg',
    linkedin: '#'
  },
  {
    id: 'collins',
    name: 'Collins',
    role: 'Masomo Welfare',
    department: 'Masomo Welfare',
    helpsWith: 'Support for your wellbeing as you prepare for a move abroad.',
    whatsapp: '+254702138691',
    shortBio: 'Collins works on Masomo Welfare at Studies and Awards Limited, supporting students’ wellbeing throughout their studies.',
    fullBio: [
      'Collins works on Masomo Welfare at Studies and Awards Limited, supporting students’ wellbeing throughout their time working with the company.',
      'He checks in with students beyond the paperwork, making sure they feel supported as they prepare for a major move abroad.'
    ],
    photo: 'assets/team/collins.jpg',
    thumb: 'assets/team/thumbs/collins.jpg',
    card: 'assets/team/cards/collins.jpg',
    linkedin: '#'
  },
  {
    id: 'bethwel',
    name: 'Bethwel',
    role: 'Operations',
    department: 'Operations',
    helpsWith: 'Keeping the day-to-day running of the office and student processes on track.',
    whatsapp: '+254725505825',
    shortBio: 'Bethwel works in Operations at Studies and Awards Limited, helping keep the team’s day-to-day work running smoothly.',
    fullBio: [
      'Bethwel works in Operations at Studies and Awards Limited, helping keep the company’s day-to-day work running smoothly.',
      'Behind the scenes, Bethwel supports the departments students deal with directly, so the process from first enquiry to enrolment stays organised.'
    ],
    photo: 'assets/team/bethwel.jpg',
    thumb: 'assets/team/thumbs/bethwel.jpg',
    card: 'assets/team/cards/bethwel.jpg',
    linkedin: '#'
  }
];
