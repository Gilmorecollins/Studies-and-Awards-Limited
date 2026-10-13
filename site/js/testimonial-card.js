// One testimonial card, as it looks on the home page (the stack of stories). Used by the home page's
// testimonials (main.js) and by the preview in the admin page (admin.js), so
// the two always match.
//
//   TestimonialCard.build(t) -> an <li class="testi-card">
//     t: { name, quote, detail?, story?, rating?, photo?, sample? }
//   TestimonialCard.average(list) -> the average of the ratings in `list`,
//     or null with fewer than two (one rating is not an average)
//   TestimonialCard.initials(name) -> "WK" for "Wanjiru Kamau"
(function () {
  'use strict';

  var STAR = '<svg class="testi-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
  var STAR_OFF = STAR.replace('class="testi-star"', 'class="testi-star is-off"');
  var MARK = '<svg class="testi-mark" viewBox="0 0 27 19" width="46" height="32" aria-hidden="true"><path d="M1.5 12.5C1.5 7 5 3 10.5 1.5l.7 2.1C8 4.8 6 6 5.6 7.2a5.5 5.5 0 1 1-4.1 5.3z"/><path d="M15.5 12.5C15.5 7 19 3 24.5 1.5l.7 2.1C22 4.8 20 6 19.6 7.2a5.5 5.5 0 1 1-4.1 5.3z"/></svg>';

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

  function average(list) {
    var rated = [];
    list.forEach(function (t) {
      var r = ratingOf(t);
      if (r !== null) rated.push(r);
    });
    return rated.length > 1 ? rated.reduce(function (a, b) { return a + b; }, 0) / rated.length : null;
  }

  // the quote mark, and their score with five stars (partly filled for a score like 4.5)
  function topRow(t) {
    var top = el('div', 'testi-top');
    top.insertAdjacentHTML('beforeend', MARK);
    var own = ratingOf(t);
    if (own !== null) {
      var rating = el('p', 'testi-rating');
      rating.appendChild(document.createTextNode(score(own)));
      rating.appendChild(el('span', 'sr-only', ' out of 5'));
      var stars = el('span', 'testi-stars');
      stars.setAttribute('aria-hidden', 'true');
      // each star fills by how much of the score reaches it: 4.5 gives four and a half
      for (var i = 0; i < 5; i++) {
        var part = Math.max(0, Math.min(1, own - i));
        var wrap = el('span', 'testi-star-wrap');
        wrap.insertAdjacentHTML('beforeend', STAR_OFF);
        if (part > 0) {
          var fill = el('span', 'testi-star-fill');
          fill.style.setProperty('--fill', (Math.round(part * 1000) / 10) + '%');
          fill.insertAdjacentHTML('beforeend', STAR);
          wrap.appendChild(fill);
        }
        stars.appendChild(wrap);
      }
      rating.appendChild(stars);
      top.appendChild(rating);
    }
    return top;
  }

  function build(t) {
    var card = el('li', 'testi-card');
    if (t.sample) card.appendChild(el('span', 'testi-sample', 'Sample: preview only'));

    // the rating row and their words
    var body = el('div', 'testi-body');
    body.appendChild(topRow(t));
    var quote = el('blockquote', 'testi-quote');
    quote.appendChild(el('p', 'testi-quote-lead', t.quote));
    if (t.story) quote.appendChild(el('p', 'testi-quote-more', t.story));
    body.appendChild(quote);
    card.appendChild(body);

    // who they are
    var person = el('div', 'testi-person');
    var avatar = el('span', 'testi-avatar');
    avatar.setAttribute('aria-hidden', 'true');
    if (t.photo) {
      var img = document.createElement('img');
      img.src = t.photo;
      img.alt = '';
      img.width = 52;
      img.height = 52;
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
    card.appendChild(person);

    return card;
  }

  window.TestimonialCard = { build: build, average: average, initials: initials };
})();
