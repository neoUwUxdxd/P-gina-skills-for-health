(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollToEl(el) {
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.nav-toggle-label').textContent = open ? 'Close' : 'Menu';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.site-header')) setMenu(false);
    });
  }

  /* ---------- Highlight the current section in the menu ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a'));
  var sections = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  function markCurrent() {
    var line = window.innerHeight * 0.35;
    var current = null;
    sections.forEach(function (s) {
      if (s.getBoundingClientRect().top <= line) current = s;
    });
    // "Join the movement" belongs to the Team menu entry.
    var join = document.getElementById('join');
    var refs = document.getElementById('references');
    if (join && current && current.id === 'team' && refs && refs.getBoundingClientRect().top <= line) current = refs;
    navLinks.forEach(function (a) {
      if (current && a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { markCurrent(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', markCurrent);
  markCurrent();

  /* ---------- Fact sheet tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.fs-tab'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var picker = document.getElementById('fs-picker');

  function selectTab(index, opts) {
    opts = opts || {};
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    if (opts.focus) tabs[index].focus();
    if (opts.scroll) scrollToEl(panels[index]);
  }

  if (tabs.length) {
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectTab(i); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next !== null) {
          e.preventDefault();
          selectTab(next, { focus: true });
        }
      });
    });

    // Previous / next buttons at the end of each profile.
    panels.forEach(function (panel, i) {
      var bar = document.createElement('div');
      bar.className = 'fs-next';
      function makeBtn(target, label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn btn--outline';
        b.textContent = label;
        b.addEventListener('click', function () {
          selectTab(target);
          scrollToEl(picker);
          tabs[target].focus({ preventScroll: true });
        });
        return b;
      }
      var prev = (i - 1 + tabs.length) % tabs.length;
      var next = (i + 1) % tabs.length;
      bar.appendChild(makeBtn(prev, '← ' + tabs[prev].textContent));
      bar.appendChild(makeBtn(next, tabs[next].textContent + ' →'));
      panel.appendChild(bar);
    });

    // Links in the summary table open the matching profile.
    document.querySelectorAll('[data-tab]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var idx = tabs.findIndex(function (t) { return t.id === 'tab-' + link.getAttribute('data-tab'); });
        if (idx < 0) return;
        e.preventDefault();
        selectTab(idx, { scroll: true });
        panels[idx].focus({ preventScroll: true });
      });
    });

    var fromHash = tabs.findIndex(function (t) { return '#' + t.getAttribute('aria-controls') === window.location.hash; });
    selectTab(fromHash >= 0 ? fromHash : 0);
  }

  /* ---------- Copy hashtags ---------- */
  var copyStatus = document.getElementById('copy-status');
  document.querySelectorAll('.copy-btn').forEach(function (btn) {
    var original = btn.innerHTML;
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      function done() {
        btn.classList.add('is-copied');
        btn.firstChild.textContent = 'Copied';
        if (copyStatus) copyStatus.textContent = text + ' copied';
        window.setTimeout(function () {
          btn.classList.remove('is-copied');
          btn.innerHTML = original;
        }, 1800);
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { /* nothing to do */ }
        document.body.removeChild(ta);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, fallback);
      } else {
        fallback();
      }
    });
  });

  /* ---------- Quiz ---------- */
  var QUESTIONS = [
    {
      tag: 'Game day fuel',
      q: 'How long before a match should a young player eat a full meal?',
      options: ['Right before kickoff', 'About 30 minutes before', 'At least 3 hours before', 'No food on game day'],
      answer: 2,
      why: 'The Canadian Paediatric Society advises a meal at least three hours before an event, so the body has time to digest it.'
    },
    {
      tag: 'Hydration',
      q: 'During a match, how much should a player drink every 15 to 20 minutes?',
      options: ['150 to 300 mL', '1 litre', 'Only when very thirsty', 'Nothing until half-time'],
      answer: 0,
      why: 'Small, regular drinks of about 150 to 300 mL keep players hydrated without feeling heavy.'
    },
    {
      tag: 'Recovery',
      q: 'When is the best time for a recovery snack with protein and carbohydrates?',
      options: ['The next morning', 'Within 30 minutes after playing', 'Only before bed', 'Recovery snacks are not needed'],
      answer: 1,
      why: 'A snack within 30 minutes after exercise helps muscles refuel and repair.'
    },
    {
      tag: 'Food first',
      q: 'What does the UEFA expert group recommend for football nutrition?',
      options: ['Supplements first', 'Energy drinks before every game', 'A ‘food first’ philosophy', 'Skipping meals to stay light'],
      answer: 2,
      why: 'UEFA experts recommend “a ‘food first’ philosophy (ie, food over supplements)” (Collins et al., 2021).'
    },
    {
      tag: 'Key vocabulary',
      q: 'Which nutrient is the body’s main source of energy during exercise?',
      options: ['Carbohydrates', 'Vitamins', 'Fibre', 'Water'],
      answer: 0,
      why: 'Carbohydrates such as rice, pasta, tortillas and fruit are the main fuel for running and staying focused.'
    },
    {
      tag: 'Key vocabulary',
      q: 'What is glycogen?',
      options: ['A type of protein shake', 'The form in which the body stores carbohydrates in the muscles and liver', 'A mineral lost in sweat', 'A vitamin found in milk'],
      answer: 1,
      why: 'Muscles use stored glycogen as fuel during a match, which is why carbohydrates matter before and after playing.'
    },
    {
      tag: 'Disease · HCM',
      q: 'Which test shows how well the heart’s chambers and valves are pumping in hypertrophic cardiomyopathy?',
      options: ['A blood sugar test', 'An X-ray of the knee', 'An echocardiogram', 'A urine test'],
      answer: 2,
      why: 'Mayo Clinic explains that an echocardiogram shows how the heart pumps and can reveal a thickened heart muscle.'
    },
    {
      tag: 'Disease · CTE',
      q: 'How can chronic traumatic encephalopathy (CTE) be definitively diagnosed?',
      options: ['With a simple blood test', 'Only after death, during an autopsy of the brain', 'With a vision test', 'By measuring body weight'],
      answer: 1,
      why: 'According to Mayo Clinic, the only way to definitively diagnose CTE is after death during an autopsy of the brain.'
    },
    {
      tag: 'Disease · Mononucleosis',
      q: 'How does the virus that causes mononucleosis spread most commonly?',
      options: ['Through bodily fluids, especially saliva', 'Through sunlight', 'By eating too much sugar', 'Through sweat on the ball'],
      answer: 0,
      why: 'The CDC says it spreads mostly through saliva, so players should not share water bottles.'
    },
    {
      tag: 'Disorder · Rhabdomyolysis',
      q: 'Which is a warning sign of rhabdomyolysis?',
      options: ['Better sleep', 'Dark, red or cola-colored urine', 'Stronger muscles', 'A runny nose'],
      answer: 1,
      why: 'MedlinePlus lists dark, red or cola-colored urine because damaged muscle releases myoglobin into the blood.'
    },
    {
      tag: 'Disorder · PFPS',
      q: 'Where do people with patellofemoral pain syndrome feel pain?',
      options: ['In the lower back', 'In the ankle', 'In the front of the knee, around or behind the kneecap', 'In the chest'],
      answer: 2,
      why: 'Mayo Clinic describes it as pain felt in the front of the knee, around or behind the kneecap.'
    },
    {
      tag: 'Disorder · Anorexia nervosa',
      q: 'Compared with the general population, about how much higher is the mortality rate of people with anorexia nervosa?',
      options: ['It is the same', 'About 2 times higher', 'Almost 6 times higher', 'It is lower'],
      answer: 2,
      why: 'A meta-analysis of 36 studies found a standardized mortality ratio of 5.86 for anorexia nervosa (Arcelus et al., 2011).'
    }
  ];
  var LETTERS = ['A', 'B', 'C', 'D'];
  var app = document.getElementById('quiz-app');

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  if (app) {
    var state;

    var resetQuiz = function () {
      state = { index: 0, picks: [] };
    };

    var scoreSoFar = function () {
      return state.picks.reduce(function (n, pick, i) { return n + (pick === QUESTIONS[i].answer ? 1 : 0); }, 0);
    };

    var progressBar = function (currentIndex) {
      var bar = el('div', 'quiz-progress');
      bar.setAttribute('aria-hidden', 'true');
      QUESTIONS.forEach(function (item, i) {
        var seg = el('span');
        if (i < state.picks.length) seg.className = state.picks[i] === item.answer ? 'is-right' : 'is-wrong';
        else if (i === currentIndex) seg.className = 'is-current';
        bar.appendChild(seg);
      });
      return bar;
    };

    var renderQuestion = function (moveFocus) {
      var item = QUESTIONS[state.index];
      app.textContent = '';

      var top = el('div', 'quiz-top');
      top.appendChild(el('p', 'quiz-count', 'Question ' + (state.index + 1) + ' of ' + QUESTIONS.length));
      var score = el('p', 'quiz-score', 'Score ' + scoreSoFar() + ' / ' + QUESTIONS.length);
      top.appendChild(score);
      app.appendChild(top);
      app.appendChild(progressBar(state.index));

      app.appendChild(el('span', 'quiz-tag', item.tag));
      var question = el('h3', 'quiz-question', item.q);
      question.id = 'quiz-question';
      question.tabIndex = -1;
      app.appendChild(question);

      var list = el('div', 'quiz-options');
      list.setAttribute('role', 'group');
      list.setAttribute('aria-labelledby', 'quiz-question');
      var feedback = el('div', 'quiz-feedback');
      feedback.setAttribute('role', 'status');
      feedback.setAttribute('aria-live', 'polite');
      feedback.hidden = true;
      var actions = el('div', 'quiz-actions');

      var buttons = item.options.map(function (text, i) {
        var b = el('button', 'quiz-option');
        b.type = 'button';
        b.appendChild(el('span', 'letter', LETTERS[i]));
        b.appendChild(el('span', 'text', text));
        b.appendChild(el('span', 'mark'));
        b.addEventListener('click', function () { answer(i); });
        list.appendChild(b);
        return b;
      });

      function answer(pick) {
        if (state.picks.length > state.index) return;
        state.picks.push(pick);
        var right = pick === item.answer;

        buttons.forEach(function (b, i) {
          b.disabled = true;
          if (i === item.answer) {
            b.classList.add('is-correct');
            b.querySelector('.mark').textContent = '✓ Correct answer';
          } else if (i === pick) {
            b.classList.add('is-wrong');
            b.querySelector('.mark').textContent = '✕ Your answer';
          } else {
            b.classList.add('is-dim');
          }
        });

        score.textContent = 'Score ' + scoreSoFar() + ' / ' + QUESTIONS.length;
        var bar = app.querySelector('.quiz-progress');
        bar.parentNode.replaceChild(progressBar(-1), bar);

        feedback.classList.add(right ? 'is-right' : 'is-wrong');
        feedback.appendChild(el('h4', '', right ? 'Correct!' : 'Not quite'));
        if (!right) {
          feedback.appendChild(el('p', '', 'The correct answer is ' + LETTERS[item.answer] + ') ' + item.options[item.answer] + '.'));
        }
        feedback.appendChild(el('p', '', item.why));
        feedback.hidden = false;

        var last = state.index === QUESTIONS.length - 1;
        var next = el('button', 'btn btn--pitch', last ? 'See my final score' : 'Next question →');
        next.type = 'button';
        next.addEventListener('click', function () {
          if (last) { renderResult(); return; }
          state.index += 1;
          renderQuestion(true);
        });
        actions.appendChild(next);
        next.focus({ preventScroll: true });
      }

      app.appendChild(list);
      app.appendChild(feedback);
      app.appendChild(actions);
      if (moveFocus) question.focus({ preventScroll: true });
    };

    var renderResult = function () {
      var total = QUESTIONS.length;
      var score = scoreSoFar();
      var pct = Math.round((score / total) * 100);
      var message;
      if (score === total) message = 'A perfect match. You know exactly how to fuel your game.';
      else if (score >= 10) message = 'Great result. You are eating and thinking like a pro.';
      else if (score >= 7) message = 'Good match. Check the questions you missed and play again.';
      else message = 'Keep training. Read the Game Day Fuel Plan and the fact sheet, then try again.';

      app.textContent = '';
      var box = el('div', 'quiz-result');
      box.appendChild(el('p', 'quiz-result-label', 'Final score'));
      var big = el('p', 'quiz-result-score');
      big.tabIndex = -1;
      big.appendChild(document.createTextNode(String(score)));
      big.appendChild(el('small', '', ' / ' + total));
      big.setAttribute('aria-label', score + ' out of ' + total);
      box.appendChild(big);
      box.appendChild(el('p', 'quiz-result-pct', pct + '% correct'));
      box.appendChild(el('p', 'quiz-result-msg', message));

      var actions = el('div', 'quiz-actions');
      var again = el('button', 'btn btn--pitch', 'Play again');
      again.type = 'button';
      again.addEventListener('click', function () {
        resetQuiz();
        renderQuestion(true);
      });
      actions.appendChild(again);
      box.appendChild(actions);

      var review = el('ol', 'quiz-review');
      QUESTIONS.forEach(function (item, i) {
        var right = state.picks[i] === item.answer;
        var li = el('li');
        var badge = el('span', 'badge' + (right ? '' : ' is-wrong'), right ? '✓' : '✕');
        badge.setAttribute('aria-label', right ? 'Correct' : 'Incorrect');
        badge.setAttribute('role', 'img');
        li.appendChild(badge);
        var body = el('div');
        var qLine = el('p');
        qLine.appendChild(el('strong', '', (i + 1) + '. ' + item.q));
        body.appendChild(qLine);
        body.appendChild(el('p', 'answer', 'Correct answer: ' + LETTERS[item.answer] + ') ' + item.options[item.answer]));
        li.appendChild(body);
        review.appendChild(li);
      });
      box.appendChild(review);
      app.appendChild(box);
      big.focus({ preventScroll: true });
      scrollToEl(document.getElementById('quiz'));
    };

    resetQuiz();
    renderQuestion(false);
  }
})();
