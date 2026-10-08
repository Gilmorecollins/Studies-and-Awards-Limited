// One testimonial card, as it looks on the home page. Used by the home page's
// testimonials (main.js) and by the preview in the admin page (admin.js), so
// the two always match.
//
//   TestimonialCard.build(t, average) -> an <li class="testi-card">
//     t: { name, quote, detail?, story?, rating?, photo?, sample? }
//     average: from TestimonialCard.average(list), or null
//   TestimonialCard.average(list) -> the average of the ratings in `list`,
//     or null with fewer than two (one rating is not an average)
//   TestimonialCard.initials(name) -> "WK" for "Wanjiru Kamau"
(function () {
  'use strict';

  var STAR = '<svg class="testi-star" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9z"/></svg>';
  var MARK = '<svg class="testi-mark" viewBox="0 0 27 19" width="44" height="31" aria-hidden="true"><path d="M1.5 12.5C1.5 7 5 3 10.5 1.5l.7 2.1C8 4.8 6 6 5.6 7.2a5.5 5.5 0 1 1-4.1 5.3z"/><path d="M15.5 12.5C15.5 7 19 3 24.5 1.5l.7 2.1C22 4.8 20 6 19.6 7.2a5.5 5.5 0 1 1-4.1 5.3z"/></svg>';

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

  // 5 -> "5.0", 4.5 -> "4.5", 4.8333 -> "4.83"
  function score(r) {
    return (Math.round(r * 100) / 100).toFixed(2).replace(/0$/, '');
  }

  function initials(name) {
    var words = String(name).trim().split(/\s+/);
    var last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
    return (words[0].charAt(0) + last).toUpperCase();
  }

  // "Wanjiru's rating", or "A. Wanjiru's rating" when the first name is only an initial
  function ratingLabel(name) {
    var first = String(name).trim().split(/\s+/)[0];
    return (first.length > 1 && first.indexOf('.') === -1 ? first : name) + '’s rating';
  }

  function scoreBlock(className, value, label, star) {
    var block = el('div', className);
    var num = el('p', 'testi-score-num');
    if (star) num.innerHTML = STAR;
    num.appendChild(document.createTextNode(value));
    num.appendChild(el('span', 'sr-only', ' out of 5'));
    block.appendChild(num);
    block.appendChild(el('p', 'testi-score-label', label));
    return block;
  }

  function average(list) {
    var rated = [];
    list.forEach(function (t) {
      var r = ratingOf(t);
      if (r !== null) rated.push(r);
    });
    return rated.length > 1 ? rated.reduce(function (a, b) { return a + b; }, 0) / rated.length : null;
  }

  function build(t, avg) {
    var card = el('li', 'testi-card');
    if (t.sample) card.appendChild(el('span', 'testi-sample', 'Sample: preview only'));

    // who they are
    var person = el('div', 'testi-person');
    var avatar = el('span', 'testi-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    if (t.photo) {
      var img = document.createElement('img');
      img.src = t.photo;
      img.alt = '';
      img.width = 64;
      img.height = 64;
      img.loading = 'lazy';
      img.decoding = 'async';
      avatar.appendChild(img);
    } else {
      avatar.textContent = initials(t.name);
    }
    person.appendChild(avatar);
    var who = el('div', 'testi-who');
    who.appendChild(el('p', 'testi-name', 'Meet ' + t.name));
    if (t.detail) who.appendChild(el('p', 'testi-detail', t.detail));
    person.appendChild(who);
    card.appendChild(person);

    // their rating, pressed in, beside the average
    var own = ratingOf(t);
    if (own !== null) {
      var scores = el('div', 'testi-score');
      if (avg != null) scores.appendChild(scoreBlock('testi-score-avg', score(avg), 'Average', false));
      scores.appendChild(scoreBlock('testi-score-own', score(own), ratingLabel(t.name), true));
      card.appendChild(scores);
    }

    // their words
    var quote = el('blockquote', 'testi-quote');
    quote.insertAdjacentHTML('beforeend', MARK);
    quote.appendChild(el('p', 'testi-quote-lead', t.quote));
    if (t.story) quote.appendChild(el('p', 'testi-quote-more', t.story));
    card.appendChild(quote);

    return card;
  }

  window.TestimonialCard = { build: build, average: average, initials: initials };
})();
