const template = document.createElement('template')
template.innerHTML = `
<div id="questionDiv">
    <h1 id="question"></h1>
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

    this._questionUrl = 'http://vhost3.lnu.se:20080/question/21'
    this._answerUrl = ''

    this._answer = null
  }

  connectedCallback () {
    this._questionDiv.addEventListener('keypress', (event) => {
      if (event.keyCode === 13) {
        this._answer = event.target.value
        this._answerQuestion(this._answerUrl, {
          answer: `${this._answer}`
        })
          .then((data) => {
            console.log(data)
            this._questionDiv.querySelector('#answerKey')
          })
        event.preventDefault()
      }
    })

    this._getQuestion()
  }

  /**
   * Returns a response based of the current questions URL and parses it.
   *
   * @returns A promise
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
      })
  }

  /**
   * Sends the answer of the current question to the specified URL.
   *
   * @param {string} url - The URL to send the answer to.
   * @param {Object} data - The answer to be sent.
   * @returns A promise
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
    const alts = Object.values(data)

    for (let i = 0; i < alts.length; i++) {
      const radio = radioTemplate.content.cloneNode(true)

      radio.firstElementChild.setAttribute('id', `${i}`)
      radio.firstElementChild.setAttribute('name', 'alternative')
      radio.firstElementChild.setAttribute('value', `${alts[i]}`)

      const label = document.createElement('label')
      label.setAttribute('for', `${i}`)
      label.textContent = ` ${alts[i]}`

      const br = document.createElement('br')

      this._currentQuestionDiv.appendChild(radio)
      this._currentQuestionDiv.appendChild(label)

      if (i < alts.length - 1) {
        this._currentQuestionDiv.appendChild(br)
      }
    }
  }
}

window.customElements.define('quiz-time', QuizTime)

// More comments...
// Error handling on wrong answers
// timer
// keep score, local storage?
