document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');

  if (toggle && header) {
    toggle.addEventListener('click', function () {
      header.classList.toggle('nav-open');
    });

    document.querySelectorAll('.nav-links a').forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
      });
    });
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var groups = [
      { sel: '.section-header, .area-note, .cta-banner, .calendar-embed, .form-card, .story-grid > div, .service-detail > *' },
      { sel: '.grid > .card, .grid > .testimonial-card, .value-grid > *, .team-grid > *, .area-tags > li, .area-list, .feature-row, .contact-info-card', stagger: true }
    ];
    var targets = [];
    groups.forEach(function (group) {
      document.querySelectorAll(group.sel).forEach(function (el) {
        if (el.classList.contains('reveal') || el.closest('.hero, .page-hero')) return;
        var siblings = Array.prototype.filter.call(el.parentNode.children, function (s) {
          return s.matches(group.sel);
        });
        var delay = group.stagger ? Math.min(siblings.indexOf(el), 6) * 90 : 0;
        el.style.setProperty('--reveal-delay', delay + 'ms');
        el.classList.add('reveal');
        targets.push(el);
      });
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        el.classList.add('is-visible');
        // Hand control back to the element's own hover transitions once the reveal ends.
        var done = function (e) {
          if (e.target !== el || e.propertyName !== 'opacity') return;
          el.removeEventListener('transitionend', done);
          el.classList.remove('reveal', 'is-visible');
          el.style.removeProperty('--reveal-delay');
        };
        el.addEventListener('transitionend', done);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) { observer.observe(el); });
  }

  var form = document.getElementById('inquiry-form');
  if (form) {
    var MAIL_TO = 'cleaningforyoutoo@gmail.com';
    var phone = form.elements['phone'];
    var fallback = document.getElementById('mail-fallback');
    var fallbackText = document.getElementById('fallback-text');

    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '').slice(0, 10);
      var out = d;
      if (d.length > 6) out = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
      else if (d.length > 3) out = '(' + d.slice(0, 3) + ') ' + d.slice(3);
      phone.value = out;
    });

    // "Any" and the specific methods are mutually exclusive; phone is needed only if they chose call or text.
    var methods = form.querySelectorAll('input[name="contact-method"]');
    var anyMethod = document.getElementById('contact-any');
    methods.forEach(function (box) {
      box.addEventListener('change', function () {
        if (box.checked) {
          methods.forEach(function (other) {
            if (other !== box && (box === anyMethod || other === anyMethod)) other.checked = false;
          });
        }
        phone.required = Array.prototype.some.call(methods, function (m) {
          return m.checked && (m.value === 'Phone call' || m.value === 'Text message');
        });
        phone.setCustomValidity('');
      });
    });

    var messages = {
      'cleaning-type': 'Please pick the type of cleaning you need.',
      'name': 'Please tell us your name.',
      'email': 'Please enter a valid email so we can reply.',
      'city': 'Please choose your city.',
      'phone': 'Please add a phone number so we can call or text you.'
    };
    form.querySelectorAll('input, select').forEach(function (field) {
      field.addEventListener('invalid', function () {
        field.setCustomValidity(messages[field.name] || '');
      });
      field.addEventListener('input', function () { field.setCustomValidity(''); });
      field.addEventListener('change', function () { field.setCustomValidity(''); });
    });

    var checked = function (name) {
      var el = form.querySelector('input[name="' + name + '"]:checked');
      return el;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var type = checked('cleaning-type');
      var method = Array.prototype.map.call(form.querySelectorAll('input[name="contact-method"]:checked'), function (m) {
        return m.value;
      }).join(', ');
      var notes = form.elements['message'].value.trim();
      var subject = type.dataset.subject;
      var body = [
        'Hi Cleaning4you,',
        '',
        "I'd like to ask about a cleaning estimate.",
        '',
        'Cleaning type: ' + type.value,
        'Name: ' + form.elements['name'].value.trim(),
        'Phone: ' + (phone.value || 'Not provided'),
        'Email: ' + form.elements['email'].value.trim(),
        'City: ' + form.elements['city'].value,
        'Best way to reach me: ' + (method || 'No preference'),
        '',
        'Notes:',
        notes || 'None',
        '',
        'Thank you!'
      ].join('\n');

      fallbackText.value = 'To: ' + MAIL_TO + '\nSubject: ' + subject + '\n\n' + body;
      fallback.hidden = false;
      window.location.href = 'mailto:' + MAIL_TO +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body).replace(/%0A/g, '%0D%0A');
    });

    document.getElementById('copy-message').addEventListener('click', function (e) {
      var btn = e.currentTarget;
      var done = function () {
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = 'Copy message'; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fallbackText.value).then(done, function () {
          fallbackText.select();
        });
      } else {
        fallbackText.select();
        try { document.execCommand('copy'); done(); } catch (err) {}
      }
    });
  }

  document.querySelectorAll('.slideshow').forEach(function (show) {
    var slides = show.querySelectorAll(':scope > img, :scope > .slide-pair');
    if (slides.length < 2) return;
    var current = 0;
    var paused = false;
    var timer;

    var dots = document.createElement('div');
    dots.className = 'slide-dots';
    var dotButtons = [];

    function go(index) {
      slides[current].classList.remove('active');
      dotButtons[current].classList.remove('active');
      current = (index + slides.length) % slides.length;
      slides[current].classList.add('active');
      dotButtons[current].classList.add('active');
    }

    function restart() {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(function () { if (!paused) go(current + 1); }, 3000);
    }

    function arrow(dir, label) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'slide-arrow ' + (dir < 0 ? 'prev' : 'next');
      b.setAttribute('aria-label', label);
      b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="' +
        (dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') +
        '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      b.addEventListener('click', function () { go(current + dir); restart(); });
      return b;
    }

    slides.forEach(function (_, i) {
      var d = document.createElement('button');
      d.type = 'button';
      d.setAttribute('aria-label', 'Show photo ' + (i + 1));
      d.addEventListener('click', function () { go(i); restart(); });
      dots.appendChild(d);
      dotButtons.push(d);
    });
    dotButtons[0].classList.add('active');

    show.appendChild(arrow(-1, 'Previous photo'));
    show.appendChild(arrow(1, 'Next photo'));
    show.appendChild(dots);

    show.addEventListener('mouseenter', function () { paused = true; });
    show.addEventListener('mouseleave', function () { paused = false; });

    var startX = null;
    show.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    show.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); restart(); }
    });

    restart();
  });
});
