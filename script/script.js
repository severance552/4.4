// Обробник подій, який відстежує завантаження контенту
document.addEventListener('DOMContentLoaded', function () {
  const btnOpenModal = document.querySelector('#btnOpenModal');
  const modalBlock = document.querySelector('#modalBlock');
  const closeModal = document.querySelector('#closeModal');
  const questionTitle = document.querySelector('#question');
  const formAnswers = document.querySelector('#formAnswers');
  const nextButton = document.querySelector('#next');
  const prevButton = document.querySelector('#prev');
  const sendButton = document.querySelector('#send');
  const modalTitle = document.querySelector('.modal-title');

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyCp9asnfw1Pd5CFZKKFI3RxgqEc3deg0bc",
    authDomain: "myfarebase-adab0.firebaseapp.com",
    databaseURL: "https://myfarebase-adab0-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "myfarebase-adab0",
    storageBucket: "myfarebase-adab0.firebasestorage.app",
    messagingSenderId: "881652167280",
    appId: "1:881652167280:web:012a365d05c773dc467ab5",
    measurementId: "G-L8L4QNR898"
  };

  // Initialize Firebase
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  // Функція отримання даних із Firebase Realtime Database
  const getData = () => {
    formAnswers.textContent = 'LOAD';
    questionTitle.textContent = '';
    modalTitle.textContent = 'Дай відповідь на питання:';
    nextButton.classList.add('d-none');
    prevButton.classList.add('d-none');
    sendButton.classList.add('d-none');

    setTimeout(() => {
      try {
        firebase
          .database()
          .ref()
          .child('questions')
          .once('value')
          .then((snap) => playTest(snap.val()))
          .catch((err) => {
            console.error(err);
            formAnswers.textContent = 'Помилка завантаження даних!';
          });
      } catch (err) {
        // Резервне завантаження з тієї ж бази Firebase, якщо у index.html підключено стару версію SDK 7.6.1
        fetch(`${firebaseConfig.databaseURL}/questions.json`)
          .then((res) => res.json())
          .then((questions) => playTest(questions))
          .catch((fetchErr) => {
            console.error(fetchErr);
            formAnswers.textContent = 'Помилка завантаження даних!';
          });
      }
    }, 500);
  };

  // Обробники подій відкриття/закриття модального вікна
  btnOpenModal.addEventListener('click', () => {
    modalBlock.classList.add('d-block');
    getData();
  });

  closeModal.addEventListener('click', () => {
    modalBlock.classList.remove('d-block');
  });

  // Функція запуску тестування
  const playTest = (questions) => {
    const finalAnswers = [];
    let numberQuestion = 0;
    modalTitle.textContent = 'Дай відповідь на питання:';

    // Функція рендерингу варіантів відповідей
    const renderAnswers = (index) => {
      questions[index].answers.forEach((answer) => {
        const answerItem = document.createElement('div');

        answerItem.classList.add('answers-item', 'd-flex', 'justify-content-center');

        answerItem.innerHTML = `
          <input type="${questions[index].type}" id="${answer.title}" name="answer" class="d-none" value="${answer.title}">
          <label for="${answer.title}" class="d-flex flex-column justify-content-between">
            <img class="answerImg" src="${answer.url}" alt="burger">
            <span>${answer.title}</span>
          </label>
        `;

        formAnswers.appendChild(answerItem);
      });
    };

    // Функція рендерингу питань + відповідей + кнопок (Switch / Case)
    const renderQuestions = (indexQuestion) => {
      formAnswers.innerHTML = '';

      switch (true) {
        case (numberQuestion === 0):
          questionTitle.textContent = `${questions[indexQuestion].question}`;
          renderAnswers(indexQuestion);
          nextButton.classList.remove('d-none');
          prevButton.classList.add('d-none');
          sendButton.classList.add('d-none');
          break;

        case (numberQuestion > 0 && numberQuestion <= questions.length - 1):
          questionTitle.textContent = `${questions[indexQuestion].question}`;
          renderAnswers(indexQuestion);
          nextButton.classList.remove('d-none');
          prevButton.classList.remove('d-none');
          sendButton.classList.add('d-none');
          break;

        case (numberQuestion === questions.length):
          questionTitle.textContent = '';
          modalTitle.textContent = '';
          nextButton.classList.add('d-none');
          prevButton.classList.add('d-none');
          sendButton.classList.remove('d-none');

          formAnswers.innerHTML = `
            <div class="form-group">
              <label for="numberPhone">Введіть свій номер телефону</label>
              <input type="phone" class="form-control" id="numberPhone">
            </div>
          `;
          break;

        case (numberQuestion === questions.length + 1):
          formAnswers.textContent = 'Дякую за пройдений тест!';
          sendButton.classList.add('d-none');

          setTimeout(() => {
            modalBlock.classList.remove('d-block');
          }, 2000);
          break;
      }
    };

    // Запуск функції рендерингу
    renderQuestions(numberQuestion);

    const checkAnswer = () => {
      const obj = {};
      const inputs = [...formAnswers.elements].filter((input) => input.checked || input.id === 'numberPhone');

      inputs.forEach((input, index) => {
        if (numberQuestion >= 0 && numberQuestion <= questions.length - 1) {
          obj[`${index}_${questions[numberQuestion].question}`] = input.value;
        }

        if (numberQuestion === questions.length) {
          obj['Номер телефону'] = input.value;
        }
      });

      finalAnswers.push(obj);
    };

    // Обробники подій кнопок
    nextButton.onclick = () => {
      checkAnswer();
      numberQuestion++;
      renderQuestions(numberQuestion);
    };

    prevButton.onclick = () => {
      numberQuestion--;
      renderQuestions(numberQuestion);
    };

    sendButton.onclick = () => {
      checkAnswer();
      numberQuestion++;
      renderQuestions(numberQuestion);

      try {
        firebase
          .database()
          .ref()
          .child('contacts')
          .push(finalAnswers);
      } catch (err) {
        fetch(`${firebaseConfig.databaseURL}/contacts.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalAnswers)
        });
      }
    };
  };
});
