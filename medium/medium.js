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
        'Validate Parentheses': 'Input: "()[]{}"\\nOutput: true\\nInput: "(]"\\nOutput: false',
        'Build a Rate Limiter': 'Input: 6 requests from same user within 10 seconds\\nOutput: first 5 allowed, 6th rejected',
        'Find Duplicated Files': 'Input: [{path:"/a", hash:"123"}, {path:"/b", hash:"123"}]\\nOutput: {"123": ["/a", "/b"]}',
        'SQL Top Spenders': 'Input: Orders table with last 30 days data\\nOutput: top 3 customers with total_spent and order_count',
        'Sliding Window Max Sum': 'Input: nums = [2,1,5,1,3,2], k = 3\\nOutput: 9',
        'Longest Substring Without Repeat': 'Input: "abcabcbb"\\nOutput: 3',
        'Interval Merge': 'Input: [[1,3],[2,6],[8,10]]\\nOutput: [[1,6],[8,10]]',
        'Queue with Two Stacks': 'Input: enqueue(1), enqueue(2), dequeue()\\nOutput: 1',
        'Top K Frequent Elements': 'Input: [1,1,1,2,2,3], k=2\\nOutput: [1,2]',
        'Product Except Self': 'Input: [1,2,3,4]\\nOutput: [24,12,8,6]'
      };

      function getDifficulty(card) {
        const tag = card.querySelector('.tag');
        if (!tag) return 'Medium';
        if (tag.textContent.indexOf('Hard') !== -1) return 'Hard';
        if (tag.textContent.indexOf('Easy') !== -1) return 'Easy';
        return 'Medium';
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
        const criteria = criteriaByDifficulty[difficulty] || criteriaByDifficulty.Medium;
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
