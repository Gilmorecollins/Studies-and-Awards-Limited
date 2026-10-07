// One testimonial card, as it looks on the home page: a simple white card with
// the person on top (their photo or initials, name and who they are, and a
// quote mark) and their words under it. Used by the home page's testimonials
// (main.js) and by the preview in the admin page (admin.js), so the two always
// match.
//
//   TestimonialCard.build(t, average) -> an <li class="testi-card">
//     t: { name, quote, detail?, story?, rating?, photo?, sample? }
//     average: not shown on the card any more (ratings are still saved in the
//       admin page); the argument is kept so callers needn't change
//   TestimonialCard.average(list) -> the average of the ratings in `list`,
//     or null with fewer than two (one rating is not an average)
//   TestimonialCard.initials(name) -> "WK" for "Wanjiru Kamau"
(function () {
  'use strict';

  var MARK = '<svg class="testi-mark" viewBox="0 0 27 19" width="34" height="24" aria-hidden="true"><path d="M1.5 12.5C1.5 7 5 3 10.5 1.5l.7 2.1C8 4.8 6 6 5.6 7.2a5.5 5.5 0 1 1-4.1 5.3z"/><path d="M15.5 12.5C15.5 7 19 3 24.5 1.5l.7 2.1C22 4.8 20 6 19.6 7.2a5.5 5.5 0 1 1-4.1 5.3z"/></svg>';

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  // a score out of 5 (from 1); anything else is left out
  function ratingOf(t) {
    var r = typeof t.rating === 'number' ? t.rating : parseFloat(t.rating);
    return r >= 1 && r <= 5 ? r : null;
  }

  function initials(name) {
    var words = String(name).trim().split(/\s+/);
    var last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
    return (words[0].charAt(0) + last).toUpperCase();
  }

  function average(list) {
    var rated = [];
    list.forEach(function (t) {
      var r = ratingOf(t);
      if (r !== null) rated.push(r);
    });
    return rated.length > 1 ? rated.reduce(function (a, b) { return a + b; }, 0) / rated.length : null;
  }

  function build(t) {
    var card = el('li', 'testi-card');
    if (t.sample) card.appendChild(el('span', 'testi-sample', 'Sample: preview only'));

    // who they are, and a quote mark
    var person = el('div', 'testi-person');
    var avatar = el('span', 'testi-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    if (t.photo) {
      var img = document.createElement('img');
      img.src = t.photo;
      img.alt = '';
      img.width = 48;
      img.height = 48;
      img.loading = 'lazy';
      img.decoding = 'async';
      avatar.appendChild(img);
    } else {
      avatar.textContent = initials(t.name);
    }
    person.appendChild(avatar);
    var who = el('div', 'testi-who');
    who.appendChild(el('p', 'testi-name', t.name));
    if (t.detail) who.appendChild(el('p', 'testi-detail', t.detail));
    person.appendChild(who);
    person.insertAdjacentHTML('beforeend', MARK);
    card.appendChild(person);

    // their words
    var quote = el('blockquote', 'testi-quote');
    quote.appendChild(el('p', 'testi-quote-lead', t.quote));
    if (t.story) quote.appendChild(el('p', 'testi-quote-more', t.story));
    card.appendChild(quote);

    return card;
  }

  window.TestimonialCard = { build: build, average: average, initials: initials };
})();
