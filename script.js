document.addEventListener('DOMContentLoaded', () => {
    const url = "https://d5dsv84kj5buag61adme.apigw.yandexcloud.net";
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const score = JSON.parse(localStorage.getItem('score')) || {};
    const colors = ['red', 'green', 'blue', 'yellow'];
    const sounds = {
        red: new Audio('sounds/1.mp3'),
        green: new Audio('sounds/2.mp3'),
        blue: new Audio('sounds/3.mp3'),
        yellow: new Audio('sounds/4.mp3'),
    };

    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        return hashHex;
    }

    // Регистрация
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            try {
                const login = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                const passHash = await hashPassword(password);

                const response = await fetch(`${url}/players`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json", 
                    },
                    body: JSON.stringify({ login, password: passHash }),
                });

                if (!response.ok) {
                    throw new Error('Ошибка при регистрации');
                }

                const result = await response.json();
                alert("Пользователь успешно зарегистрирован!");

            } catch (error) {
                alert("Ошибка: " + (error.message || "Неизвестная ошибка"));
            }
        });
    }

    // Логин
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                const login = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const passHash = await hashPassword(password);
                const response = await fetch(`${url}/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ login, password: passHash }),
                     credentials: 'include'
                });
                if (!response.ok) {
                    throw new Error('Ошибка при входе');
                }
                const result = await response.json();
                localStorage.setItem('currentUser', login);
                alert("Вы успешно вошли!");
                window.location.href = "index.html";
            } catch (error) {
                alert("Ошибка: " + (error.message || "Неизвестная ошибка"));
            }
        });
    }

    // Для игры
    if (document.getElementById('startGame')) {
        const gameBoard = document.getElementById('gameBoard');
        let sequence = [];
        let userSequence = [];
        let scoreCounter = 0;
    
        const startGame = () => {
            scoreCounter = 0;
            sequence = [];
            document.getElementById('score').innerText = 'Счет: 0'; // Сбросить счет на экране
            nextSequence();
        };
    
        const nextSequence = () => {
            userSequence = [];
            const nextColor = Math.floor(Math.random() * colors.length);
            sequence.push(colors[nextColor]);
            showSequence();
        };
    
        const showSequence = () => {
            let i = 0;
            const intervalTime = 1500;
            const interval = setInterval(() => {
                const color = sequence[i];
                highlightColor(color);
                sounds[color].play();
    
                if (i === sequence.length - 1) {
                    clearInterval(interval);
                    setTimeout(() => {
                        enableUserInput();
                    }, 1000);
                }
                i++;
            }, intervalTime);
        };
    
        const highlightColor = (color) => {
            const colorButton = document.querySelector(`.${color}`);
            colorButton.style.opacity = '1'; // Увеличиваем непрозрачность
    
            setTimeout(() => {
                colorButton.style.opacity = '0.5'; // Возвращаем непрозрачность
            }, 500);
        };
    
        const enableUserInput = () => {
            gameBoard.addEventListener('click', handleUserInput);
        };
    
        const handleUserInput = (e) => {
            const colorClicked = e.target.classList[1];
            if (colors.includes(colorClicked)) {
                userSequence.push(colorClicked);
                sounds[colorClicked].play();
    
                const colorButton = e.target;
                colorButton.style.opacity = '1'; // Увеличиваем непрозрачность
    
                setTimeout(() => {
                    colorButton.style.opacity = '0.5'; // Возвращаем непрозрачность через 300 мс
                }, 300);
    
                if (userSequence[userSequence.length - 1] !== sequence[userSequence.length - 1]) {
                    alert('Неправильно! Игра окончена.');
                    gameBoard.removeEventListener('click', handleUserInput);
                    sequence = [];
                    userSequence = [];
                } else if (userSequence.length === sequence.length) {
                    scoreCounter++;
                    localStorage.setItem('score', scoreCounter);

                    document.getElementById('score').innerText = 'Счет: ' + scoreCounter;
                    updateScoreOnServer(scoreCounter);
    
                    nextSequence();
                }
            }
        };
    
        const updateScoreOnServer = async (score) => {
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                console.error('Пользователь не авторизован');
                return;
            }

            try {
                const response = await fetch(`${url}/players/${currentUser}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({  score }),
                    credentials: 'include',
                });
    
                if (!response.ok) {
                    throw new Error('Ошибка при обновлении счета');
                }

                const result = await response.json();
                console.log(result); 

            } catch (error) {
                console.error('Ошибка:', error.message || 'Неизвестная ошибка');
            }
        };
    
        document.getElementById('startGame').addEventListener('click', startGame);
    
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            document.getElementById('score').innerText = score[currentUser] || 0;
        }
    }
});



document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, если текущая страница - это 'score.html'
    if (window.location.pathname.includes('score.html')) {
      // Вызываем функцию для загрузки данных с сервера, когда страница score.html загружена
      fetchPlayers();
    }
  });
  
  function fetchPlayers() {
    fetch(`${url}/players`)
      .then(response => response.json())
      .then(data => buildTableCallback(JSON.stringify(data)))
      .catch(error => console.error('Ошибка при получении данных:', error));
  }
  
  function buildTableCallback(text) {
    let players = JSON.parse(text);
    let table = document.getElementById('codexpl').getElementsByTagName('tbody')[0];
  
    table.innerHTML = '';
  
    players.forEach(player => {
      let row = table.insertRow();
      let cellName = row.insertCell();
      let cellScore = row.insertCell();
      cellName.innerHTML = player.Login;
      cellScore.innerHTML = player.Score;
    });
  }

function sorttable(tbl, colnum) {
  var numofcols = tbl.getElementsByTagName('th').length;
  var numofrows = tbl.getElementsByTagName('tr').length;
  var sorted = [];
  
  if (numofcols <= colnum) {
      throw "Invalid Column number";
  } else {
      for (var i = 1; i < numofrows; i++) {
          var trel = tbl.getElementsByTagName('tr')[i];
          var tdel = trel.getElementsByTagName('td')[colnum];
          for (var j = (i + 1); j < numofrows; j++) {
              var trel2 = tbl.getElementsByTagName('tr')[j];
              var tdel2 = trel2.getElementsByTagName('td')[colnum];
              if (compare(tdel.innerHTML, tdel2.innerHTML) < 0) {
                  sorted[j - 1] = (sorted[j - 1] || 0) + 1;
              } else if (compare(tdel.innerHTML, tdel2.innerHTML) > 0) {
                  sorted[i - 1] = (sorted[i - 1] || 0) + 1;
              } else {
                  sorted[i - 1] = (sorted[i - 1] || 0) + 1;
              }
          }
      }
  }
  movedarows(tbl, sorted);
}


