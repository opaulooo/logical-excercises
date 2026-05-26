    (function () {
      const cards = document.querySelectorAll('.card');
      const modalBackdrop = document.getElementById('exerciseModal');
      const closeBtn = document.getElementById('closeModalBtn');
      const modalTitle = document.getElementById('modalTitle');
      const modalDescription = document.getElementById('modalDescription');
      const modalCriteria = document.getElementById('modalCriteria');
      const modalExample = document.getElementById('modalExample');
      const modalExampleTitle = document.getElementById('modalExampleTitle');
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
        'Two Sum Variant': 'Input: nums = [2, 7, 11, 15], target = 9\\nOutput: [0, 1]',
        'Group Transactions by Category': 'Input: [{category: "Food", amount: 50}, {category: "food", amount: 30}]\\nOutput: {"Food": 80}',
        'Count Vowels': 'Input: "Interview"\\nOutput: 3',
        'Palindrome Check': 'Input: "A man, a plan, a canal: Panama"\\nOutput: true',
        'First Non-Repeated Char': 'Input: "aabbcddef"\\nOutput: "c"',
        'FizzBuzz Range': 'Input: n = 5\\nOutput: 1, 2, Fizz, 4, Buzz',
        'Remove Duplicates': 'Input: [1, 2, 2, 3, 1]\\nOutput: [1, 2, 3]',
        'Valid Anagram': 'Input: "listen", "silent"\\nOutput: true',
        'Reverse Words': 'Input: "  hello   world  "\\nOutput: "world hello"',
        'Merge Sorted Arrays': 'Input: [1, 3, 5], [2, 4, 6]\\nOutput: [1, 2, 3, 4, 5, 6]'
      };

      function getDifficulty(card) {
        const tag = card.querySelector('.tag');
        if (!tag) return 'Easy';
        if (tag.textContent.indexOf('Medium') !== -1) return 'Medium';
        if (tag.textContent.indexOf('Hard') !== -1) return 'Hard';
        return 'Easy';
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
        const criteria = criteriaByDifficulty[difficulty] || criteriaByDifficulty.Easy;
        criteria.forEach(function (item) {
          const li = document.createElement('li');
          li.textContent = item;
          modalCriteria.appendChild(li);
        });

        const example = examplesByTitle[title] || 'No strict input/output example is required. Describe assumptions and provide at least one valid test case.';
        modalExample.textContent = example;
        modalExampleTitle.style.display = 'block';
        modalExample.style.display = 'block';

        openExerciseBtn.href = '../playground/playground.html?difficulty=' + encodeURIComponent(difficulty.toLowerCase()) + '&number=' + encodeURIComponent(number) + '&title=' + encodeURIComponent(title) + '&description=' + encodeURIComponent(description);

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
