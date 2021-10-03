module.exports = head

function head (lang = 'UTF-8', title = 'Datdot wallet') {
    document.documentElement.lang = 'en'
    document.title = title
    const lan = document.createElement('meta')
    const viewport = document.createElement('meta')
    const description = document.createElement('meta')
    lan.setAttribute('charset', lang)
    viewport.setAttribute('name', 'viewport')
    viewport.setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no')
    description.setAttribute('name', 'description')
    description.setAttribute('content', 'DatDot Wallet is a crypto wallet for datdot')
    document.head.append(lan, viewport, description)
}