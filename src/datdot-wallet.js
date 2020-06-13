const bel = require('bel')
const csjs = require('csjs-inject')

// components
const template = require('layout')

module.exports = wallet

function wallet () {
  const css = style
  const el = bel`
  <main class=${css.wrap}>
    <h1>datdot-wallet </h1>
    <p>${location.href}</p>
    ${template()}
  </main>
  `
  return document.body.append(el)
}

let style = csjs`
*, *:before, *:after { box-sizing: inherit; }
html {
  font-size: 62.5%;
  box-sizing: border-box;
}
body {
  font-size: 1.2rem;
  margin: 0;
}
.wrap {

}
h1, h2, h3, h4, h5, h6 {
  margin: 0;
  padding: 0;
}
button {
  border: none;
  padding: 8px 22px;
  font-size: 1.4rem;
  cursor: pointer;
}
`