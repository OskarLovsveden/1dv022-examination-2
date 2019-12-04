const template = document.createElement('template')
template.innerHTML = `
<div>
    <label for="quiztime" class="active">Write here:</label><br>
    <input type="text" id="quiztime">
    <datalist>
    </datalist>
</div>  
`

export class QuizTime extends window.HTMLElement {
  constructor () {
    super()

    this.attachShadow({
      mode: 'open'
    })
    this.shadowRoot.appendChild(template.content.cloneNode(true))

    this._url = 'http://vhost3.lnu.se:20080/question/'
  }

  static get observedAttributes () {
    return []
  }

  attributeChangedCallback (name, oldValue, newValue) {}

  connectedCallback () { this.checkUrl() }

  _updateRendering () {}

  async checkUrl () {
    const check = await window.fetch(`${this._url}`)
    console.log(check)
  }
}

window.customElements.define('quiz-time', QuizTime)
