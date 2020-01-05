const template = document.createElement('template')
template.innerHTML = `
<div id="questionDiv">
    <h1 id="currentQuestion"></h1>
    <label for="quiztime" class="active">Write here:</label><br>
    <input type="text" id="quiztime">
    <h1 id="answerKey"></h1>
</div>  
`

export class QuizTime extends window.HTMLElement {
  constructor () {
    super()

    this.attachShadow({
      mode: 'open'
    })
    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this._questionDiv = this.shadowRoot.querySelector('#questionDiv')
    this._questionUrl = 'http://vhost3.lnu.se:20080/question/1'
    this._answerUrl = ''

    this._answer = null
  }

  connectedCallback () {
    this._questionDiv.addEventListener('keypress', (event) => {
      if (event.keyCode === 13) {
        this._answer = event.target.value
        this._answerQuestion(this._answerUrl, { answer: `${this._answer}` })
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
    const response = await window.fetch(this._questionUrl)
    return response.json()
      .then((myJson) => {
        console.log(myJson)
        const currentQuestion = this._questionDiv.querySelector('#currentQuestion')
        currentQuestion.textContent = myJson.question
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
}

window.customElements.define('quiz-time', QuizTime)

// New template for radiobuttons?
// Check if question has alternatives or not and base presentation of that.
// More comments...
// Error handling on wrong answers
//
