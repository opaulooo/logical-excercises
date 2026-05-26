    (function () {
      const cards = document.querySelectorAll('.card');
      const modalBackdrop = document.getElementById('exerciseModal');
      const closeBtn = document.getElementById('closeModalBtn');
      const modalTitle = document.getElementById('modalTitle');
      const modalDescription = document.getElementById('modalDescription');
      const modalCriteria = document.getElementById('modalCriteria');
      const modalExample = document.getElementById('modalExample');
      const openExerciseBtn = document.getElementById('openExerciseBtn');

      const criteriaByDifficulty = {
        Easy: [
          'Return the expected output for the provided inputs.',
          'Handle null/empty input and simple edge cases.',
          'Prefer a straightforward O(n) approach whenever possible.'
        ],
        Medium: [
          'Use a correct and efficient approach suitable for medium complexity.',
          'Explain main edge cases and trade-offs.',
          'Provide time and space complexity analysis.'
        ],
        Hard: [
          'Present a scalable solution considering reliability and performance.',
          'Discuss trade-offs, failure scenarios, and mitigation.',
          'Provide complexity analysis or architecture-level justification.'
        ]
      };

      const examplesByTitle = {
        'Design a Notification System': 'Input: channels [email, sms, push], event payload, retry policy\\nOutput: delivery status per channel with retries and dead-letter handling',
        'Implement an LRU Cache': 'Input: put(1,1), put(2,2), get(1), put(3,3), get(2)\\nOutput: 1, -1',
        'Debugging Production Slowdown': 'Input: latency increased after deployment\\nOutput: investigation plan + metrics + rollback/mitigation strategy',
        'Build a Mini URL Shortener': 'Input: long URL\\nOutput: short code mapped to original URL with click count tracking',
        'Distributed Rate Limiter': 'Input: requests across multiple instances\\nOutput: global consistent rate limit decision',
        'Consistent Hashing Router': 'Input: key + node ring\\nOutput: stable node assignment with minimal remapping',
        'Event Deduplication Pipeline': 'Input: duplicate event ids in stream\\nOutput: each logical event processed once',
        'Transactional Outbox': 'Input: DB state change + outbox event\\nOutput: eventual guaranteed event publication',
        'Search Autocomplete Service': 'Input: prefix = "int"\\nOutput: ranked top suggestions with low latency',
        'Time-Series Aggregator': 'Input: metric points over time\\nOutput: aggregated windows (min, max, avg, count)'
      };

      function getDifficulty(card) {
        const tag = card.querySelector('.tag');
        if (!tag) return 'Hard';
        if (tag.textContent.indexOf('Easy') !== -1) return 'Easy';
        if (tag.textContent.indexOf('Medium') !== -1) return 'Medium';
        return 'Hard';
      }

      function getExerciseNumber(card) {
        const tag = card.querySelector('.tag');
        if (!tag) return '00';
        const match = tag.textContent.match(/#(\d+)/);
        return match ? match[1] : '00';
      }

      function openModal(card) {
        const title = card.querySelector('h2') ? card.querySelector('h2').textContent.trim() : 'Exercise';
        const description = card.querySelector('p') ? card.querySelector('p').textContent.trim() : '';
        const difficulty = getDifficulty(card);
        const number = getExerciseNumber(card);

        modalTitle.textContent = title;
        modalDescription.textContent = description;

        modalCriteria.innerHTML = '';
        const criteria = criteriaByDifficulty[difficulty] || criteriaByDifficulty.Hard;
        criteria.forEach(function (item) {
          const li = document.createElement('li');
          li.textContent = item;
          modalCriteria.appendChild(li);
        });

        modalExample.textContent = examplesByTitle[title] || 'No strict input/output example is required. Describe assumptions and provide at least one valid test case.';
        openExerciseBtn.href = '../playground.html?difficulty=' + encodeURIComponent(difficulty.toLowerCase()) + '&number=' + encodeURIComponent(number) + '&title=' + encodeURIComponent(title) + '&description=' + encodeURIComponent(description);
        modalBackdrop.classList.add('open');
        modalBackdrop.setAttribute('aria-hidden', 'false');
      }

      function closeModal() {
        modalBackdrop.classList.remove('open');
        modalBackdrop.setAttribute('aria-hidden', 'true');
      }

      cards.forEach(function (card) {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Open exercise details');

        card.addEventListener('click', function () {
          openModal(card);
        });

        card.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openModal(card);
          }
        });
      });

      closeBtn.addEventListener('click', closeModal);

      modalBackdrop.addEventListener('click', function (event) {
        if (event.target === modalBackdrop) {
          closeModal();
        }
      });

      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modalBackdrop.classList.contains('open')) {
          closeModal();
        }
      });
    })();
