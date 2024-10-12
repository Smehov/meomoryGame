document.addEventListener('DOMContentLoaded', () => {
    const users = JSON.parse(localStorage.getItem('users')) || {};
    const score = JSON.parse(localStorage.getItem('score')) || {};
    const colors = ['red', 'green', 'blue', 'yellow'];
    const sounds = {
        red: new Audio('sounds/1.mp3'),
        green: new Audio('sounds/2.mp3'),
        blue: new Audio('sounds/3.mp3'),
        yellow: new Audio('sounds/4.mp3'),
    };
    

    // Регистрация
    document.getElementById('registerForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('newUsername').value;
        if (!users[username]) {
            users[username] = true;
            localStorage.setItem('users', JSON.stringify(users));
            alert('Регистрация успешна!');
        } else {
            alert('Пользователь с таким именем уже существует.');
        }
    });

    // Логин
    document.getElementById('loginForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        if (users[username]) {
            localStorage.setItem('currentUser', username);
            window.location.href = 'game.html';
        } else {
            alert('Неверное имя пользователя.');
        }
    });

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
                    score[localStorage.getItem('currentUser')] = scoreCounter;
                    localStorage.setItem('score', JSON.stringify(score));
        
                    document.getElementById('score').innerText = 'Счет: ' + scoreCounter;
        
                    nextSequence();
                }
            }
        };
        
        
        document.getElementById('startGame').addEventListener('click', startGame);

        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            document.getElementById('score').innerText = score[currentUser] || 0;
        }
    }
});