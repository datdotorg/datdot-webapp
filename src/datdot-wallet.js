const bel = require('bel')
const csjs = require('csjs-inject')
const make_grid = require('make-grid')
const message_maker = require('message-maker')
const make_element = require('make-element')
const style_sheet = require('support-style-sheet')
// components
const i_container = require('container')
const i_footer = require('footer')

module.exports = wallet

function wallet () {
  const nav_option = [
    {
        name: 'user',
        body: 'USER',
        current: false
    },
    {
        name: 'plans',
        body: 'PLANS',
        current: true
    },
    {
        name: 'jobs',
        body: 'JOBS',
    },
    {
        name: 'apps',
        body: 'APPS',
        disabled: true,
    }
  ]

  const status = {
    activities: 12345,
    plan: '19v8cMTwMjYvVQgtmZo91gxagp43Pv7XSc'
  }

  function widget () {
    const recipients = []
    const make = message_maker('datdot-wallet')
    const css = style
    // const el = bel`<main class=${css.wrap}></main>`
    const el = make_element({name: 'main', classlist: 'wrap'})
    const shadow = el.attachShadow({mode: 'closed'})
    const container = i_container({name: 'wallet-container'}, protocol('wallet-container'))
    const footer = i_footer({name: 'wallet-footer', body: { nav: nav_option, status }, to: 'wallet-container'}, protocol('wallet-footer'))
    style_sheet(shadow, style)
    shadow.append(container, footer)
    return el

    function protocol (name) {
      return send => {
        recipients[name] = send
        return get
      }
    }
    function get (msg) {
      const {head, type, refs, meta, data} = msg
      const from = head[0].split(' / ')[0]
      if (type.match(/ready/)) return 
      if (type.match(/click/)) return
      if (type.match(/switch-page/)) return recipients[data.controls](make({type: 'load-page', data: data.page}))
    }

  }

  let style = `
  :host(.wrap) {
    display: grid;
    ${make_grid({
      rows: '1fr auto',
      areas: ['container', 'nav']
    })}
    height: 100%;
  }
  i-container {
    grid-area: container;
  }
  i-nav {
    grid-area: nav;
  }
  `
  return widget()
}