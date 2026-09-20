// Team data. Shape (TeamMember):
//   { id, name, role, shortBio, fullBio: string[], photo, linkedin? }
// photo should be a 4:5 portrait (e.g. 960x1200) for the best crop in the slider.
//
// Bios are drafted from each person's role only — no invented specifics
// (no made-up years of experience, schools, etc.). Swap in real detail
// whenever you have it. Last names and real linkedin URLs are still
// missing for most people — fill those in when ready.
window.TEAM_MEMBERS = [
  {
    id: 'evelyne-choge',
    name: 'Evelyne Choge',
    role: 'Director',
    shortBio: 'Evelyne is the Director at Studies and Awards Limited, overseeing the organisation’s strategy and day-to-day operations.',
    fullBio: [
      'Evelyne Choge is the Director at Studies and Awards Limited, based in Eldoret. She sets the direction for how the team supports students across every stage of their study-abroad journey, from the first consultation through to departure.',
      'Evelyne works closely with each department to make sure students get consistent, personal guidance regardless of which destination or counsellor they’re paired with, and stays involved in the partnerships that keep the company’s advice current.'
    ],
    photo: 'assets/team/evelyne-choge.jpg',
    linkedin: '#'
  },
  {
    id: 'mourine',
    name: 'Mourine',
    role: 'General Manager',
    shortBio: 'Mourine is the General Manager at Studies and Awards Limited, overseeing the team’s day-to-day work across every destination.',
    fullBio: [
      'Mourine is the General Manager at Studies and Awards Limited, overseeing day-to-day operations across every destination the company supports.',
      'She works across departments to keep applications, compliance and client communication running smoothly, so students have one consistent experience from enquiry to enrolment.'
    ],
    photo: 'assets/team/mourine.jpg',
    linkedin: '#'
  },
  {
    id: 'joyner',
    name: 'Joyner',
    role: 'Assistant General Manager',
    shortBio: 'Joyner is the Assistant General Manager at Studies and Awards Limited, supporting operations across the team.',
    fullBio: [
      'Joyner is the Assistant General Manager at Studies and Awards Limited, supporting the General Manager in coordinating the team’s daily operations.',
      'She helps keep the different departments — applications, compliance, client relations — working together smoothly, so nothing falls through the cracks on a student’s file.'
    ],
    photo: 'assets/team/joyner.jpg',
    linkedin: '#'
  },
  {
    id: 'beatrice',
    name: 'Beatrice',
    role: 'Assistant Manager',
    shortBio: 'Beatrice is the Assistant Manager at Studies and Awards Limited, supporting the team’s day-to-day operations.',
    fullBio: [
      'Beatrice is the Assistant Manager at Studies and Awards Limited, supporting the day-to-day running of the office and the wider team.',
      'She helps coordinate between departments and keeps things moving for students at every stage of their application.'
    ],
    photo: 'assets/team/beatrice.jpg',
    linkedin: '#'
  },
  {
    id: 'canisius-yego',
    name: 'Canisius Yego',
    role: 'Compliance and Verification Manager',
    shortBio: 'Canisius is the Compliance and Verification Manager at Studies and Awards Limited, making sure every application meets the required standards.',
    fullBio: [
      'Canisius Yego is the Compliance and Verification Manager at Studies and Awards Limited, leading the team that reviews student documentation before it’s submitted to partner institutions and visa authorities.',
      'His focus is on accuracy and accountability: making sure every file is complete, verified and compliant, so students’ applications go out right the first time.'
    ],
    photo: 'assets/team/canisius-yego.jpg',
    linkedin: '#'
  },
  {
    id: 'dennis',
    name: 'Dennis',
    role: 'Compliance and Verification',
    shortBio: 'Dennis handles compliance and verification at Studies and Awards Limited, making sure every application meets the right standards.',
    fullBio: [
      'Dennis leads Compliance and Verification at Studies and Awards Limited, reviewing student documentation before it’s submitted to partner institutions and visa authorities.',
      'His work is about catching errors and missing paperwork early, so applications go out complete and accurate the first time.'
    ],
    photo: 'assets/team/dennis.jpg',
    linkedin: '#'
  },
  {
    id: 'tebby',
    name: 'Tebby',
    role: 'Administration and Accounts',
    shortBio: 'Tebby manages administration and accounts at Studies and Awards Limited, keeping the office and finances running smoothly.',
    fullBio: [
      'Tebby handles Administration and Accounts at Studies and Awards Limited, keeping the office running and managing the company’s day-to-day finances.',
      'She’s often the first point of contact for anything administrative, from scheduling to payments, keeping things organised behind the scenes so the counselling team can focus on students.'
    ],
    photo: 'assets/team/tebby.jpg',
    linkedin: '#'
  },
  {
    id: 'witney',
    name: 'Witney',
    role: 'IELTS and PTE Tutor',
    shortBio: 'Witney tutors IELTS and PTE at Studies and Awards Limited, preparing students for the language requirements of their destination.',
    fullBio: [
      'Witney is the IELTS and PTE Tutor at Studies and Awards Limited, preparing students for the English-language tests most destinations require before they can enrol.',
      'She works with students individually and in groups, building test-taking skills and confidence so they can meet the score their chosen university or visa needs.'
    ],
    photo: 'assets/team/witney.jpg',
    linkedin: '#'
  },
  {
    id: 'joy',
    name: 'Joy',
    role: 'Applications',
    shortBio: 'Joy handles applications at Studies and Awards Limited, guiding students through their submissions to partner institutions.',
    fullBio: [
      'Joy works on Applications at Studies and Awards Limited, guiding students through their submissions to partner universities and colleges abroad.',
      'She checks each application for completeness and accuracy before it goes out, helping students avoid the delays that come from a missing document or a rushed form.'
    ],
    photo: 'assets/team/joy.jpg',
    linkedin: '#'
  },
  {
    id: 'rahab',
    name: 'Rahab Cherono',
    role: 'Customer Experience',
    shortBio: 'Rahab looks after Customer Experience at Studies and Awards Limited, making sure every student’s journey with us feels supported.',
    fullBio: [
      'Rahab Cherono looks after Customer Experience at Studies and Awards Limited, making sure every student who reaches out gets a clear, timely response.',
      'She helps students find their footing at the start of the process and stays a familiar point of contact as their application moves forward.'
    ],
    photo: 'assets/team/rahab.jpg',
    linkedin: '#'
  },
  {
    id: 'tina',
    name: 'Tina',
    role: 'Client Relations',
    shortBio: 'Tina works in Client Relations at Studies and Awards Limited, staying in touch with students throughout their application.',
    fullBio: [
      'Tina works in Client Relations at Studies and Awards Limited, staying in touch with students throughout their application so they always know what’s happening and what’s next.',
      'She helps bridge the gap between students and the rest of the team, following up on outstanding steps and answering questions as they come up.'
    ],
    photo: 'assets/team/tina.jpg',
    linkedin: '#'
  },
  {
    id: 'collins',
    name: 'Collins',
    role: 'Masomo Welfare',
    shortBio: 'Collins works on Masomo Welfare at Studies and Awards Limited, supporting students’ wellbeing throughout their studies.',
    fullBio: [
      'Collins works on Masomo Welfare at Studies and Awards Limited, supporting students’ wellbeing throughout their time working with the company.',
      'He checks in with students beyond the paperwork, making sure they feel supported as they prepare for a major move abroad.'
    ],
    photo: 'assets/team/collins.jpg',
    linkedin: '#'
  }
];
