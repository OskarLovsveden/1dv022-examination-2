const template = document.createElement('template')
template.innerHTML = `
<div id="questionDiv">
    <h1 id="currentQuestion"></h1>
    <label for="quiztime" class="active">Write here:</label><br>
    <input type="text" id="quiztime">
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

  static get observedAttributes () {
    return []
  }

  attributeChangedCallback (name, oldValue, newValue) {}

  connectedCallback () {
    this._questionDiv.addEventListener('keypress', (event) => {
      if (event.keyCode === 13) {
        this._answer = event.target.value
        event.preventDefault()
      }
    })
    this._getQuestion()
  }

  async _getQuestion () {
    const response = await window.fetch(this._questionUrl)
    return response.json()
      .then((myJson) => {
        console.log(myJson)
        const question = this._questionDiv.querySelector('#currentQuestion')
        question.textContent = myJson.question
        this._answerUrl = myJson.nextURL
      })
  }

  async _answerQuestion (url, data = { answer: 2 }) {
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
