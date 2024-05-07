import { setDmgBar, setFireRateBar, setHintDmgBar, setHintFireRateBar, setHintMobBar, setMagSize, setMobBar, setHintMagSize } from "./logicFiles/setBars.js"
import { fetchDailyData, fetchEndlessSolved, incrementGlobalSolved, incrementSolvedCount} from "./logicFiles/serverFunctions.js"

export let weapons
let guessedWeapons = []
let guessedWeaponsHmtl = []
let guesses = 0;
let selectedWeapon
let hint = 1;
let checkbox
let dailyGuesses = 0;
let weaponToGuess;
let endlessGuesses = 0;
let dailyWeaponToGuess = null;
let dailyStreakCount = localStorage.getItem('dailyWeaponStreakCount') || 0;

window.onload = async function () {
    const weaponsResponse = await fetch('./weapons.json')
    const weaponsData = await weaponsResponse.json()
    weapons = weaponsData
    askForGuess();
    window.dispatchEvent(new Event('guessedWeaponsLoaded'));

    let savedMode = localStorage.getItem('mode');

    // Get the last visit timestamp and streak count from localStorage
    let lastVisitTimestamp = localStorage.getItem('lastVisitTimestamp');
    let dailyWeaponStreakCount = parseInt(localStorage.getItem('dailyWeaponStreakCount')) || 0;
    var dateNow = new Date().getTime();
    // If the last visit was within the last 24 hours, increment the streak count
    console.log(dateNow >= lastSolvedTimestamp + 24 * 60 * 60 * 1000)
    if (dateNow <= lastSolvedTimestamp + 24 * 60 * 60 * 1000) {
        console.log('Daily streak reset');
        localStorage.setItem('dailyWeaponStreakCount', 0);
    }

    // If a mode was saved, open that mode
    if (savedMode === 'daily') {
        dailyMode();
    } else if (savedMode === 'endless') {
        endlessMode();
    } else {
        // Disable the input
        let input = document.getElementById('inputField');
        if (input) {
            input.disabled = true;
        }
    }
    // Call fetchDailyData once immediately, then every 5 seconds
    fetchDailyData();
    setInterval(fetchDailyData, 5000);
    fetchEndlessSolved()
    setInterval(fetchEndlessSolved, 5000);
}

window.dailyMode = function () {
    // Enable the input
    let input = document.getElementById('inputField');
    if (input) {
        input.disabled = false;
        if (localStorage.getItem('dailyWeaponWon') === 'true') {
            input.disabled = true
        }
    }

    // Logic for daily mode
    updateModeIndicator('Daily');
    localStorage.setItem('mode', 'daily');
    displayDailyStreak();
    dailyGuesses = setDailyGuesses();

    if (dailyWeaponToGuess == null) {
        dailyWeaponToGuess = randomWeapon();
    }

    selectedWeapon = dailyWeaponToGuess;

    setDmgBar(dailyWeaponToGuess);
    setMobBar(dailyWeaponToGuess);
    setFireRateBar(dailyWeaponToGuess);
    setMagSize(dailyWeaponToGuess)

    var event = new CustomEvent('clearUsedNames');
    window.dispatchEvent(event);

    if (localStorage.getItem('dailyWeaponWon') === 'true') {
        displayWinningScreen()
    }
}

window.endlessMode = function () {
    // Logic for endless mode
    updateModeIndicator('Endless');
    localStorage.setItem('mode', 'endless');
    displayStreak();
    endlessGuesses = setEndlessGuesses();
    weaponToGuess = randomWeapon();

    selectedWeapon = weaponToGuess;

    setDmgBar(weaponToGuess);
    setMobBar(weaponToGuess);
    setFireRateBar(weaponToGuess);
    setMagSize(weaponToGuess)

    loadTriedWeapons()
    var event = new CustomEvent('clearUsedNames');
    window.dispatchEvent(event);

    // Enable the input
    let input = document.getElementById('inputField');
    if (input) {
        input.disabled = false;
    }
}

// Load the tried operators
function loadTriedWeapons() {
    if (localStorage.getItem('mode') === 'daily') {
        const savedTriedWeapons = localStorage.getItem('guessedWeapons');

        if (savedTriedWeapons) {
            guessedWeapons = JSON.parse(savedTriedWeapons);
        } else {
            guessedWeapons = [];
        }
        // Dispatch a custom event when guessedOperators is loaded
        window.dispatchEvent(new Event('guessedOperatorsLoaded'));
    } else {
        guessedWeapons = [];
        window.dispatchEvent(new Event('guessedOperatorsLoaded'));
    }
}

function updateModeIndicator(mode) {
    const modeIndicator = document.getElementById('mode-indicator');
    modeIndicator.textContent = `Current mode: ${mode}`;
    if (mode == 'Daily') {
        let button = document.createElement('button')
        button.className = 'de_button'
        button.innerHTML = 'Endless Mode'
        button.onclick = function () {
            endlessMode()
        }
        modeIndicator.appendChild(button)

    } else if (mode == 'Endless') {
        let button = document.createElement('button')
        button.className = 'de_button'
        button.innerHTML = 'Daily Mode'
        button.onclick = function () {
            dailyMode()
        }
        modeIndicator.appendChild(button)
    }

    clear()
}

function displayDailyStreak() {
    // Get the daily streak from local storage
    let dailyStreak = localStorage.getItem('dailyStreakCount');
    var dailyStreakDisplay = document.getElementById('dailyStreakDisplay');
    var dataGlobalSolvedEndless = document.getElementById('globalSolvedEndless');
    var dataDailyStreak = document.getElementById('alreadyDailySolved');
    dailyStreakDisplay.style.display = '';

    // If there's no daily streak, this is the user's first visit
    if (dailyStreak === null) {
        dailyStreak = 0;
    }

    // Display the daily streak
    if (dailyStreak == 0) {
        document.getElementById('dailyStreakDisplay').textContent = 'You have no daily streak';
    } else if (dailyStreak >= 1) {
        document.getElementById('dailyStreakDisplay').textContent = `Your daily streak is: ${dailyStreak}`;
    }

    // Get the 'streakDisplay' element
    var streakDisplay = document.getElementById('streakDisplay');

    // Hide the 'streakDisplay' element
    streakDisplay.style.display = 'none';
    dataGlobalSolvedEndless.style.display = 'none'
}

function displayStreak() {
    // Get the current streak from local storage
    let currentStreak = localStorage.getItem('streak');
    // Get the 'streakDisplay' element
    var streakDisplay = document.getElementById('streakDisplay');
    var dataDailyStreak = document.getElementById('alreadyDailySolved');
    var dataGlobalSolvedEndless = document.getElementById('globalSolvedEndless');

    // Show the 'streakDisplay' element
    streakDisplay.style.display = '';

    // If there's no current streak, this is the user's first visit
    if (!currentStreak) {
        currentStreak = 0;
    }

    // Display the current streak
    if (currentStreak == 0) {
        document.getElementById('streakDisplay').textContent = 'You have never solved R6dle';
    } else if (currentStreak > 1) {
        document.getElementById('streakDisplay').textContent = `You have solved it ${currentStreak} times already`;
    }

    var dailyStreakDisplay = document.getElementById('dailyStreakDisplay');
    dailyStreakDisplay.style.display = 'none'
    dataDailyStreak.style.display = 'none'

    dataGlobalSolvedEndless.style.display = ''
    dataGlobalSolvedEndless.innerHTML = 'The endless mode was already solved times'
}

// Set initial guess count for daily mode
function setDailyGuesses() {
    let storedDailyGuesses = localStorage.getItem('dailyWeaponGuesses');
    if (!storedDailyGuesses || isNaN(storedDailyGuesses)) {
        localStorage.setItem('dailyWeaponGuesses', dailyGuesses);
        dailyGuesses = localStorage.getItem('dailyWeaponGuesses')
    } else {
        dailyGuesses = parseInt(storedDailyGuesses);
    }
    return dailyGuesses
}

// Set initial guess count for endless mode
function setEndlessGuesses() {
    let storedEndlessGuesses = localStorage.getItem('endlessWeaponGuesses');
    if (!storedEndlessGuesses || isNaN(storedEndlessGuesses)) {
        localStorage.setItem('endlessWeaponGuesses', endlessGuesses);
        endlessGuesses = localStorage.getItem('endlessWeaponGuesses')
    } else {
        endlessGuesses = parseInt(storedEndlessGuesses);
    }
    return endlessGuesses
}

function randomWeapon() {
    const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)]
    return randomWeapon
}

async function guessWeapon(weapon) {
    checkbox.checked = false;
    guesses++

    if (guesses == 3) {
        showHint1();
        hint++;
    } else if (guesses == 6) {
        showHint2();
    }
    if (weapon === selectedWeapon.name) {
        console.log('You won!')
        problemSolved();
        let gWeapon = await weapons.find(w => w.name === weapon)

        setHintDmgBar(gWeapon)
        setHintMobBar(gWeapon);
        setHintFireRateBar(gWeapon);
        setHintMagSize(gWeapon)
        displayWinningScreen();
        guessedWeapons = []
        guessedWeaponsHmtl = []
        guesses = 0
        return true
    } else {
        // Add the guessed weapon to the array
        guessedWeaponsHmtl.push(weapon);

        let gWeapon = await weapons.find(w => w.name === weapon)

        //show hint bars
        setHintDmgBar(gWeapon)
        setHintMobBar(gWeapon);
        setHintFireRateBar(gWeapon);
        setHintMagSize(gWeapon)

        // Get the element where you want to display the guessed weapons
        let guessedWeaponsElement = document.getElementById('guessed_weapons');
        let nextHintElement = document.getElementById('nextHint')

        guessedWeaponsElement.className = 'hints-colors'
        guessedWeaponsElement.innerHTML = 'Guessed Weapons:'


        nextHintElement.className = 'hints-colors';
        nextHintElement.innerHTML = `${3 * hint - guesses} more guesses until next hint`

        // Create a new div for the weapon boxes
        let weaponBoxes = document.createElement('div');

        // Set the display of weaponBoxes to grid
        weaponBoxes.style.display = 'grid';
        weaponBoxes.style.gridTemplateColumns = 'repeat(auto-fill, minmax(200px, 1fr))';
        weaponBoxes.style.gap = '30px';
        weaponBoxes.style.justifyItems = 'center';
        // Iterate over each guessed weapon
        for (let i = 0; i < guessedWeaponsHmtl.length; i++) {
            let weaponDiv = document.createElement('div');
            let weaponName = document.createElement('div');
            let weaponImage = document.createElement('img');

            // Set the innerHTML of the weaponName to the guessed weapon's name
            weaponName.innerHTML = guessedWeaponsHmtl[i].replace('.', '_');

            // Set the src of the weaponImage to the guessed weapon's image
            // Replace 'path_to_images' with the actual path to your images
            weaponImage.src = `../images/weapons/${guessedWeaponsHmtl[i].toLowerCase().replace('.', '_')}.avif`;

            // Add CSS styles to weaponDiv, weaponName, and weaponImage
            weaponDiv.style.display = 'flex';
            weaponDiv.style.flexDirection = 'column';
            weaponDiv.style.alignItems = 'center';
            weaponDiv.style.justifyContent = 'center';
            weaponDiv.style.margin = '10px';
            weaponDiv.style.width = '220px'

            weaponImage.style.width = '220px';

            // Append the weaponName and weaponImage to the weaponDiv
            weaponDiv.appendChild(weaponName);
            weaponDiv.appendChild(weaponImage);

            // Append the weaponDiv to the guessedWeaponsElement
            weaponBoxes.appendChild(weaponDiv);
        }
        guessedWeaponsElement.appendChild(weaponBoxes);

        guessedWeaponsElement.style.display = 'block'

        return false
    }
}

function showHint1() {
    let hints = document.getElementById('hints');
    let hint1 = document.createElement('div');
    hint1.className = 'hints-colors hint1'
    hint1.innerHTML = 'Hint 1: This weapon is a ' + selectedWeapon.type;
    hints.appendChild(hint1);
}

function showHint2() {
    let hints = document.getElementById('hints');
    let hint2 = document.createElement('div');
    hint2.innerHTML = 'Hint 2: This weapon is used by ';
    hint2.className = 'hint2 hints-colors'
    let squarecontainer = document.createElement('div');
    squarecontainer.className = 'square-container'


    // Iterate over the operators and create a new element for each one
    selectedWeapon.available_on.forEach(operator => {
        let operatorElement = document.createElement('div');
        operatorElement.className = 'square animate__animated animate__flipInY';
        let img = document.createElement('img');
        img.src = `../images/r6s-operators-badge-${operator.toLowerCase()}.png`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        operatorElement.appendChild(img);
        squarecontainer.appendChild(operatorElement);
    });

    hint2.appendChild(squarecontainer);
    hints.appendChild(hint2);
}


function askForGuess() {
    // Get the button element
    var submitButton = document.getElementById('submitButton');
    // Create an array of operator names
    var weaponNames = weapons.map(function (weapons) {
        return weapons.name;
    });
    // Get the input field element
    var autobox = document.querySelector(".auto-box");

    // Add a click event listener to the input field
    autobox.addEventListener('click', function () {
        // Get the input field element
        var inputField = document.getElementById('inputField');
        // Select the input field content
        inputField.select();

        // Get the input field value
        var userInput = inputField.value;
        inputField.value = '';
        // Check if the operator has already been guessed or empty or does not exist
        if (guessedWeapons.includes(userInput) || userInput === "") {
            console.log('This weapon has already been guessed.');
            inputField.value = '';
            return; // Exit the function early
        } else if (userInput === "") {
            console.log('InputField was empty.');
            return;
        } else if (!weaponNames.includes(userInput)) {
            console.log('This weapon does not exist.');
            inputField.value = '';
            return;
        }

        // Add the operator to the array of guessed operators
        guessedWeapons.push(userInput);
        console.log(userInput)
        // Now you can use the userInput value in your code
        guessWeapon(userInput);
    });

    // Add a click event listener to the button
    submitButton.addEventListener('click', function () {
        // Get the input field value
        var userInput = inputField.value;
        inputField.value = '';

        // Check if the operator has already been guessed or empty or does not exist
        if (guessedWeapons.includes(userInput) || userInput === "") {
            console.log('This weapon has already been guessed.');
            return; // Exit the function early
        } else if (userInput === "") {
            console.log('InputField was empty.');
            return;
        } else if (!weaponNames.includes(userInput)) {
            console.log('This weapon does not exist.');
            return;
        }

        // Add the operator to the array of guessed operators
        guessedWeapons.push(userInput);
        console.log(userInput)
        // Now you can use the userInput value in your code
        guessWeapon(userInput);
    });
}

function displayWinningScreen() {
    // Get the endId element
    let endId = document.getElementById('endId');

    // Create the finished div
    let finishedDiv = document.createElement('div');
    finishedDiv.className = 'finished';

    // Create the empty div
    let emptyDiv = document.createElement('div');

    // Create the background-end div
    let backgroundEndDiv = document.createElement('div');
    backgroundEndDiv.className = 'background-end';

    // Create the gg div
    let ggDiv = document.createElement('div');
    ggDiv.className = 'gg';
    ggDiv.innerHTML = 'gg wp';

    // Create the gg-answer div
    let ggAnswerDiv = document.createElement('div');
    ggAnswerDiv.className = 'gg-answer';

    // Create the first inner div
    let firstInnerDiv = document.createElement('div');
    // Create the img
    let img = document.createElement('img');
    img.width = 200;
    img.className = "gg-icon";
    img.className = "gg-icon";
    var operatorName = selectedWeapon.name;
    img.src = `../images/weapons/${selectedWeapon.name.toLowerCase().replace('.', '_')}.avif`;
    firstInnerDiv.appendChild(img);

    // Create the second inner div
    let secondInnerDiv = document.createElement('div');

    // Create the gg-you span
    let ggYouSpan = document.createElement('span');
    ggYouSpan.className = 'gg-you';
    ggYouSpan.innerHTML = 'You guessed';
    secondInnerDiv.appendChild(ggYouSpan); // Append the gg-you span to the second inner div

    // Create the br
    let br = document.createElement('br');
    secondInnerDiv.appendChild(br); // Append the br to the second inner div

    // Create the gg-name div
    let ggNameDiv = document.createElement('div');
    ggNameDiv.className = 'gg-name';
    ggNameDiv.innerHTML = selectedWeapon.name; // Replace with the actual operator name
    secondInnerDiv.appendChild(ggNameDiv); // Append the gg-name div to the second inner div


    // Create the nth-tries div
    let nthTriesDiv = document.createElement('div');
    nthTriesDiv.className = 'nthtries';
    nthTriesDiv.innerHTML = 'Number of tries: ';

    // Create the nth span
    let nthSpan = document.createElement('span');
    nthSpan.className = 'nth';
    nthSpan.innerHTML = guesses

    // Create restart button
    let button = document.createElement('button')
    button.className = 'de_button'
    button.innerHTML = 'Restart'
    button.id = 'restartButton'



    // Append the elements to their parents
    ggAnswerDiv.appendChild(firstInnerDiv);
    ggAnswerDiv.appendChild(secondInnerDiv);
    backgroundEndDiv.appendChild(ggDiv);
    backgroundEndDiv.appendChild(ggAnswerDiv);
    backgroundEndDiv.appendChild(nthTriesDiv);
    nthTriesDiv.appendChild(nthSpan);
    if (localStorage.getItem('mode') == 'endless') {
        backgroundEndDiv.appendChild(button)
        restartButton();
    }
    emptyDiv.appendChild(backgroundEndDiv);
    finishedDiv.appendChild(emptyDiv);
    endId.appendChild(finishedDiv);
}

function restartButton() {
    // Get the button element
    var restartButton = document.getElementById('restartButton');

    // Check if the button exists
    if (restartButton) {
        // Add a click event listener to the button
        restartButton.addEventListener('click', function () {
            guessedWeapons = []
            selectedWeapon = randomWeapon()
            guesses = 0
            clear()
            setDmgBar(selectedWeapon);
            setMobBar(selectedWeapon);
            setFireRateBar(selectedWeapon);
            setMagSize(selectedWeapon)
            askForGuess();
            var event = new CustomEvent('clearUsedWeapons');
            window.dispatchEvent(event);
        });
    }
}
function clear() {
    let endId = document.getElementById('endId')
    let statsBar = document.getElementById('stats_bar')
    let hints = document.getElementById('hints')
    let guessedWeapons = document.getElementById('guessed_weapons')
    let guessedWeaponsElement = document.getElementById('guessed_weapons');
    statsBar.innerHTML = ''
    endId.innerHTML = ''
    hints.innerHTML = ''
    guessedWeapons.innerHTML = ''
    guessedWeapons = []
    guessedWeaponsHmtl = []
    guessedWeaponsElement.innerHTML = ''
    guessedWeaponsElement.style.display = 'contents'

}

document.addEventListener('DOMContentLoaded', function () {
    checkbox = document.querySelector('input[type="checkbox"]');

    checkbox.addEventListener('change', function () {
        var magSizeHint = document.getElementById('magSizeHint');
        var fireRateHint = document.getElementById('fireRateHint');
        var dmgHint = document.getElementById('dmgHint');
        var mobHint = document.getElementById('mobHint');

        if (this.checked) {
            magSizeHint.style.display = 'none';
            fireRateHint.style.display = 'none';
            dmgHint.style.display = 'none';
            mobHint.style.display = 'none';
        } else {
            magSizeHint.style.display = 'block';
            fireRateHint.style.display = 'block';
            dmgHint.style.display = 'block';
            mobHint.style.display = 'block';
        }
    });
});

// When a user solves a problem
function problemSolved() {
    if (localStorage.getItem('mode') === 'endless') {
        // Get the current streak from local storage
        let currentStreak = localStorage.getItem('weaponStreak');
        incrementGlobalSolved();

        // If there's no current streak, this is the first problem the user has solved
        if (!currentStreak) {
            currentStreak = 0;
        }
        console.log('before solved: ' + currentStreak)
        // Increment the streak
        currentStreak++;
        console.log('after solved: ' + currentStreak)
        // Save the new streak to local storage
        localStorage.setItem('streak', currentStreak);

        // Display the new streak
        document.getElementById('streakDisplay').textContent = `You solved Weapon-R6dle already ${currentStreak} times`;
    } else if (localStorage.getItem('mode') === 'daily') {
        incrementSolvedCount();
        // Increment the daily streak
        dailyStreakCount++;
        // Save the new daily streak to local storage
        localStorage.setItem('dailyWeaponStreakCount', dailyStreakCount.toString())
        // Display the new streak
        document.getElementById('dailyStreakDisplay').textContent = `Your daily streak increased and is now at ${dailyStreakCount}`;


    }
}

export function getGuessedWeapons() {
    if (!guessedWeapons) {
        guessedWeapons = [];
    }
    return guessedWeapons;
}   