// Team data, used by the Team page AND by the site-wide "Book Free Consultation"
// chooser. Shape (TeamMember):
//   { id, name, role, department, helpsWith, whatsapp, destinations?, startHere?, shortBio, fullBio: string[], photo, thumb, card, linkedin? }
// photo should be a 4:5 portrait (e.g. 960x1200) for the best crop in the slider.
// thumb is the small square head-and-shoulders portrait (assets/team/thumbs/<id>.jpg,
// used in the Team page's department sections) and card the 5:4 portrait on the
// "Book Free Consultation" cards (assets/team/cards/<id>.jpg). Both are made from
// the photo by `node tools/make-team-thumbs.mjs`; re-run it if a photo changes.
//
// Departments: the Team page shows a section for each department, in the order
// its people first appear below, so keep each department's people together.
// The same names are used by the chooser's filter buttons and by the About
// page's "Inside Studies & Awards" mosaic (a tile per department in
// about.html, one square per person, laid out in styles.css): a new or renamed
// department needs its tile there too.
//
// Consultation chooser: when a visitor clicks any "Book Free Consultation" button
// they pick who to talk to and go straight to that person's WhatsApp.
//   - whatsapp: the person's number, e.g. '0712 345 678' or '+254 712 345 678'
//     (a leading 0 is read as Kenya, +254). Leave it '' and the person is left out
//     of the chooser. Until at least one person has a number, the buttons keep
//     opening an email exactly as before.
//   - department: used for the Team page's sections and the chooser's filter
//     buttons.
//   - helpsWith: one line telling a visitor what to come to this person for.
//   - destinations: the countries this person looks after, e.g. ['Germany'].
//     When someone books from that country's page, they're listed first with a
//     "Best for Germany" tag. Use the country name exactly as on the site.
//   - startHere: true on ONE person to offer them first: their card leads the
//     list with a "Not sure? Start here" tag, for visitors who don't know who to
//     ask. Remove it and everyone is shown in the order below.
//   - photo, thumb, card: leave them '' until a person's photo arrives; a plain
//     silhouette is shown in the meantime. Then add the photo, add their row in
//     tools/make-team-thumbs.mjs and run it.
//   People are listed in the same order as they appear below (the Team page order).
//   Preview the full chooser (including people with no number yet) by adding
//   ?consultPreview to any page's address.
//
// These are public web pages: use numbers people are happy to have published
// (a work WhatsApp / business line is safer than a personal one).
//
// Bios are drafted from each person's role only, no invented specifics
// (no made-up years of experience, schools, etc.). Swap in real detail
// whenever you have it. Last names and real linkedin URLs are still
// missing for most people, fill those in when ready.
// The order the department filter buttons appear in the consultation chooser
// (front-line first). It sets only the filter buttons, not the order of people.
window.CONSULT_DEPARTMENTS = [
  'Customer Experience',
  'Application Team',
  'Language Preparation',
  'Documentation',
  'Verification & Compliance',
  'Visa',
  'GSR',
  'Administration',
  'Accounts',
  'Director’s PA Team',
  'Director'
];

window.TEAM_MEMBERS = [
  {
    id: 'evelyne-choge',
    name: 'Evelyne Choge',
    role: 'Director',
    department: 'Director',
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
    id: 'tina',
    name: 'Tina',
    role: 'Personal Assistant to the Director',
    department: 'Director’s PA Team',
    helpsWith: 'Reaching the Director, and following up on her behalf.',
    whatsapp: '+254792153303',
    shortBio: 'Tina is the Personal Assistant to the Director at Studies and Awards Limited, supporting the Director’s day-to-day work.',
    fullBio: [
      'Tina is the Personal Assistant to the Director at Studies and Awards Limited, working closely with the Director on her day-to-day work.',
      'If you need to reach the Director, or to follow up on something she is handling, Tina is the person to ask.'
    ],
    photo: 'assets/team/tina.jpg',
    thumb: 'assets/team/thumbs/tina.jpg',
    card: 'assets/team/cards/tina.jpg',
    linkedin: '#'
  },
  {
    id: 'winnie',
    name: 'Winnie',
    role: 'Application Manager',
    department: 'Application Team',
    helpsWith: 'Overseeing how your applications to universities and colleges abroad are prepared and submitted.',
    whatsapp: '+254727842613',
    shortBio: 'Winnie is the Application Manager at Studies and Awards Limited, overseeing how student applications are prepared and submitted.',
    fullBio: [
      'Winnie is the Application Manager at Studies and Awards Limited, leading the Application Team and overseeing how students’ applications to partner universities and colleges abroad are prepared and submitted.',
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
    department: 'Application Team',
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
    role: 'GTE Preparation and Assessments',
    department: 'Application Team',
    helpsWith: 'Meeting the conditions on your offer letter, and the documents a school asks for before approving you.',
    whatsapp: '+254719648200',
    shortBio: 'Ian works in the Application Team at Studies and Awards Limited, making sure students meet their school’s GTE requirements and the conditions on their offer.',
    fullBio: [
      'Ian works in the Application Team at Studies and Awards Limited, looking after GTE preparation and assessments: the documents a school needs before it approves a student.',
      'Once a student has an offer, Ian makes sure every condition on it is met, works with the GSR team when the school asks for a statement of purpose, and sends everything back to the school.'
    ],
    photo: 'assets/team/ian.jpg',
    thumb: 'assets/team/thumbs/ian.jpg',
    card: 'assets/team/cards/ian.jpg',
    linkedin: '#'
  },
  {
    id: 'rahab',
    name: 'Rahab Cherono',
    role: 'Documentation',
    department: 'Documentation',
    helpsWith: 'Preparing and organising the documents your application needs.',
    whatsapp: '+254792376637',
    shortBio: 'Rahab looks after Documentation at Studies and Awards Limited, helping students get their documents ready for their applications.',
    fullBio: [
      'Rahab Cherono looks after Documentation at Studies and Awards Limited, helping students prepare and organise the documents their applications need.',
      'She works with students to make sure their files are complete, so their applications are ready to move forward.'
    ],
    photo: 'assets/team/rahab.jpg',
    thumb: 'assets/team/thumbs/rahab.jpg',
    card: 'assets/team/cards/rahab.jpg',
    linkedin: '#'
  },
  {
    id: 'canisius-yego',
    name: 'Canisius Yego',
    role: 'Compliance and Verification Manager',
    department: 'Verification & Compliance',
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
    department: 'Verification & Compliance',
    helpsWith: 'Checking your documents before they go to institutions and visa authorities.',
    whatsapp: '+254110652545',
    shortBio: 'Dennis handles compliance and verification at Studies and Awards Limited, making sure every application meets the right standards.',
    fullBio: [
      'Dennis works in Verification and Compliance at Studies and Awards Limited, reviewing student documentation before it’s submitted to partner institutions and visa authorities.',
      'His work is about catching errors and missing paperwork early, so applications go out complete and accurate the first time.'
    ],
    photo: 'assets/team/dennis.jpg',
    thumb: 'assets/team/thumbs/dennis.jpg',
    card: 'assets/team/cards/dennis.jpg',
    linkedin: '#'
  },
  {
    id: 'mourine',
    name: 'Mourine',
    role: 'General Manager',
    department: 'Visa',
    helpsWith: 'Your visa application, and the day-to-day running of the team.',
    whatsapp: '+254743449328',
    shortBio: 'Mourine is the General Manager at Studies and Awards Limited and works in the Visa department, overseeing the team’s day-to-day work.',
    fullBio: [
      'Mourine is the General Manager at Studies and Awards Limited, overseeing day-to-day operations across every destination the company supports.',
      'She also works in the Visa department, guiding students through their visa applications, and works across departments to keep applications, compliance and client communication running smoothly.'
    ],
    photo: 'assets/team/mourine.jpg',
    thumb: 'assets/team/thumbs/mourine.jpg',
    card: 'assets/team/cards/mourine.jpg',
    linkedin: '#'
  },
  {
    id: 'joyner',
    name: 'Joyner',
    role: 'Assistant General Manager',
    department: 'Visa',
    helpsWith: 'Your visa application, and making sure nothing is missed on your file.',
    whatsapp: '+254796570026',
    shortBio: 'Joyner is the Assistant General Manager at Studies and Awards Limited and works in the Visa department, supporting operations across the team.',
    fullBio: [
      'Joyner is the Assistant General Manager at Studies and Awards Limited, supporting the General Manager in coordinating the team’s daily operations.',
      'She also works in the Visa department, guiding students through their visa applications, and helps keep the departments working together so nothing falls through the cracks on a student’s file.'
    ],
    photo: 'assets/team/joyner.jpg',
    thumb: 'assets/team/thumbs/joyner.jpg',
    card: 'assets/team/cards/joyner.jpg',
    linkedin: '#'
  },
  {
    id: 'beatrice',
    name: 'Beatrice',
    role: 'Assistant Manager',
    department: 'GSR',
    helpsWith: 'The GSR part of your application, and keeping the office running smoothly.',
    whatsapp: '+254729057921',
    shortBio: 'Beatrice is the Assistant Manager at Studies and Awards Limited and works in the GSR department.',
    fullBio: [
      'Beatrice is the Assistant Manager at Studies and Awards Limited, supporting the day-to-day running of the office and the wider team.',
      'She also works in the GSR department, helping students with this part of their application.'
    ],
    photo: 'assets/team/beatrice.jpg',
    thumb: 'assets/team/thumbs/beatrice.jpg',
    card: 'assets/team/cards/beatrice.jpg',
    linkedin: '#'
  },
  {
    id: 'tebby',
    name: 'Tebby',
    role: 'Accounts and Human Resources',
    department: 'Accounts',
    helpsWith: 'Payments, fees and other accounts questions.',
    whatsapp: '+254795907104',
    shortBio: 'Tebby handles Accounts and Human Resources at Studies and Awards Limited, keeping the company’s finances and staff matters in order.',
    fullBio: [
      'Tebby handles Accounts and Human Resources at Studies and Awards Limited, managing the company’s day-to-day finances and looking after staff matters.',
      'For students, she is the person to ask about payments and fees, keeping things organised behind the scenes so the counselling team can focus on students.'
    ],
    photo: 'assets/team/tebby.jpg',
    thumb: 'assets/team/thumbs/tebby.jpg',
    card: 'assets/team/cards/tebby.jpg',
    linkedin: '#'
  },
  {
    id: 'collins',
    name: 'Collins',
    role: 'Masomo Welfare',
    department: 'Administration',
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
    id: 'talaam',
    name: 'John Talaam',
    role: 'Magister Sacco',
    department: 'Administration',
    helpsWith: 'Questions about Magister Sacco, and financial support for school fees.',
    whatsapp: '+254707248824',
    shortBio: 'John Talaam works in Administration at Studies and Awards Limited, looking after Magister Sacco.',
    fullBio: [
      'John Talaam works in the Administration department at Studies and Awards Limited, looking after Magister Sacco.',
      'If you have a question about Magister Sacco, John is the person to ask.'
    ],
    photo: 'assets/team/talaam.jpg',
    thumb: 'assets/team/thumbs/talaam.jpg',
    card: 'assets/team/cards/talaam.jpg',
    linkedin: '#'
  },
  {
    id: 'bethwel',
    name: 'Bethwel',
    role: 'Operations',
    department: 'Administration',
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
  },
  {
    id: 'witney',
    name: 'Witney',
    role: 'IELTS and PTE Tutor',
    department: 'Language Preparation',
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
    id: 'karen',
    name: 'Karen',
    role: 'German Language Tutor',
    department: 'Language Preparation',
    helpsWith: 'Learning German, and guidance on studying in Germany.',
    destinations: ['Germany'],
    whatsapp: '+254737173516',
    shortBio: 'Karen is the German Language Tutor at Studies and Awards Limited, and also guides students who are considering Germany as a destination.',
    fullBio: [
      'Karen is the German Language Tutor at Studies and Awards Limited, teaching German to students who are preparing to study in Germany.',
      'She also guides students on Germany as a destination, so she is the person to ask about studying there as well as about learning the language.'
    ],
    photo: 'assets/team/karen.jpg',
    thumb: 'assets/team/thumbs/karen.jpg',
    card: 'assets/team/cards/karen.jpg',
    linkedin: '#'
  },
  {
    id: 'miki',
    name: 'Mike',
    role: 'Client Relations',
    department: 'Customer Experience',
    helpsWith: 'Your first point of contact at our office, who will point you to the right person.',
    whatsapp: '+254143505796',
    startHere: true,
    shortBio: 'Mike is in Client Relations at Studies and Awards Limited, the first person students and visitors meet when they get in touch.',
    fullBio: [
      'Mike works in Client Relations at Studies and Awards Limited in Eldoret, and is the first point of contact for students and visitors who walk in or reach out.',
      'He finds out what each person needs and directs them to the right member of the team, so nobody is left wondering who to ask.'
    ],
    photo: 'assets/team/miki.jpg',
    thumb: 'assets/team/thumbs/miki.jpg',
    card: 'assets/team/cards/miki.jpg',
    linkedin: '#'
  }
];
