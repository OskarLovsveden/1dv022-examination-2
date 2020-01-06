const template = document.createElement('template')
template.innerHTML = `
<h1>Quiz Time!</h1>
<div id="usernameDiv">
  <label for="username">Username:</label><br>
  <input type="text" id="username" placeholder="Enter your name!">
  <button id="submitUsername">Start</button>
</div>
<div id="questionDiv">
    <h2 id="question"></h2>
    <h3 id="timer"></h3>
    <div id="currentQuestion"></div>
    <button id="submitAnswer">Submit Answer</button>
    <h1 id="answerKey"></h1>
</div>
`
const inputTemplate = document.createElement('template')
inputTemplate.innerHTML = `
<label for="quiztime">Write here:</label><br>
<input type="text" id="quiztime">
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
    this._currentQuestionDiv = this._questionDiv.querySelector('#currentQuestion')
    this._submitAnswer = this._questionDiv.querySelector('#submitAnswer')
    this._usernameDiv = this.shadowRoot.querySelector('#usernameDiv')
    this._submitUsernameBtn = this.shadowRoot.querySelector('#submitUsername')
    this._usernameInput = this.shadowRoot.querySelector('#username')
    this._timerText = this.shadowRoot.querySelector('#timer')

    this._questionUrl = 'http://vhost3.lnu.se:20080/question/1'
    this._answerUrl = ''

    this._username = ''
    this._answer = null
    this._timerCount = 20
    this._score = null
    this._playerStats = null
    this._numOfQuestions = null
    this._correctanswers = null

    this._timer = null
  }

  connectedCallback () {
    this._questionDiv.addEventListener('keypress', (event) => {
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
    })

    this._submitAnswer.addEventListener('click', () => {
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
    })

    this._addUsernameEvent()
    this._usernameInput.focus()
  }

  /**
   * Gets the next question in line.
   *
   * @returns An Object with the data of the next question in line.
   * @memberof QuizTime
   */
  async _getQuestion () {
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
        console.log(this._score)
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
      console.log('TIMES UP!')
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
      this._usernameDiv.innerHTML = `<h3>Username: ${this._usernameInput.value}</h3>`
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
    console.log('runs')
    this._questionDiv.querySelector('#answerKey').textContent = data.message
    if (data.nextURL) {
      this._questionUrl = data.nextURL
      this._getQuestion()
    } else {
      // IF SCORE > 0, store username and score as an object in this._playerStats
      if (this._score > 0) {
        console.log('store this shit')
      }
    }
  }
}

window.customElements.define('quiz-time', QuizTime)

// Error handling on wrong answers? not prio
// keep score, local storage - object data = { username: score }
