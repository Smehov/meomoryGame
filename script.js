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


document.addEventListener('DOMContentLoaded', () => {
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



document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname.includes('score.html')) {
      fetchPlayers();
    }
  });
  
  let players = [];
  let currentPage = 1;
  const playersPerPage = 5; 
  
  function fetchPlayers() {
    fetch(`${url}/players`)
      .then(response => response.json())
      .then(data => {
        players = data;
        buildTable();
      })
      .catch(error => console.error('Ошибка при получении данных:', error));
  }
  
  function buildTable() {
    let table = document.getElementById('codexpl').getElementsByTagName('tbody')[0];
    table.innerHTML = '';
  
    players.sort((a, b) => b.Score - a.Score); // Сортировка по убыванию счета
    
    // Выделяем самого высокого и самого низкого
    const highestScore = players[0]?.Score;
    const lowestScore = players[players.length - 1]?.Score;
  
    const startIndex = (currentPage - 1) * playersPerPage;
    const endIndex = startIndex + playersPerPage;
    const playersToDisplay = players.slice(startIndex, endIndex);
  
    playersToDisplay.forEach(player => {
      let row = table.insertRow();
      let cellName = row.insertCell();
      let cellScore = row.insertCell();
  
      cellName.innerHTML = player.Login;
      cellScore.innerHTML = player.Score;
  

      if (player.Score === highestScore) {
        row.style.backgroundColor = 'green';
      } else if (player.Score === lowestScore) {
        row.style.backgroundColor = 'red';
      }
    });
  
    // Обновляем пагинацию
    updatePagination();
  }
  
  function sortTable(columnIndex) {
    if (columnIndex === 1) {
      players.sort((a, b) => b.Score - a.Score); 
    } else {
      players.sort((a, b) => a.Login.localeCompare(b.Login)); 
    }
    buildTable();
  }
  
  function changePage(direction) {
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > Math.ceil(players.length / playersPerPage)) {
      currentPage = Math.ceil(players.length / playersPerPage);
    }
    buildTable();
  }
  
  function updatePagination() {
    const totalPages = Math.ceil(players.length / playersPerPage);
    document.getElementById('pageNumber').innerText = `Page ${currentPage} of ${totalPages}`;
  
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
  }

