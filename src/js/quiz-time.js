const template = document.createElement('template')
template.innerHTML = `
<style>
  #usernameDiv {
    position: absolute;
    z-index: 1;
    height: 100%;
    width: 50%;
    background-color: white;
    text-align: center;
  }
  #questionDiv {
    position: absolute;
    left: 0;
    z-index: 0;
    height: 100%;
    width: 50%;
    background-color: white;
    text-align: center;
  }
  #questionDiv input{
    text-align: center;
  }
  #topListDiv {
    position: absolute;
    right: 0;
    z-index: 0;
    height: 100%;
    width: 50%;
    background-color: white;
    text-align: center;
  }
  #topListDiv hr {
    width: 50%;
  }
</style>

<div id="usernameDiv">
  <h1>Quiz Time!</h1>
  <label for="username"><h2>Username:</h2></label>
  <input type="text" id="username" placeholder="Enter your name!" autocomplete="off">
  <button id="submitUsername">Start</button>
</div>
<div id="questionDiv">
  <h1>Quiz Time!</h1>
  <div id="content">
    <h2 id="playerName"></h2>
    <h2 id="question"></h2>
    <div id="currentQuestion"></div>
    <button id="submitAnswer">Submit Answer</button>
    <h1 id="answerKey"></h1>
    <h3 id="timer"></h3>
    <h1 id="timesUp"></h1>
  </div>
  <button id="restart">Restart</button>
</div>
<div id="topListDiv">
  <h1>Toplist:</h1>
  <div id="topFive"></div>
</div>
`
const inputTemplate = document.createElement('template')
inputTemplate.innerHTML = `
<label for="quiztime">Type your answer below:</label><br>
<input type="text" id="quiztime" autocomplete="off">
`
const radioTemplate = document.createElement('template')
radioTemplate.innerHTML = `
<input type="radio">
`
/**
 * Custom element representing a Quiz.
 *
 * @export
 * @class QuizTime
 * @extends {window.HTMLElement}
 */
export class QuizTime extends window.HTMLElement {
  constructor () {
    super()

    this.attachShadow({
      mode: 'open'
    })
    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this._questionDiv = this.shadowRoot.querySelector('#questionDiv')
    this._currentQuestionDiv = this.shadowRoot.querySelector('#currentQuestion')
    this._submitAnswer = this.shadowRoot.querySelector('#submitAnswer')
    this._usernameDiv = this.shadowRoot.querySelector('#usernameDiv')
    this._submitUsernameBtn = this.shadowRoot.querySelector('#submitUsername')
    this._usernameInput = this.shadowRoot.querySelector('#username')
    this._timerText = this.shadowRoot.querySelector('#timer')
    this._content = this.shadowRoot.querySelector('#content')
    this._topFiveDiv = this.shadowRoot.querySelector('#topFive')
    this._restartBtn = this.shadowRoot.querySelector('#restart')

    this._questionUrl = 'http://vhost3.lnu.se:20080/question/1'
    this._answerUrl = ''

    this._username = ''
    this._answer = null
    this._timerCount = 20
    this._score = null
    this._topList = []
    this._numOfQuestions = null
    this._correctanswers = null
    this._timer = null
    this._timesUp = false
  }

  connectedCallback () {
    this._presentTopList()
    this._addUsernameEvent()
    this._usernameInput.focus()

    this._questionDiv.addEventListener('keypress', (event) => {
      if (!this._timesUp) {
        if (event.keyCode === 13) {
          this._answer = event.target.value
          this._answerQuestion(this._answerUrl, {
            answer: `${this._answer}`
          })
            .then((data) => {
              this._getNextQuestion(data)
            })
          event.preventDefault()
        }
      }
    })

    this._submitAnswer.addEventListener('click', () => {
      if (!this._timesUp) {
        const inputs = this._currentQuestionDiv.querySelectorAll('input')
        for (let i = 0; i < inputs.length; i++) {
          if (inputs[i].checked) {
            this._answer = inputs[i].value
          }
          if (inputs[i].type === 'text') {
            this._answer = inputs[i].value
          }
        }
        this._answerQuestion(this._answerUrl, {
          answer: `${this._answer}`
        })
          .then((data) => {
            this._getNextQuestion(data)
          })
      }
    })

    this._restartBtn.addEventListener('click', () => {
      this._restart()
    })
  }

  /**
   * Gets the next question in line.
   *
   * @returns An Object with the data of the next question in line.
   * @memberof QuizTime
   */
  async _getQuestion () {
    this._numOfQuestions += 1

    this._currentQuestionDiv.innerHTML = ''
    const response = await window.fetch(this._questionUrl)

    return response.json()
      .then((myJson) => {
        if (myJson.alternatives) {
          this._radioButtons(myJson.alternatives)
        } else {
          const text = inputTemplate.content.cloneNode(true)
          this._currentQuestionDiv.appendChild(text)
        }
        const question = this._questionDiv.querySelector('#question')
        question.textContent = myJson.question

        this._answerUrl = myJson.nextURL

        this._score += (20 - this._timerCount)
        this._timerCount = 20
        clearInterval(this._timer)
        this._timer = setInterval(this._timerUpdate.bind(this), 1000)
      })
  }

  /**
   * Sends the answer of the current question to the specified URL.
   *
   * @param {string} url - The URL to send the answer to.
   * @param {Object} data - The answer to be sent.
   * @returns An object corresponding to right/wrong answer.
   * @memberof QuizTime
   */
  async _answerQuestion (url, data) {
    const response = await window.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    return response.json()
  }

  /**
   * Runs if the current question has multiple choices.
   *
   * @param {Object} data - Object with the alternatives available for the current question.
   * @memberof QuizTime
   */
  _radioButtons (data) {
    const alts = Object.entries(data)
    let id = 0

    for (const [key, value] of Object.entries(data)) {
      id += 1

      const radio = radioTemplate.content.cloneNode(true)

      radio.firstElementChild.setAttribute('id', `${id}`)
      radio.firstElementChild.setAttribute('name', 'alternative')
      radio.firstElementChild.setAttribute('value', `${key}`)

      const label = document.createElement('label')
      label.setAttribute('for', `${id}`)
      label.textContent = ` ${value}`

      const br = document.createElement('br')

      this._currentQuestionDiv.appendChild(radio)
      this._currentQuestionDiv.appendChild(label)

      if (id < alts.length) {
        this._currentQuestionDiv.appendChild(br)
      }
    }
  }

  /**
   * Updates the timer for the quiz and prints it.
   *
   * @memberof QuizTime
   */
  _timerUpdate () {
    this._timerText.textContent = `Time left: ${this._timerCount}`
    this._timerCount--
    if (this._timerCount === -1) {
      clearInterval(this._timer)
      this._timesUp = true
      this.shadowRoot.querySelector('#timesUp').innerText = 'Times up... Restart to try again!'
    }
  }

  /**
   * Adds the event for submitting the entered username.
   *
   * @memberof QuizTime
   */
  _addUsernameEvent () {
    this._submitUsernameBtn.addEventListener('click', () => {
      this._validateUsername()
    })

    this._usernameDiv.addEventListener('keypress', (event) => {
      if (event.keyCode === 13) {
        this._validateUsername()
        event.preventDefault()
      }
    })
  }

  /**
   * Validates the entered username.
   *
   * @memberof QuizTime
   */
  _validateUsername () {
    if (/\S/.test(this._usernameInput.value)) {
      this._usernameDiv.style.zIndex = '-1'
      this._questionDiv.querySelector('#playerName').textContent = this._usernameInput.value
      this._username = this._usernameInput.value
      this._getQuestion()
    } else {
      this._usernameInput.focus()
    }
  }

  /**
   * Gets the next question if available.
   *
   * @param {Object} data - An object with the next questions data.
   * @memberof QuizTime
   */
  _getNextQuestion (data) {
    this._questionDiv.querySelector('#answerKey').textContent = data.message

    if (data.message === 'Correct answer!') {
      this._correctanswers += 1
    }

    if (data.message === 'Wrong answer! :(') {
      clearInterval(this._timer)
      this._timesUp = true

      this.shadowRoot.querySelector('#timesUp').innerHTML = 'Wrong answers are bad! Start again :c'
    }

    if (data.nextURL) {
      this._questionUrl = data.nextURL
      this._getQuestion()
    } else {
      if (
        this._numOfQuestions === this._correctanswers &&
        this._numOfQuestions !== null &&
        this._correctanswers !== null
      ) {
        this.shadowRoot.querySelector('#timesUp').innerText = 'Good job! All questions were answered correctly!'
        this._questionUrl = 'http://vhost3.lnu.se:20080/question/1'

        clearInterval(this._timer)

        this._setStats()
        this._presentTopList()
      }
    }
  }

  /**
   * Stores the current players stats to localstorage.
   *
   * @memberof QuizTime
   */
  _setStats () {
    window.localStorage.setItem(this._username, this._score)
  }

  /**
   * Gets the scores from localstorage and sorts them in an array.
   *
   * @memberof QuizTime
   */
  _getStats () {
    this._topList = []
    for (var i = 0; i < window.localStorage.length; i++) {
      const currentStat = {}

      currentStat.username = window.localStorage.key(i)
      currentStat.score = Number(window.localStorage[window.localStorage.key(i)])

      this._topList.push(currentStat)
      this._topList.sort((a, b) => (a.score > b.score) ? 1 : ((b.score > a.score) ? -1 : 0))
    }
  }

  /**
   * Presents the current toplist in the DOM.
   *
   * @memberof QuizTime
   */
  _presentTopList () {
    this._topFiveDiv.textContent = ''
    if (window.localStorage.key(0)) {
      this._getStats()

      for (let i = 0; i < window.localStorage.length && i < 5; i++) {
        const hr = document.createElement('hr')

        const userh5 = document.createElement('h5')
        userh5.innerText = `Username: ${this._topList[i].username}`

        const scoreh5 = document.createElement('h5')
        scoreh5.innerText = `Time: ${this._topList[i].score}`

        this._topFiveDiv.appendChild(userh5)
        this._topFiveDiv.appendChild(scoreh5)
        this._topFiveDiv.appendChild(hr)
      }
    }
  }

  /**
   * Restarts the game.
   *
   * @memberof QuizTime
   */
  _restart () {
    this._questionUrl = 'http://vhost3.lnu.se:20080/question/1'
    this._answer = null
    this._timerCount = 20
    this._score = null
    this._numOfQuestions = null
    this._correctanswers = null
    this._timesUp = false
    clearInterval(this._timer)

    this.shadowRoot.querySelector('#answerKey').innerHTML = ''
    this.shadowRoot.querySelector('#timesUp').innerHTML = ''

    this._usernameDiv.style.zIndex = '1'
    this._usernameInput.value = ''
    this._usernameInput.focus()
  }
}

window.customElements.define('quiz-time', QuizTime)
