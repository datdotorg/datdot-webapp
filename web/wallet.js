const wallet = require('..')
const head = require('./head')()
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
const el = wallet({nav: nav_option})
document.body.append(el)
// fetch('http://localhost:9966/').then( x => x.text()).then(x => {
//   console.log({x})
// })
