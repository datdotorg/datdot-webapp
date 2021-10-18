(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_img = require('make-image')
const make_element = require('make-element')
const {main_icon, select_icon, list_icon} = require('make-icon')
const make_grid = require('make-grid')

module.exports = {i_button, i_link}

function i_link (opt, protocol) {
    const {page = '*', flow = 'ui-link', name, role='link', body, link = {}, icons = {}, classlist, cover, disabled = false, theme = {}} = opt
    const { icon } = icons
    const make_icon = 'icon' in icons ? main_icon(icon) : undefined
    let {url = '#', target = '_self'} = link
    let is_disabled = disabled

    function widget () {
        const send = protocol(get)
        const make = message_maker(`${name} / ${role} / ${flow} / ${page}`)
        const message = make({to: 'demo.js', type: 'ready'})
        const el = make_element({name: 'i-link', role})
        const shadow = el.attachShadow({mode: 'closed'})
        const text = make_element({name: 'span', classlist: 'text'})
        const avatar = make_element({name: 'span', classlist: 'avatar'})
        text.append(body)
        el.setAttribute('aria-label', body)
        el.setAttribute('href', url)
        if (is_disabled) set_attr ({aria: 'disabled', prop: is_disabled})
        if (!target.match(/self/)) el.setAttribute('target', target)
        if (classlist) el.classList.add(classlist)
        style_sheet(shadow, style)
        // check icon, cover and body if has value
        const add_cover = typeof cover === 'string' ? avatar : undefined
        const add_icon = icon ? make_icon : undefined
        const add_text = body ? typeof body === 'string' && (add_icon || add_cover ) ? text : body : typeof body === 'object' && body.localName === 'div' ? body : undefined
        if (typeof cover === 'string') avatar.append(make_img({src: cover, alt: name}))
        if (typeof cover === 'object') send(make({type: 'error', data: `cover[${typeof cover}] must to be a string`}))
        if (add_icon) shadow.append(make_icon)
        if (add_cover) shadow.append(add_cover)
        if (add_text) shadow.append(add_text)
        send(message)
        if (!is_disabled) el.onclick = handle_open_link
        return el

        function set_attr ({aria, prop}) {
            el.setAttribute(`aria-${aria}`, prop)
        }
    
        function handle_open_link () {
            if (target.match(/_/)) {
                window.open(url, target)
            }
            if (target.match(/#/) && target.length > 1) {
                const el = document.querySelector(target)
                el.src = url
            }
            send(make({type: 'go to', data: {url, window: target}}))
        }

        // protocol get msg
        function get (msg) {
            const { head, refs, type, data } = msg
        }

    }

    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    const {props = {}, grid = {}} = theme
    const {
        // default        
        padding, margin, width, height, opacity,
        // size
        size, size_hover, disabled_size,
        // weight
        weight, weight_hover, disabled_weight,
        // color
        color, color_hover, color_focus, disabled_color,
        // background-color    
        bg_color, bg_color_hover, disabled_bg_color,
        // deco
        deco, deco_hover, disabled_deco,
        // border
        border_width, border_style, border_opacity, 
        border_color, border_color_hover, border_radius,
        // shadowbox
        shadow_color, shadow_color_hover,
        offset_x, offset_y, offset_x_hover, offset_y_hover, 
        blur, blur_hover, shadow_opacity, shadow_opacity_hover,
        // icon
        icon_size, icon_size_hover, disabled_icon_size,
        icon_fill, icon_fill_hover, disabled_icon_fill,
        // avatar
        avatar_width, avatar_height, avatar_radius, 
        avatar_width_hover, avatar_height_hover,
        scale, scale_hover
    } = props

    const grid_link = grid.link ? grid.link : {auto: {auto_flow: 'column'}, align: 'items-center', gap: '4px'}
    const style = `
    :host(i-link) {
        --size: ${size ? size : 'var(--link-size)'};
        --weight: ${weight ? weight : 'var(--weight300)'};
        --color: ${color ? color : 'var(--link-color)'};
        --color-focus: ${color_focus ? color_focus : 'var(--link-color-focus)'};
        --bg-color: ${bg_color ? bg_color : 'var(--link-bg-color)'};
        --opacity: ${opacity ? opacity : '0'};
        --deco: ${deco ? deco : 'none'};
        --padding: ${padding ? padding : '0'};
        --margin: ${margin ? margin : '0'};
        --icon-size: ${icon_size ? icon_size : 'var(--link-icon-size)'};
        display: inline-grid;
        font-size: var(--size);
        font-weight: var(--weight);
        color: hsl(var(--color));
        background-color: hsla(var(--bg-color), var(--opacity));
        text-decoration: var(--deco);
        padding: var(--padding);
        margin: var(--margin);
        transition: color .5s, background-color .5s, font-size .5s, font-weight .5s, opacity .5s ease-in-out;
        cursor: pointer;
        ${make_grid(grid_link)}
    }
    :host(i-link:hover) {
        --color: ${color_hover ? color_hover : 'var(--link-color-hover)'};
        --size: ${size_hover ? size_hover : 'var(--link-size-hover)'};
        --deco: ${deco_hover ? deco_hover : 'underline'};
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--color-white)'};
        --opacity: ${opacity ? opacity : '0'};
        text-decoration: var(--deco);
    }
    :host(i-link:focus) {
        --color: ${color_focus ? color_focus : 'var(--link-color-focus)'};
    }
    :host(i-link) img {
        --scale: ${scale ? scale : '1'};
        width: 100%;
        height: 100%;
        transform: scale(var(--scale));
        transition: transform 0.3s linear;
        object-fit: cover;
        border-radius: var(--avatar-radius);
    }
    :host(i-link:hover) img {
        --scale: ${scale_hover ? scale_hover : '1.2'};
    }
    :host(i-link) svg {
        width: 100%;
        height: auto;
    }
    :host(i-link) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--link-icon-fill)'};
        fill: hsl(var(--icon-fill));
        transition: fill 0.05s ease-in-out;
    }
    :host(i-link:hover) g, :host(i-link:hover) path{
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--link-icon-fill-hover)'};
    }
    :host(i-link) .text {
        ${make_grid(grid.text)}
    }
    :host(i-link) .icon {
        width: var(--icon-size);
        max-width: 100%;
        ${make_grid(grid.icon)}
    }
    :host(i-link:hover) .icon {
        --icon-size: ${icon_size_hover ? icon_size_hover : 'var(--link-icon-size)'};
    }
    :host(i-link) .avatar {
        --avatar-width: ${avatar_width ? avatar_width : 'var(--link-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--link-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--link-avatar-radius)'};
        display: block;
        width: var(--avatar-width);
        height: var(--avatar-height);
        border-radius: var(--avatar-radius);
        -webkit-mask-image: -webkit-radial-gradient(center, white, black);
        max-width: 100%;
        max-height: 100%;
        ${make_grid(grid.avatar)}
        transition: width 0.2s, height 0.2s linear;
    }
    :host(i-link:hover) .avatar {
        --avatar-width: ${avatar_width_hover ? avatar_width_hover : 'var(--link-avatar-width-hover)'};
        --avatar-height: ${avatar_height_hover ? avatar_height_hover : 'var(--link-avatar-height-hover)'};
    }
    :host(i-link[role="menuitem"]) {
        --size: ${size ? size : 'var(--menu-size)'};
        --color: ${color ? color : 'var(--menu-color)'};
        --weight: ${weight ? weight : 'var(--menu-weight)'};
        background-color: transparent;
    }
    :host(i-link[role="menuitem"]:hover) {
        --size: ${size ? size : 'var(--menu-size-hover)'};
        --color: ${color_hover ? color_hover : 'var(--menu-color-hover)'};
        --weight: ${weight ? weight : 'var(--menu-weight-hover)'};
        text-decoration: none;
        background-color: transparent;
    }
    :host(i-link[role="menuitem"]:focus) {
        --color: var(--color-focus);
    }
    :host(i-link[role="menuitem"]) .icon {
        --icon-size: ${icon_size ? icon_size : 'var(--menu-icon-size)'};
    }
    :host(i-link[role="menuitem"]) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--menu-icon-fill)'};
    }
    :host(i-link[role="menuitem"]:hover) g {
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--menu-icon-fill-hover)'};
    }
    :host(i-link[aria-disabled="true"]), :host(i-link[aria-disabled="true"]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--link-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--link-disabled-color)'};
        text-decoration: none;
        cursor: not-allowed;
    }
    :host(i-link[disabled]) g,
    :host(i-link[disabled]) path,
    :host(i-link[disabled]:hover) g,
    :host(i-link[disabled]:hover) path,
    :host(i-link[role][disabled]) g,
    :host(i-link[role][disabled]) path,
    :host(i-link[role][disabled]:hover) g,
    :host(i-link[role][disabled]:hover) path
    {
        --icon-fill: ${disabled_icon_fill ? disabled_icon_fill : 'var(--link-disabled-icon-fill)'};
    }
    :host(i-link[disabled]) .avatar {
        opacity: 0.6;
    }
    :host(i-link.right) {
        flex-direction: row-reverse;
    }
    ${custom_style}
    `
    return widget()
}

function i_button (opt, protocol) {
    const {page = "*", flow = 'ui-button', name, role = 'button', controls, body = '', icons = {}, cover, classlist = null, mode = '', state, expanded = false, current = undefined, selected = false, checked = false, disabled = false, theme = {}} = opt
    const {icon, select = {}, list = {}} = icons
    const make_icon = icon ? main_icon(icon) : undefined
    if (role === 'listbox') var make_select_icon = select_icon(select)
    if (role === 'option') var make_list_icon = list_icon(list)
    let is_current = current
    let is_checked = checked
    let is_disabled = disabled
    let is_selected = selected
    let is_expanded = 'expanded' in opt ? expanded : void 0

    function widget () {
        const send = protocol(get)
        const make = message_maker(`${name} / ${role} / ${flow} / ${page}`)
        const data = role === 'tab' ?  {selected: is_current ? 'true' : is_selected, current: is_current} : role === 'switch' ? {checked: is_checked} : role === 'listbox' ? {expanded: is_expanded} : disabled ? {disabled} : role === 'option' ? {selected: is_selected, current: is_current} : null
        const message = make({to: 'demo.js', type: 'ready', data})
        send(message)
        const el = make_element({name: 'i-button', classlist, role })
        const shadow = el.attachShadow({mode: 'closed'})
        const text = make_element({name: 'span', classlist: 'text'})
        const avatar = make_element({name: 'span', classlist: 'avatar'})
        const listbox = make_element({name: 'span', classlist: 'listbox'})
        const option = make_element({name: 'span', classlist: 'option'})
        // check icon, img and body if has value
        const add_cover = typeof cover === 'string' ? avatar : undefined
        const add_text = body ? typeof body === 'object' ? 'undefined' : text : undefined
        if (typeof cover === 'string') avatar.append(make_img({src: cover, alt: name}))
        if (typeof cover === 'object') send(make({type: 'error', data: `cover[${typeof cover}] must to be a string`}))
        if (typeof body === 'object') send(make({type: 'error', data: {body: `content is an ${typeof body}`, content: body }}))
        if (!is_disabled) el.onclick = handle_click
        el.setAttribute('aria-label', name)
        text.append(body)
        style_sheet(shadow, style)
        append_items()
        init_attr()
        return el

        function init_attr () {
            // define conditions
            if (state) set_attr({aria: 'aria-live', prop: 'assertive'})
            if (role === 'tab') {
                set_attr({aria: 'selected', prop: is_selected})
                set_attr({aria: 'controls', prop: controls})
                el.setAttribute('tabindex', is_current ? 0 : -1)
            }
            if (role === 'switch') set_attr({aria: 'checked', prop: is_checked})
            if (role === 'listbox') set_attr({aria: 'haspopup', prop: role})
            if (disabled) {
                set_attr({aria: 'disabled', prop: is_disabled})
                el.setAttribute('disabled', is_disabled)
            } 
            if (is_checked) set_attr({aria: 'checked', prop: is_checked})
            if (role.match(/option/)) {
                is_selected = is_current
                set_attr({aria: 'selected', prop: is_selected})
            }
            if ('expanded' in opt) {
                set_attr({aria: 'expanded', prop: is_expanded})
            }
            // make current status
            if (current !== undefined) set_attr({aria: 'current', prop: is_current})
        }

        function set_attr ({aria, prop}) {
            el.setAttribute(`aria-${aria}`, prop)
        }

        // make element to append into shadowDOM
        function append_items() {           
            const items = [make_icon, add_cover, add_text]
            const target = role === 'listbox' ? listbox : role === 'option' ?  option : shadow
            // list of listbox or dropdown menu
            if (role.match(/option/)) shadow.append(make_list_icon, option)
            // listbox or dropdown button
            if (role.match(/listbox/)) shadow.append(make_select_icon, listbox)
            items.forEach( item => {
                if (item === undefined) return
                target.append(item)
            })
        }

        // toggle
        function switched_event (data) {
            const {checked} = data
            is_checked = checked
            if (!is_checked) return el.removeAttribute('aria-checked')
            set_attr({aria: 'checked', prop: is_checked})
        }
        function expanded_event (data) {
            is_expanded = data
            set_attr({aria: 'expanded', prop: is_expanded})
        }
        function collapsed_event (data) {
            is_expanded = data
            set_attr({aria: 'expanded', prop: is_expanded})
        }
        // tab selected
        function tab_selected_event ({selected}) {
            is_selected = selected
            set_attr({aria: 'selected', prop: is_selected})
            el.setAttribute('tabindex', is_current ? 0 : -1)
        }
        function list_selected_event (state) {
            is_selected = state
            set_attr({aria: 'selected', prop: is_selected})
            if (mode === 'single-select') {
                is_current = is_selected
                set_attr({aria: 'current', prop: is_current})
            }
            // option is selected then send selected items to listbox button
            if (is_selected) send(make({to: 'listbox', type: 'changed', data: {text: body, cover, icon} }))
        }
        function changed_event (data) {
            const {text, cover, icon} = data
            const new_text = make_element({name: 'span', classlist: 'text'})
            const new_avatar = make_element({name: 'span', classlist: 'avatar'})
            // change content for button or switch or tab
            if (role.match(/button|switch|tab/)) {
                const old_icon = shadow.querySelector('.icon')
                const old_avatar = shadow.querySelector('.avatar')
                const old_text = shadow.querySelector('.text')
                if (old_text) {
                    if (text) old_text.textContent = text
                }
                if (cover) {
                    if (old_avatar) {
                        const img = old_avatar.querySelector('img')
                        img.alt = text
                        img.src = cover
                    } else {
                        new_avatar.append(make_img({src: cover, alt: text}))
                        shadow.insertBefore(new_avatar, shadow.firstChild)
                    }
                }
                if (icon) {
                    const new_icon = main_icon(icon)
                    if (old_icon) old_icon.parentNode.replaceChild(new_icon, old_icon)
                    else shadow.insertBefore(new_icon, shadow.firstChild)
                } 
            }
            // change content for listbox
            if (role.match(/listbox/)) {
                listbox.innerHTML = ''
                if (icon) {
                    const new_icon = main_icon(icon)
                    if (role.match(/listbox/)) listbox.append(new_icon)
                }
                if (cover) {
                    new_avatar.append(make_img({src: cover, alt: text}))
                    if (role.match(/listbox/)) listbox.append(new_avatar)
                }
                if (text) {
                    new_text.append(text)
                    if (role.match(/listbox/)) listbox.append(new_text)
                }
            } 
        }
        // button click
        function handle_click () {
            const type = 'click'
            if ('current' in opt) {
                send( make({to: controls, type: 'current', data: {name, current: is_current}}) )
            }
            if ('expanded' in opt) {
                const type = !is_expanded ? 'expanded' : 'collapsed'
                send( make({type, data: {name, expanded: is_expanded}}))
            }
            if (role === 'button') {
                return send( make({type, to: controls} ))
            }
            if (role === 'tab') {
                if (is_current) return
                is_selected = !is_selected
                return send( make({to: controls, type, data: {name, selected: is_selected}}) )
            }
            if (role === 'switch') {
                return send( make({to: controls, type, data: {name, checked: is_checked}}) )
            }
            if (role === 'listbox') {
                is_expanded = !is_expanded
                return send( make({type, data: {name, expanded: is_expanded}}))
            }
            if (role === 'option') {
                is_selected = !is_selected
                return send( make({to: controls, type, data: {name, selected: is_selected, content: is_selected ? {text: body, cover, icon} : '' }}) )
            }
        }
        // protocol get msg
        function get (msg) {
            const { head, refs, type, data } = msg
            // toggle
            if (type.match(/switched/)) return switched_event(data)
            // dropdown
            if (type.match(/expanded/)) return expanded_event(data)
            if (type.match(/collapsed/)) return collapsed_event(data)
            // tab, checkbox
            if (type.match(/tab-selected/)) return tab_selected_event(data)
            // option
            if (type.match(/selected|unselected/)) return list_selected_event(data)
            if (type.match(/changed/)) return changed_event(data)
            if (type.match(/current/)) {
                is_current = data
                return set_attr({aria: 'current', prop: is_current})
            }
        }
    }
   
    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    const {props = {}, grid = {}} = theme
    const {
        // default -----------------------------------------//
        padding, margin, width, height, opacity, 
        // size
        size, size_hover, 
        // weight
        weight, weight_hover, 
        // color
        color, color_hover, color_focus,
        // background-color
        bg_color, bg_color_hover, bg_color_focus,
        // border
        border_color, border_color_hover,
        border_width, border_style, border_opacity, border_radius, 
        // icon
        icon_fill, icon_fill_hover, icon_size, icon_size_hover,
        // avatar
        avatar_width, avatar_height, avatar_radius,
        avatar_width_hover, avatar_height_hover,
        // shadow
        shadow_color, shadow_color_hover, 
        offset_x, offset_x_hover,
        offset_y, offset_y_hover, 
        blur, blur_hover,
        shadow_opacity, shadow_opacity_hover,
        // scale
        scale, scale_hover,
        // current -----------------------------------------//
        current_size, 
        current_weight, 
        current_color, 
        current_bg_color,
        current_icon_size,
        current_icon_fill,
        current_list_selected_icon_size,
        current_list_selected_icon_fill,
        current_avatar_width, 
        current_avatar_height,
        // disabled -----------------------------------------//
        disabled_size, disabled_weight, disabled_color,
        disabled_bg_color, disabled_icon_fill, disabled_icon_size,
        // role === option ----------------------------------//
        list_selected_icon_size, list_selected_icon_size_hover,
        list_selected_icon_fill, list_selected_icon_fill_hover,
        // role === listbox ----------------------------------//
        // collapsed settings
        listbox_collapsed_bg_color, listbox_collapsed_bg_color_hover,
        listbox_collapsed_icon_size, listbox_collapsed_icon_size_hover,
        listbox_collapsed_icon_fill, listbox_collapsed_icon_fill_hover, 
        listbox_collapsed_listbox_color, listbox_collapsed_listbox_color_hover,
        listbox_collapsed_listbox_size, listbox_collapsed_listbox_size_hover,
        listbox_collapsed_listbox_weight, listbox_collapsed_listbox_weight_hover,
        listbox_collapsed_listbox_icon_size, listbox_collapsed_listbox_icon_size_hover,
        listbox_collapsed_listbox_icon_fill, listbox_collapsed_listbox_icon_fill_hover,
        listbox_collapsed_listbox_avatar_width, listbox_collapsed_listbox_avatar_height,
        // expanded settings
        listbox_expanded_bg_color,
        listbox_expanded_icon_size, 
        listbox_expanded_icon_fill,
        listbox_expanded_listbox_color,
        listbox_expanded_listbox_size, 
        listbox_expanded_listbox_weight,
        listbox_expanded_listbox_avatar_width, 
        listbox_expanded_listbox_avatar_height,
        listbox_expanded_listbox_icon_size, 
        listbox_expanded_listbox_icon_fill, 
    } = props

    const grid_init = {auto: {auto_flow: 'column'}, align: 'items-center', gap: '5px', justify: 'items-center'}
    const grid_option = grid.option ? grid.option : grid_init
    const grid_listbox = grid.listbox ? grid.listbox : grid_init
    const style = `
    :host(i-button) {
        --size: ${size ? size : 'var(--primary-size)'};
        --weight: ${weight ? weight : 'var(--weight300)'};
        --color: ${color ? color : 'var(--primary-color)'};
        --color-focus: ${color_focus ? color_focus : 'var(--primary-color-focus)'};
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
        --bg-color-focus: ${bg_color_focus ? bg_color_focus : 'var(--primary-bg-color-focus)'};
        ${width && `--width: ${width}`};
        ${height && `--height: ${height}`};
        --opacity: ${opacity ? opacity : '1'};
        --padding: ${padding ? padding : '12px'};
        --margin: ${margin ? margin : '0'};
        --border-width: ${border_width ? border_width : '0px'};
        --border-style: ${border_style ? border_style : 'solid'};
        --border-color: ${border_color ? border_color : 'var(--primary-color)'};
        --border-opacity: ${border_opacity ? border_opacity : '1'};
        --border: var(--border-width) var(--border-style) hsla( var(--border-color), var(--border-opacity) );
        --border-radius: ${border_radius ? border_radius : 'var(--primary-radius)'};
        --offset_x: ${offset_x ? offset_x : '0px'};
        --offset-y: ${offset_y ? offset_y : '6px'};
        --blur: ${blur ? blur : '30px'};
        --shadow-color: ${shadow_color ? shadow_color : 'var(--primary-color)'};
        --shadow-opacity: ${shadow_opacity ? shadow_opacity : '0'};
        --box-shadow: var(--offset_x) var(--offset-y) var(--blur) hsla( var(--shadow-color), var(--shadow-opacity) );
        --avatar-width: ${avatar_width ? avatar_width : 'var(--primary-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--primary-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--primary-avatar-radius)'};
        --current-icon-size: ${current_icon_size ? current_icon_size : 'var(--current-icon-size)'};
        display: inline-grid;
        ${grid.button ? make_grid(grid.button) : make_grid({auto: {auto_flow: 'column'}, gap: '5px', justify: 'content-center', align: 'items-center'})}
        ${width && 'width: var(--width);'};
        ${height && 'height: var(--height);'};
        max-width: 100%;
        font-size: var(--size);
        font-weight: var(--weight);
        color: hsl( var(--color) );
        background-color: hsla( var(--bg-color), var(--opacity) );
        border: var(--border);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        padding: var(--padding);
        transition: font-size .3s, font-weight .15s, color .3s, background-color .3s, opacity .3s, border .3s, box-shadow .3s ease-in-out;
        cursor: pointer;
        -webkit-mask-image: -webkit-radial-gradient(white, black);
    }
    :host(i-button:hover) {
        --size: ${size_hover ? size_hover : 'var(--primary-size-hover)'};
        --weight: ${weight_hover ? weight_hover : 'var(--primary-weight-hover)'};
        --color: ${color_hover ? color_hover : 'var(--primary-color-hover)'};
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--primary-bg-color-hover)'};
        --border-color: ${border_color_hover ? border_color_hover : 'var(--primary-color-hover)'};
        --offset-x: ${offset_x_hover ? offset_x_hover : '0'};
        --offset-y: ${offset_y_hover ? offset_y_hover : '0'};
        --blur: ${blur_hover ? blur_hover : '50px'};
        --shadow-color: ${shadow_color_hover ? shadow_color_hover : 'var(--primary-color-hover)'};
        --shadow-opacity: ${shadow_opacity_hover ? shadow_opacity_hover : '0'};
    }
    :host(i-button:hover:foucs:active) {
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
    }
    :host(i-button:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
        background-color: hsla(var(--bg-color));
    }  
    :host(i-button) g {
        --icon-fill: ${icon_fill ? icon_fill : 'var(--primary-icon-fill)'};
        fill: hsl(var(--icon-fill));
        transition: fill 0.05s ease-in-out;
    }
    :host(i-button:hover) g {
        --icon-fill: ${icon_fill_hover ? icon_fill_hover : 'var(--primary-icon-fill-hover)'};
    }
    :host(i-button) .avatar {
        display: block;
        width: var(--avatar-width);
        height: var(--avatar-height);
        max-width: 100%;
        border-radius: var(--avatar-radius);
        -webkit-mask-image: -webkit-radial-gradient(white, black);
        overflow: hidden;
        transition: width .3s, height .3s ease-in-out;
        ${make_grid(grid.avatar)}
    }
    :host(i-button) img {
        --scale: ${scale ? scale : '1'};
        width: 100%;
        height: 100%;
        transform: scale(var(--scale));
        transition: transform 0.3s, scale 0.3s linear;
        object-fit: cover;
        border-radius: var(--avatar-radius);
    }
    :host(i-button:hover) img {
        --scale: ${scale_hover ? scale_hover : '1.2'};
        transform: scale(var(--scale));
    }
    :host(i-button) svg {
        width: 100%;
        height: auto;
    }
    :host(i-button[aria-expanded="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    } 
    :host(i-button[role="tab"]) {
        --width: ${width ? width : '100%'};
        --border-radius: ${border_radius ? border_radius : '0'};
    }
    :host(i-button[role="switch"]) {
        --size: ${size ? size : 'var(--primary-size)'};
    }
    :host(i-button[role="switch"]:hover) {
        --size: ${size_hover ? size_hover : 'var(--primary-size-hover)'};
    }
    :host(i-button[role="switch"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="listbox"]) {
        --color: ${listbox_collapsed_listbox_color ? listbox_collapsed_listbox_color : 'var(--listbox-collapsed-listbox-color)'};
        --size: ${listbox_collapsed_listbox_size ? listbox_collapsed_listbox_size : 'var(--listbox-collapsed-listbox-size)'};
        --weight: ${listbox_collapsed_listbox_weight ? listbox_collapsed_listbox_weight : 'var(--listbox-collapsed-listbox-weight)'};
        --bg-color: ${listbox_collapsed_bg_color ? listbox_collapsed_bg_color : 'var(--listbox-collapsed-bg-color)'};
    }
    :host(i-button[role="listbox"]:hover) {
        --color: ${listbox_collapsed_listbox_color_hover ? listbox_collapsed_listbox_color_hover : 'var(--listbox-collapsed-listbox-color-hover)'};
        --size: ${listbox_collapsed_listbox_size_hover ? listbox_collapsed_listbox_size_hover : 'var(--listbox-collapsed-listbox-size-hover)'};
        --weight: ${listbox_collapsed_listbox_weight_hover ? listbox_collapsed_listbox_weight_hover : 'var(--listbox-collapsed-listbox-weight-hover)'};
        --bg-color: ${listbox_collapsed_bg_color_hover ? listbox_collapsed_bg_color_hover : 'var(--listbox-collapsed-bg-color-hover)'};
    }
    :host(i-button[role="listbox"]:focus), :host(i-button[role="listbox"][aria-expanded="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="listbox"]) > .icon {
        ${grid.icon ? make_grid(grid.icon) : make_grid({column: '2'})}
    }
    :host(i-button[role="listbox"]) .text {}
    :host(i-button[role="listbox"]) .avatar {
        --avatar-width: ${listbox_collapsed_listbox_avatar_width ? listbox_collapsed_listbox_avatar_width : 'var(--listbox-collapsed-listbox-avatar-width)'};
        --avatar-height: ${listbox_collapsed_listbox_avatar_height ? listbox_collapsed_listbox_avatar_height : 'var(--listbox-collapsed-listbox-avatar-height)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]),
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) {
        --size: ${listbox_expanded_listbox_size ? listbox_expanded_listbox_size : 'var(--listbox-expanded-listbox-size)'};
        --color: ${listbox_expanded_listbox_color ? listbox_expanded_listbox_color : 'var(--listbox-expanded-listbox-color)'};
        --weight: ${listbox_expanded_listbox_weight ? listbox_expanded_listbox_weight : 'var(--listbox-expanded-listbox-weight)'};
        --bg-color: ${listbox_expanded_bg_color ? listbox_expanded_bg_color : 'var(--listbox-expanded-bg-color)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .avatar {
        --avatar-width: ${listbox_expanded_listbox_avatar_width ? listbox_expanded_listbox_avatar_width : 'var(--listbox-expanded-listbox-avatar-width)'};
        --avatar-height: ${listbox_expanded_listbox_avatar_height ? listbox_expanded_listbox_avatar_height : 'var(--listbox-expanded-listbox-avatar-height)'};
    }
    :host(i-button[role="option"]) {
        --border-radius: ${border_radius ? border_radius : '0'};
        --opacity: ${opacity ? opacity : '0'};
    }
    :host(i-button[role="option"][aria-current="true"]), :host(i-button[role="option"][aria-current="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-list-size)'};
        --color: ${current_color ? current_color : 'var(--current-list-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-list-bg-color)'};
        --opacity: ${opacity ? opacity : '0'}
    }
    :host(i-button[role="option"][aria-current="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="option"][disabled]), :host(i-button[role="option"][disabled]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--primary-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--primary-disabled-color)'};
        --bg-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        --opacity: ${opacity ? opacity : '0'}
    }
    :host(i-button[aria-disabled="true"]) .icon, 
    :host(i-button[aria-disabled="true"]:hover) .icon,
    :host(i-button[role="option"][aria-disabled="true"]) .icon, 
    :host(i-button[role="option"][aria-disabled="true"]:hover) .icon,
    :host(i-button[role="listbox"][aria-disabled="true"]) .icon, 
    :host(i-button[role="listbox"][aria-disabled="true"]:hover) .icon {
        --icon-size: ${disabled_icon_size ? disabled_icon_size : 'var(--primary-disabled-icon-size)'};
    }
    :host(i-button[disabled]:hover) img {
        transform: scale(1);
    }
    :host(i-button[aria-current="true"]), :host(i-button[aria-current="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-size)'};
        --weight: ${current_weight ? current_weight : 'var(--current-weight)'};
        --color: ${current_color ? current_color : 'var(--current-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    :host(i-button[aria-current="true"]) .icon,  :host(i-button[aria-current="true"]:hover) .icon {
        --icon-size: var(--current-icon-size);
    }
    :host(i-button[aria-current="true"]) g {
        --icon-fill: ${current_icon_fill ? current_icon_fill : 'var(--current-icon-fill)'};
    }
    :host(i-button[aria-current="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]) .option > .icon, 
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]:hover) .option > .icon {
        --icon-size: var(--current-icon-size);
    }
    /*
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]) .option > .icon g,
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]:hover) .option > .icon g {
        --icon-fill: var(--current-icon-fill);
    }*/
    :host(i-button[aria-checked="true"]), :host(i-button[aria-expanded="true"]),
    :host(i-button[aria-checked="true"]:hover), :host(i-button[aria-expanded="true"]:hover) {
        --size: ${current_size ? current_size : 'var(--current-size)'};
        --weight: ${current_weight ? current_weight : 'var(--current-weight)'};
        --color: ${current_color ? current_color : 'var(--current-color)'};
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    /*
    :host(i-button[role="switch"][aria-expanded="true"]) g {
        --icon-fill: var(--current-icon-fill);
    }*/
    /* listbox collapsed */
    :host(i-button[role="listbox"]) > .icon {
        --icon-size: ${listbox_collapsed_icon_size ? listbox_collapsed_icon_size : 'var(--listbox-collapsed-icon-size)'};
    }
    :host(i-button[role="listbox"]:hover) > .icon {
        --icon-size: ${listbox_collapsed_icon_size_hover ? listbox_collapsed_icon_size_hover : 'var(--listbox-collapsed-icon-size-hover)'};
    }
    :host(i-button[role="listbox"]) .listbox > .icon {
        --icon-size: ${listbox_collapsed_listbox_icon_size ? listbox_collapsed_listbox_icon_size : 'var(--listbox-collapsed-listbox-icon-size)'};
    }
    :host(i-button[role="listbox"]:hover) .listbox > .icon {
        --icon-size: ${listbox_collapsed_listbox_icon_size_hover ? listbox_collapsed_listbox_icon_size_hover : 'var(--listbox-collapsed-listbox-icon-size-hover)'};
    }
    :host(i-button[role="listbox"]) > .icon g {
        --icon-fill: ${listbox_collapsed_icon_fill ? listbox_collapsed_icon_fill : 'var(--listbox-collapsed-icon-fill)'};
    }
    :host(i-button[role="listbox"]:hover) > .icon g {
        --icon-fill: ${listbox_collapsed_icon_fill_hover ? listbox_collapsed_icon_fill_hover : 'var(--listbox-collapsed-icon-fill-hover)'};
    }
    :host(i-button[role="listbox"]) .listbox > .icon g {
        --icon-fill: ${listbox_collapsed_listbox_icon_fill ? listbox_collapsed_listbox_icon_fill : 'var(--listbox-collaps-listbox-icon-fill)'};
    }
    :host(i-button[role="listbox"]:hover) .listbox > .icon g {
        --icon-fill: ${listbox_collapsed_listbox_icon_fill_hover ? listbox_collapsed_listbox_icon_fill_hover : 'var(--listbox-collapsed-listbox-icon-fill-hover)'};
    }
    /* listbox expanded */
    :host(i-button[role="listbox"][aria-expanded="true"]) > .icon,
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) > .icon {
        --icon-size: ${listbox_expanded_icon_size ? listbox_expanded_icon_size : 'var(--listbox-expanded-icon-size)'};
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) > .icon g, 
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) > .icon g {
        --icon-fill: ${listbox_expanded_icon_fill ? listbox_expanded_icon_fill : 'var(--listbox-expanded-icon-fill)'}
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .listbox > .icon, 
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) .listbox > .icon {
        --icon-fill: ${listbox_expanded_listbox_icon_size ? listbox_expanded_listbox_icon_size : 'var(--listbox-expanded-listbox-icon-size)'};
    }
    :host(i-button[role="listbox"][aria-expanded="true"]) .listbox > .icon g,
    :host(i-button[role="listbox"][aria-expanded="true"]:hover) .listbox > .icon g {
        --icon-fill: ${listbox_expanded_listbox_icon_fill ? listbox_expanded_listbox_icon_fill : 'var(--listbox-expanded-listbox-icon-fill)'};
    }
    :host(i-button[aria-checked="true"]) > .icon g {
        --icon-fill: ${current_icon_fill ? current_icon_fill : 'var(--color-white)' };
    }
    :host(i-button[disabled]), :host(i-button[disabled]:hover) {
        --size: ${disabled_size ? disabled_size : 'var(--primary-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--primary-disabled-color)'};
        --bg-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        cursor: not-allowed;
    }
    :host(i-button[disabled]) g, 
    :host(i-button[disabled]:hover) g, 
    :host(i-button[role="option"][disabled]) > .icon g, 
    :host(i-button[role="option"][disabled]) .option > .icon g,
    :host(i-button[role="listbox"][disabled]) .option > .icon g, 
    :host(i-button[role="option"][disabled]:hover) > .icon g,
    :host(i-button[role="listbox"][disabled]:hover) .option > .icon g, 
    :host(i-button[role="option"][disabled]:hover) .option > .icon g {
        --icon-fill: ${disabled_color ? disabled_color : 'var(--primary-disabled-icon-fill)'};
    }
    :host(i-button[role="menuitem"]) {
        --size: ${size ? size : 'var(--menu-size)'};
        --weight: ${weight ? weight : 'var(--menu-weight)'};
        --color: ${color ? color : 'var(--menu-color)'};
        --border-radius: 0;
        background-color: transparent;
    }
    :host(i-button[role="menuitem"]:hover) {
        --size: ${size_hover ? size_hover : 'var(--menu-size-hover)'};
        --weight: ${weight_hover ? weight_hover : 'var(--menu-weight-hover)'};
        --color: ${color_hover ? color_hover : 'var(--menu-color-hover)'};
    }
    :host(i-button[role="menuitem"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="menuitem"]) .avatar {
        --avatar-width: ${avatar_width ? avatar_width : 'var(--menu-avatar-width)'};
        --avatar-height: ${avatar_height ? avatar_height : 'var(--menu-avatar-height)'};
        --avatar-radius: ${avatar_radius ? avatar_radius : 'var(--menu-avatar-radius)'};
    }
    :host(i-button[role="menuitem"]:hover) .avatar {
        --avatar-width: ${avatar_width_hover ? avatar_width_hover : 'var(--menu-avatar-width-hover)'};
        --avatar-height: ${avatar_height_hover ? avatar_height_hover : 'var(--menu-avatar-height-hover)'};
    }
    :host(i-button[role="menuitem"][disabled]), :host(i-button[role="menuitem"][disabled]):hover {
        --size: ${disabled_size ? disabled_size : 'var(--menu-disabled-size)'};
        --color: ${disabled_color ? disabled_color : 'var(--menu-disabled-color)'};
        --weight: ${disabled_weight ? disabled_weight : 'var(--menu-disabled-weight)'};
    }
    :host(i-button[role="menuitem"][disabled]) g ,
    :host(i-button[role="menuitem"][disabled]:hover) g {
        --icon-fill: ${disabled_icon_fill ? disabled_icon_fill : 'var(--primary-disabled-icon-fill)'};
    }
    :host(i-button[role="option"]) > .icon {
        --icon-size: ${list_selected_icon_size ? list_selected_icon_size : 'var(--list-selected-icon-size)'};
    }
    :host(i-button[role="option"]:hover) > .icon {
        --icon-size: ${list_selected_icon_size_hover ? list_selected_icon_size_hover : 'var(--list-selected-icon-size-hover)'};
    }
    :host(i-button[role="option"]) > .icon g {
        --icon-fill: ${list_selected_icon_fill ? list_selected_icon_fill : 'var(--list-selected-icon-fill)'};
    }
    :host(i-button[role="option"]:hover) > .icon g {
        --icon-fill: ${list_selected_icon_fill_hover ? list_selected_icon_fill_hover : 'var(--list-selected-icon-fill-hover)'};
    }
    :host(i-button[role="option"][aria-current="true"]) > .icon, 
    :host(i-button[role="option"][aria-current="true"]:hover) > .icon {
        --icon-size: ${current_list_selected_icon_size ? current_list_selected_icon_size : 'var(--current-list-selected-icon-size)'};
    }
    :host(i-button[role="option"][aria-current="true"]) > .icon g, 
    :host(i-button[role="option"][aria-current="true"]:hover) > .icon g { 
        --icon-fill: ${current_list_selected_icon_fill ? current_list_selected_icon_fill : 'var(--current-list-selected-icon-fill)'};
    }
    :host(i-button[role="option"][aria-selected="false"]) > .icon {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    }
    :host(i-button[role="option"][aria-selected="true"]) > .icon {
        opacity: 1;
    }
    /* define grid */
    :host(i-button) .text {
        ${make_grid(grid.text)}
    }
    :host(i-button) .icon {
        --icon-size: ${icon_size ? icon_size : 'var(--primary-icon-size)'};
        display: block;
        width: var(--icon-size);
        transition: width 0.25s ease-in-out;
        ${make_grid(grid.icon)}
    }
    :host(i-button:hover) .icon {
        --icon-size: ${icon_size_hover ? icon_size_hover : 'var(--primary-icon-size-hover)'};
    }
    :host(i-button) .listbox {
        display: grid;
        max-width: 100%;
        ${make_grid(grid_listbox)}
    }
    :host(i-button) .option {
        display: grid;
        max-width: 100%;
        ${make_grid(grid_option)}
    }
    :host(i-button) .option > .icon {
        ${make_grid(grid.option_icon)}
    }
    :host(i-button) .option > .avatar {
        ${make_grid(grid.option_avatar)}
    }
    :host(i-button) .option > .text {
        ${make_grid(grid.option_text)}
    }
    ${custom_style}
    `

    return widget()
}
},{"make-element":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-grid.js","make-icon":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-icon.js","make-image":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-image.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-element.js":[function(require,module,exports){
module.exports = make_element

function make_element({name = '', classlist = null, role }) {
    const el = document.createElement(name)
    if (classlist) ste_class()
    if (role) set_role()
    return el

    function ste_class () {
        el.className = classlist
    }
    
    function set_role () {
        const tabindex = role.match(/button|switch/) ? 0 : -1
        el.setAttribute('role', role)
        el.setAttribute('tabindex',  tabindex)
    }
}


},{}],"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-grid.js":[function(require,module,exports){
module.exports = make_grid

function make_grid (opts = {}) {
    const {areas, area, rows, columns, row, auto = {}, column, gap, justify, align} = opts
    let style = ''
    grid_init ()
    return style

    function grid_init () {
        make_rows()
        make_columns()
        make_auto()
        make_row()
        make_column()
        make_justify()
        make_align()
        make_gap()
        make_area()
        make_areas()
    }
     
    function make_areas () {
        if (typeof areas === 'object') {
            let template = `grid-template-areas:`
            areas.map( a => template += `"${a}"`)
            return style += template + ';'
        }
        if (typeof areas === 'string') return areas ? style +=`grid-template-areas: "${areas}";` : ''
    }
    function make_area () {
        return area ? style += `grid-area: ${area};` : ''
    }

    function make_rows () { 
        return rows ? style +=  `grid-template-rows: ${rows};` : ''
    }

    function make_columns () {
        return columns ? style += `grid-template-columns: ${columns};` : ''
    }

    function make_row () {
        return row ? style += `grid-row: ${row};` : ''
    }

    function make_column () {
        return column ? style += `grid-column: ${column};` : ''
    }

    function make_justify () {
        if (justify === void 0) return
        const result = justify.split('-')
        const [type, method] = result
        return style += `justify-${type}: ${method};`
    }

    function make_align () {
        if (align === void 0) return
        const result = align.split('-')
        const [type, method] = result
        return style += `align-${type}: ${method};`
    }

    function make_gap () {
        if (gap === void 0) return ''
        return style += `gap: ${gap};`
    }

    function make_auto () {
        const {auto_flow = null, auto_rows = null, auto_columns = null} = auto
        const grid_auto_flow = auto_flow ? `grid-auto-flow: ${auto_flow};` : ''
        const grid_auto_rows = auto_rows ? `grid-auto-rows: ${auto_rows};` : ''
        const grid_auto_columns = auto_columns ? `grid-auto-columns: ${auto_columns};` : ''
        return style += `${grid_auto_flow}${grid_auto_rows}${grid_auto_columns}`
    }
}
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-icon.js":[function(require,module,exports){
const i_icon = require('datdot-ui-icon')

module.exports = {main_icon, select_icon, list_icon}

function main_icon ({name, path}) {
    const el = i_icon({name, path})
    return el
}

function select_icon ({name = 'arrow-down', path}) {
    const el =  i_icon({name, path})
    return el
}

function list_icon ({name = 'check', path} ) {
    const el =  i_icon({name, path})
    return el
}


},{"datdot-ui-icon":"/Users/bxbcats/prj/play/web/datdot-ui-icon/src/index.js"}],"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-image.js":[function(require,module,exports){
module.exports = img

function img ({src, alt}) {
    const img = document.createElement('img')
    img.setAttribute('src', src)
    img.setAttribute('alt', alt)
    return img
}
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/message-maker.js":[function(require,module,exports){
module.exports = function message_maker (from) {
    let msg_id = 0
    return function make ({to, type, data = null, refs = []}) {
        const stack = (new Error().stack.split('\n').slice(2).filter(x => x.trim()))
        const message = { head: [from, to, ++msg_id], refs, type, data, meta: { stack }}
        return message
    }
}
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/support-style-sheet.js":[function(require,module,exports){
module.exports = support_style_sheet
function support_style_sheet (root, style) {
    return (() => {
        try {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(style)
            root.adoptedStyleSheets = [sheet]
            return true 
        } catch (error) { 
            const inject_style = `<style>${style}</style>`
            root.innerHTML = `${inject_style}`
            return false
        }
    })()
}
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-icon/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const svg = require('svg')

module.exports = ({name, path, is_shadow = false, theme}) => {
    const url = path ? path : './src/svg'
    const symbol = svg(`${url}/${name}.svg`)
    if (is_shadow) {
        function layout (style) {
            const icon = document.createElement('i-icon')
            const shadow = icon.attachShadow({mode: 'closed'})
            const slot = document.createElement('slot')
            slot.name = 'icon'
            style_sheet(shadow, style)
            slot.append(symbol)
            shadow.append(slot)
            return icon
        }
        // insert CSS style
        const custom_style = theme ? theme.style : ''
        // set CSS variables
        if (theme && theme.props) {
            var { fill, size } = theme.props
        }
        const style = `
        :host(i-icon) {
            --size: ${size ? size : '24px'};
            --fill: ${fill ? fill : 'var(--primary-color)'};
            display: block;
        }
        slot[name='icon'] {
            display: grid;
            justify-content: center;
            align-items: center;
        }
        slot[name='icon'] span {
            display: block;
            width: var(--size);
            height: var(--size);
        }
        slot[name='icon'] svg {
            width: 100%;
            height: auto;
        }
        slot[name='icon'] g {
            fill: hsl(var(--fill));
            transition: fill .3s ease-in-out;
        }
        ${custom_style}
        `
        return layout(style)
    }

    return symbol
}

},{"support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-ui-icon/src/node_modules/support-style-sheet.js","svg":"/Users/bxbcats/prj/play/web/datdot-ui-icon/src/node_modules/svg.js"}],"/Users/bxbcats/prj/play/web/datdot-ui-icon/src/node_modules/support-style-sheet.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/support-style-sheet.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-icon/src/node_modules/svg.js":[function(require,module,exports){
module.exports = svg
function svg (path) {
    const span = document.createElement('span')
    span.classList.add('icon')
    get_svg()
    async function get_svg () {
        const res = await fetch(path)
        if (res.status !== 200) throw new Error(res.status)
        let data = await res.text()
        span.innerHTML = data
    }
    return span
}   
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/bel/appendChild.js":[function(require,module,exports){
var trailingNewlineRegex = /\n[\s]+$/
var leadingNewlineRegex = /^\n[\s]+/
var trailingSpaceRegex = /[\s]+$/
var leadingSpaceRegex = /^[\s]+/
var multiSpaceRegex = /[\n\s]+/g

var TEXT_TAGS = [
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'data', 'dfn', 'em', 'i',
  'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'amp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'
]

var VERBATIM_TAGS = [
  'code', 'pre', 'textarea'
]

module.exports = function appendChild (el, childs) {
  if (!Array.isArray(childs)) return

  var nodeName = el.nodeName.toLowerCase()

  var hadText = false
  var value, leader

  for (var i = 0, len = childs.length; i < len; i++) {
    var node = childs[i]
    if (Array.isArray(node)) {
      appendChild(el, node)
      continue
    }

    if (typeof node === 'number' ||
      typeof node === 'boolean' ||
      typeof node === 'function' ||
      node instanceof Date ||
      node instanceof RegExp) {
      node = node.toString()
    }

    var lastChild = el.childNodes[el.childNodes.length - 1]

    // Iterate over text nodes
    if (typeof node === 'string') {
      hadText = true

      // If we already had text, append to the existing text
      if (lastChild && lastChild.nodeName === '#text') {
        lastChild.nodeValue += node

      // We didn't have a text node yet, create one
      } else {
        node = document.createTextNode(node)
        el.appendChild(node)
        lastChild = node
      }

      // If this is the last of the child nodes, make sure we close it out
      // right
      if (i === len - 1) {
        hadText = false
        // Trim the child text nodes if the current node isn't a
        // node where whitespace matters.
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          // The very first node in the list should not have leading
          // whitespace. Sibling text nodes should have whitespace if there
          // was any.
          leader = i === 0 ? '' : ' '
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, leader)
            .replace(leadingSpaceRegex, ' ')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

    // Iterate over DOM nodes
    } else if (node && node.nodeType) {
      // If the last node was a text node, make sure it is properly closed out
      if (hadText) {
        hadText = false

        // Trim the child text nodes if the current node isn't a
        // text node or a code node
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')

          // Remove empty text nodes, append otherwise
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        // Trim the child nodes if the current node is not a node
        // where all whitespace must be preserved
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingSpaceRegex, ' ')
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

      // Store the last nodename
      var _nodeName = node.nodeName
      if (_nodeName) nodeName = _nodeName.toLowerCase()

      // Append the node to the DOM
      el.appendChild(node)
    }
  }
}

},{}],"/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/bel/browser.js":[function(require,module,exports){
var hyperx = require('hyperx')
var appendChild = require('./appendChild')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = [
  'autofocus', 'checked', 'defaultchecked', 'disabled', 'formnovalidate',
  'indeterminate', 'readonly', 'required', 'selected', 'willvalidate'
]

var COMMENT_TAG = '!--'

var SVG_TAGS = [
  'svg', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood',
  'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage',
  'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter',
  'font', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src',
  'font-face-uri', 'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image',
  'line', 'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph',
  'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS.indexOf(key) !== -1) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  appendChild(el, children)
  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"./appendChild":"/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/bel/appendChild.js","hyperx":"/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/hyperx/index.js"}],"/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/hyperscript-attribute-to-property/index.js":[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],"/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/hyperx/index.js":[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else if (xstate === COMMENT && opts.comments) {
          reg += String(arg)
        } else if (xstate !== COMMENT) {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      if (opts.createFragment) return opts.createFragment(tree[2])
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else if (x === null || x === undefined) return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":"/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/hyperscript-attribute-to-property/index.js"}],"/Users/bxbcats/prj/play/web/datdot-ui-list/src/index.js":[function(require,module,exports){
const bel = require('bel')
const style_sheet = require('support-style-sheet')
const {i_button, i_link} = require('datdot-ui-button')
const button = i_button
const message_maker = require('message-maker')
const make_grid = require('make-grid')
module.exports = i_list

function i_list (opts = {}, protocol) {
    const {page = '*', flow = 'ui-list', name, body = [], mode = 'multiple-select', expanded = false, hidden = true, theme = {} } = opts
    const recipients = []
    const make = message_maker(`${name} / ${flow} / i_list`)
    const message = make({type: 'ready'})
    let is_hidden = hidden
    let is_expanded = !is_hidden ? !is_hidden : expanded
    const store_selected = []
    const {grid} = theme

    function widget () {
        const send = protocol( get )
        send(message)
        const list = document.createElement('i-list')
        const shadow = list.attachShadow({mode: 'closed'})
        list.ariaHidden = is_hidden
        list.ariaLabel = name
        list.tabIndex = -1
        list.ariaExpanded = is_expanded
        list.dataset.mode = mode
        style_sheet(shadow, style)
        try {
            if (mode.match(/single|multiple/)) {
                list.setAttribute('role', 'listbox')
                // make_select_list(body)
                make_selector(body)
            }   
            if (mode.match(/dropdown/)) {
                list.setAttribute('role', 'menubar')
                make_list()
            }
            if (body.length === 0) send(make({type: 'error', data: 'body no items'}))
        } catch(e) {
            send(make({type: 'error', data: {message: 'something went wrong', opts }}))
        }
        
        return list

        function make_selector (args) {
            args.forEach( (list, i) => {
                const {list_name, text = undefined, role = 'option', icons, cover, current = false, selected = false, disabled = false, theme = {}} = list
                const {style = ``, props = {}} = theme
                const {
                    size = 'var(--primary-size)', 
                    size_hover = 'var(--primary-size)',
                    weight = '300', 
                    color = 'var(--primary-color)', 
                    color_hover = 'var(--primary-color-hover)', 
                    color_focus = 'var(--color-white)',
                    bg_color = 'var(--primary-bg-color)', 
                    bg_color_hover = 'var(--primary-bg-color-hover)', 
                    bg_color_focus = 'var(--primary-bg-color-focus)',
                    icon_size = 'var(--primary-icon-size)',
                    icon_fill = 'var(--primary-icon-fill)',
                    icon_fill_hover = 'var(--primary-icon-fill-hover)',
                    avatar_width = 'var(--primary-avatar-width)', 
                    avatar_height = 'var(--primary-avatar-height)', 
                    avatar_radius = 'var(--primary-avatar-radius)',
                    current_size = 'var(--current-list-size)',
                    current_color = 'var(--current-list-color)',
                    current_weight = 'var(--current-list-weight)',
                    current_icon_size = 'var(--current-icon-size)',
                    current_icon_fill = 'var(--current-icon-fill)',
                    current_list_selected_icon_size = 'var(--current-list-selected-icon-size)',
                    current_list_selected_icon_fill = 'var(--current-list-selected-icon-fill)',
                    list_selected_icon_size = 'var(--list-selected-icon-size)',
                    list_selected_icon_fill = 'var(--list-selected-icon-fill)',
                    list_selected_icon_fill_hover = 'var(--list-selected-icon-fill-hover)',
                    disabled_color = 'var(--primary-disabled-color)',
                    disabled_bg_color = 'var(--primary-disabled-bg-color)',
                    disabled_icon_fill = 'var(--primary-disabled-fill)',
                    opacity = '0'
                } = props

                const is_current = mode === 'single-select' ? current : false
                const make_button = button({
                    page,
                    name: list_name, 
                    body: text, 
                    role, icons, cover, 
                    current: is_current, selected, disabled, 
                    theme: {
                        style,
                        props: {
                        size, size_hover, weight, 
                        color, color_hover, color_focus,
                        bg_color, bg_color_hover, bg_color_focus,
                        icon_size, icon_fill, icon_fill_hover,
                        avatar_width, avatar_height, avatar_radius,
                        current_size, current_color, current_weight,
                        current_icon_size, current_icon_fill,
                        current_list_selected_icon_size, current_list_selected_icon_fill,
                        list_selected_icon_size, list_selected_icon_fill, list_selected_icon_fill_hover,
                        disabled_color, disabled_bg_color, disabled_icon_fill,
                        opacity
                    }, 
                    grid
                }}, button_protocol(list_name))
                
                const li = document.createElement('li')
                li.dataset.option = text || list_name
                li.setAttribute('aria-selected', is_current || selected)
                if (is_current) li.setAttribute('aria-current', is_current)
                if (disabled) li.setAttribute('disabled', disabled)
                const make = message_maker(`${list_name} / option / ${flow} / widget`)
                li.append(make_button)
                shadow.append(li)
                send( make({type: 'ready'}) )
            })
        }

        function make_list () {
            body.map( (list, i) => {
                const {list_name, text = undefined, role = 'option', url = '#', target, icons, cover, disabled = false, theme = {}} = list
                const {style = ``, props = {}} = theme
                const {
                    size = `var(--primary-size)`, 
                    size_hover = `var(--primary-size)`, 
                    color = `var(--primary-color)`, 
                    color_hover = `var(--primary-color-hover)`,     
                    bg_color = 'var(--primary-bg-color)', 
                    bg_color_hover = 'var(--primary-bg-color-hover)', 
                    icon_fill = 'var(--primary-color)', 
                    icon_fill_hover = 'var(--primary-color-hover)', 
                    icon_size = 'var(--primary-icon-size)', 
                    avatar_width = 'var(--primary-avatar-width)', 
                    avatar_height = 'var(--primary-avatar-height)', 
                    avatar_radius = 'var(--primary-avatar-radius)',
                    disabled_color = 'var(--primary-disabled-color)',
                    disabled_bg_color = 'var(--primary-disabled-bg-color)',
                    disabled_icon_fill = 'var(--primary-disabled-icon-fill)',
                } = props
                if (role === 'link' ) {
                    var item = i_link({
                        page,
                        name: list_name,
                        body: text,
                        role: 'menuitem',
                        link: {
                            url,
                            target
                        },
                        icons,
                        cover,
                        disabled,
                        theme: {
                            style,
                            props,
                            grid
                        }
                    }, button_protocol(list_name))
                }

                if (role === 'menuitem') {
                    var item = i_button({
                        name: list_name,
                        body: text,
                        role,
                        icons,
                        cover,
                        disabled,
                        theme: {
                            style,
                            props: {
                                size, size_hover,
                                color, color_hover,
                                bg_color, bg_color_hover,
                                icon_fill, icon_fill_hover,
                                icon_size,
                                avatar_width, avatar_height, avatar_radius,
                                disabled_color, disabled_bg_color, disabled_icon_fill
                            },
                            grid
                        }
                    }, button_protocol(list_name))
                }
                const li = document.createElement('li')
                li.setAttribute('role', 'none')
                if (disabled) li.setAttribute('disabled', disabled)
                li.append(item)
                shadow.append(li)
            })
            
        }
        function handle_expanded_event (data) {
            list.setAttribute('aria-hidden', data)
            list.setAttribute('aria-expanded', !data)
        }
        function handle_mutiple_selected ({make, from, lists, selected}) {
            // body.map((obj, index) => {
            //     const state = obj.text === from
            //     const make = message_maker(`${obj.text} / option / ${flow}`)
            //     if (state) obj.selected = !obj.selected
            //     const type = obj.selected ? 'selected' : 'unselected'
            //     lists[index].setAttribute('aria-selected', obj.selected)
            //     store_data = body
            //     if (state) recipients[from]( make({type, data: obj.selected}) )
            //     send( make({to: name, type, data: {mode, selected: store_data}}))
            // })
            Object.entries(recipients).forEach(([key, value], index) => {
                if (key === from) {
                    lists[index].setAttribute('aria-current', selected)
                    recipients[from](make({type: 'selected', data: selected}))
                    send( make({type: 'selected', data: {selected: from}}) )
                    return recipients[from](make({type: 'current', data: selected}))
                }
                lists[index].removeAttribute('aria-current')
                return recipients[key](make({type: 'current', data: !selected}))
            }) 
        }

        function handle_single_selected ({make, from, lists, selected}) {
            Object.entries(recipients).forEach(([key, value], index) => {
                lists[index].setAttribute('aria-activedescendant', from)
                lists[index].setAttribute('aria-selected', key === from)

                if (key === from) {
                    lists[index].setAttribute('aria-current', selected)
                    recipients[from](make({type: 'selected', data: selected}))
                    send( make({type: 'selected', data: {selected: from}}) )
                    return recipients[from](make({type: 'current', data: selected}))
                }
                lists[index].removeAttribute('aria-current')
                recipients[key](make({type: 'unselected', data: !selected}))
                return recipients[key](make({type: 'current', data: !selected}))
            }) 
        }
        function handle_select_event ({from, to, data}) {
            const {selected} = data
            // !important  <style> as a child into inject shadowDOM, only Safari and Firefox did, Chrome, Brave, Opera and Edge are not count <style> as a childElemenet
            const lists = shadow.firstChild.tagName !== 'STYLE' ? shadow.childNodes : [...shadow.childNodes].filter( (child, index) => index !== 0)
            const make = message_maker(`${from} / option / ${flow}`)
            if (mode === 'single-select')  handle_single_selected({make, from, lists, selected})
            if (mode === 'multiple-select') handle_mutiple_selected({make, from, lists, selected})
            
        }
        function button_protocol (name) {
            return (send) => {
                recipients[name] = send
                return get
            }
        }
        function handle_click_event(msg) {
            const {head, type, data} = msg
            const role = head[0].split(' / ')[1]
            const from = head[0].split(' / ')[0]
            const make = message_maker(`${from} / ${role} / ${flow}`)
            const message = make({to: '*', type, data})
            send(message)
        }
        function get (msg) {
            const {head, refs, type, data} = msg
            const to = head[1]
            const id = head[2]
            const role = head[0].split(' / ')[1]
            const from = head[0].split(' / ')[0]
            if (role === 'menuitem') return handle_click_event(msg)
            if (type === 'click' && role === 'option') return handle_select_event({from, to, data})
            if (type.match(/expanded|collapsed/)) return handle_expanded_event(data)
        }
    }

    // insert CSS style
    const custom_style = theme ? theme.style : ''
    // set CSS variables
    if (theme && theme.props) {
    var {
        bg_color, bg_color_hover,
        current_bg_color, current_bg_color_hover, disabled_bg_color,
        width, height, border_width, border_style, border_opacity, border_color,
        border_color_hover, border_radius, padding,  opacity,
        shadow_color, offset_x, offset_y, blur, shadow_opacity,
        shadow_color_hover, offset_x_hover, offset_y_hover, blur_hover, shadow_opacity_hover
    } = theme.props
    }

    const style = `
    :host(i-list) {
        ${width && 'width: var(--width);'};
        ${height && 'height: var(--height);'};
        display: grid;
        ${make_grid(grid)}
        margin-top: 5px;
        max-width: 100%;
    }
    :host(i-list[aria-hidden="true"]) {
        opacity: 0;
        animation: close 0.3s;
        pointer-events: none;
    }
    :host([aria-hidden="false"]) {
        animation: open 0.3s;
    }
    li {
        --bg-color: ${bg_color ? bg_color : 'var(--primary-bg-color)'};
        --border-radius: ${border_radius ? border_radius : 'var(--primary-radius)'};
        --border-width: ${border_width ? border_width : 'var(--primary-border-width)'};
        --border-style: ${border_style ? border_style : 'var(--primary-border-style)'};
        --border-color: ${border_color ? border_color : 'var(--primary-border-color)'};
        --border-opacity: ${border_opacity ? border_opacity : 'var(--primary-border-opacity)'};
        --border: var(--border-width) var(--border-style) hsla(var(--border-color), var(--border-opacity));
        display: grid;
        grid-template-columns: 1fr;
        background-color: hsl(var(--bg-color));
        border: var(--border);
        margin-top: -1px;
        cursor: pointer;
        transition: background-color 0.3s ease-in-out;
    }
    li:hover {
        --bg-color: ${bg_color_hover ? bg_color_hover : 'var(--primary-bg-color-hover)'};
    }
    :host(i-list) li:nth-of-type(1) {
        border-top-left-radius: var(--border-radius);
        border-top-right-radius: var(--border-radius);
    }
    li:last-child {
        border-bottom-left-radius: var(--border-radius);
        border-bottom-right-radius: var(--border-radius);
    }
    [role="listitem"] {
        display: grid;
        grid-template-rows: 24px;
        padding: 11px;
        align-items: center;
    }
    [role="listitem"]:hover {
        cursor: default;
    }
    li[disabled="true"], li[disabled="true"]:hover {
        background-color: ${disabled_bg_color ? disabled_bg_color : 'var(--primary-disabled-bg-color)'};
        cursor: not-allowed;
    }
    [role="none"] {
        --bg-color: var(--list-bg-color);
        --opacity: 1;
        background-color: hsla(var(--bg-color), var(--opacity));
    }
    [role="none"]:hover {
        --bg-color: var(--list-bg-color-hover);
        --opacity: 1;
        background-color: hsla(var(--bg-color), var(--opacity));
    }
    [role="none"] i-link {
        padding: 12px;
    }
    [role="option"] i-button.icon-right, [role="option"] i-button.text-left {
        grid-template-columns: auto 1fr auto;
    }
    [aria-current="true"] {
        --bg-color: ${current_bg_color ? current_bg_color : 'var(--current-bg-color)'};
    }
    @keyframes close {
        0% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
    @keyframes open {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }
    ${custom_style}
    `

    return widget()
}
},{"bel":"/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/bel/browser.js","datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/make-grid.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-grid.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/message-maker.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/message-maker.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/support-style-sheet.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/support-style-sheet.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/appendChild.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/bel/appendChild.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/browser.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/bel/browser.js"][0].apply(exports,arguments)
},{"./appendChild":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/appendChild.js","hyperx":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperx/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/csjs.js":[function(require,module,exports){
(function (global){(function (){
'use strict';

var csjs = require('csjs');
var insertCss = require('insert-css');

function csjsInserter() {
  var args = Array.prototype.slice.call(arguments);
  var result = csjs.apply(null, args);
  if (global.document) {
    insertCss(csjs.getCss(result));
  }
  return result;
}

module.exports = csjsInserter;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/index.js","insert-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/insert-css/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/get-css.js":[function(require,module,exports){
'use strict';

module.exports = require('csjs/get-css');

},{"csjs/get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/index.js":[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs;
module.exports.csjs = csjs;
module.exports.getCss = require('./get-css');

},{"./csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/csjs.js","./get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/csjs.js":[function(require,module,exports){
'use strict';

module.exports = require('./lib/csjs');

},{"./lib/csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/csjs.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js":[function(require,module,exports){
'use strict';

module.exports = require('./lib/get-css');

},{"./lib/get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/index.js":[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs();
module.exports.csjs = csjs;
module.exports.noScope = csjs({ noscope: true });
module.exports.getCss = require('./get-css');

},{"./csjs":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/csjs.js","./get-css":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/get-css.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/base62-encode.js":[function(require,module,exports){
'use strict';

/**
 * base62 encode implementation based on base62 module:
 * https://github.com/andrew/base62.js
 */

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function encode(integer) {
  if (integer === 0) {
    return '0';
  }
  var str = '';
  while (integer > 0) {
    str = CHARS[integer % 62] + str;
    integer = Math.floor(integer / 62);
  }
  return str;
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/build-exports.js":[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

module.exports = function createExports(classes, keyframes, compositions) {
  var keyframesObj = Object.keys(keyframes).reduce(function(acc, key) {
    var val = keyframes[key];
    acc[val] = makeComposition([key], [val], true);
    return acc;
  }, {});

  var exports = Object.keys(classes).reduce(function(acc, key) {
    var val = classes[key];
    var composition = compositions[key];
    var extended = composition ? getClassChain(composition) : [];
    var allClasses = [key].concat(extended);
    var unscoped = allClasses.map(function(name) {
      return classes[name] ? classes[name] : name;
    });
    acc[val] = makeComposition(allClasses, unscoped);
    return acc;
  }, keyframesObj);

  return exports;
}

function getClassChain(obj) {
  var visited = {}, acc = [];

  function traverse(obj) {
    return Object.keys(obj).forEach(function(key) {
      if (!visited[key]) {
        visited[key] = true;
        acc.push(key);
        traverse(obj[key]);
      }
    });
  }

  traverse(obj);
  return acc;
}

},{"./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js":[function(require,module,exports){
'use strict';

module.exports = {
  makeComposition: makeComposition,
  isComposition: isComposition,
  ignoreComposition: ignoreComposition
};

/**
 * Returns an immutable composition object containing the given class names
 * @param  {array} classNames - The input array of class names
 * @return {Composition}      - An immutable object that holds multiple
 *                              representations of the class composition
 */
function makeComposition(classNames, unscoped, isAnimation) {
  var classString = classNames.join(' ');
  return Object.create(Composition.prototype, {
    classNames: { // the original array of class names
      value: Object.freeze(classNames),
      configurable: false,
      writable: false,
      enumerable: true
    },
    unscoped: { // the original array of class names
      value: Object.freeze(unscoped),
      configurable: false,
      writable: false,
      enumerable: true
    },
    className: { // space-separated class string for use in HTML
      value: classString,
      configurable: false,
      writable: false,
      enumerable: true
    },
    selector: { // comma-separated, period-prefixed string for use in CSS
      value: classNames.map(function(name) {
        return isAnimation ? name : '.' + name;
      }).join(', '),
      configurable: false,
      writable: false,
      enumerable: true
    },
    toString: { // toString() method, returns class string for use in HTML
      value: function() {
        return classString;
      },
      configurable: false,
      writeable: false,
      enumerable: false
    }
  });
}

/**
 * Returns whether the input value is a Composition
 * @param value      - value to check
 * @return {boolean} - whether value is a Composition or not
 */
function isComposition(value) {
  return value instanceof Composition;
}

function ignoreComposition(values) {
  return values.reduce(function(acc, val) {
    if (isComposition(val)) {
      val.classNames.forEach(function(name, i) {
        acc[name] = val.unscoped[i];
      });
    }
    return acc;
  }, {});
}

/**
 * Private constructor for use in `instanceof` checks
 */
function Composition() {}

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/csjs.js":[function(require,module,exports){
'use strict';

var extractExtends = require('./css-extract-extends');
var composition = require('./composition');
var isComposition = composition.isComposition;
var ignoreComposition = composition.ignoreComposition;
var buildExports = require('./build-exports');
var scopify = require('./scopeify');
var cssKey = require('./css-key');
var extractExports = require('./extract-exports');

module.exports = function csjsTemplate(opts) {
  opts = (typeof opts === 'undefined') ? {} : opts;
  var noscope = (typeof opts.noscope === 'undefined') ? false : opts.noscope;

  return function csjsHandler(strings, values) {
    // Fast path to prevent arguments deopt
    var values = Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      values[i - 1] = arguments[i];
    }
    var css = joiner(strings, values.map(selectorize));
    var ignores = ignoreComposition(values);

    var scope = noscope ? extractExports(css) : scopify(css, ignores);
    var extracted = extractExtends(scope.css);
    var localClasses = without(scope.classes, ignores);
    var localKeyframes = without(scope.keyframes, ignores);
    var compositions = extracted.compositions;

    var exports = buildExports(localClasses, localKeyframes, compositions);

    return Object.defineProperty(exports, cssKey, {
      enumerable: false,
      configurable: false,
      writeable: false,
      value: extracted.css
    });
  }
}

/**
 * Replaces class compositions with comma seperated class selectors
 * @param  value - the potential class composition
 * @return       - the original value or the selectorized class composition
 */
function selectorize(value) {
  return isComposition(value) ? value.selector : value;
}

/**
 * Joins template string literals and values
 * @param  {array} strings - array of strings
 * @param  {array} values  - array of values
 * @return {string}        - strings and values joined
 */
function joiner(strings, values) {
  return strings.map(function(str, i) {
    return (i !== values.length) ? str + values[i] : str;
  }).join('');
}

/**
 * Returns first object without keys of second
 * @param  {object} obj      - source object
 * @param  {object} unwanted - object with unwanted keys
 * @return {object}          - first object without unwanted keys
 */
function without(obj, unwanted) {
  return Object.keys(obj).reduce(function(acc, key) {
    if (!unwanted[key]) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

},{"./build-exports":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/build-exports.js","./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js","./css-extract-extends":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-extract-extends.js","./css-key":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js","./extract-exports":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/extract-exports.js","./scopeify":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scopeify.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-extract-extends.js":[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

var regex = /\.([^\s]+)(\s+)(extends\s+)(\.[^{]+)/g;

module.exports = function extractExtends(css) {
  var found, matches = [];
  while (found = regex.exec(css)) {
    matches.unshift(found);
  }

  function extractCompositions(acc, match) {
    var extendee = getClassName(match[1]);
    var keyword = match[3];
    var extended = match[4];

    // remove from output css
    var index = match.index + match[1].length + match[2].length;
    var len = keyword.length + extended.length;
    acc.css = acc.css.slice(0, index) + " " + acc.css.slice(index + len + 1);

    var extendedClasses = splitter(extended);

    extendedClasses.forEach(function(className) {
      if (!acc.compositions[extendee]) {
        acc.compositions[extendee] = {};
      }
      if (!acc.compositions[className]) {
        acc.compositions[className] = {};
      }
      acc.compositions[extendee][className] = acc.compositions[className];
    });
    return acc;
  }

  return matches.reduce(extractCompositions, {
    css: css,
    compositions: {}
  });

};

function splitter(match) {
  return match.split(',').map(getClassName);
}

function getClassName(str) {
  var trimmed = str.trim();
  return trimmed[0] === '.' ? trimmed.substr(1) : trimmed;
}

},{"./composition":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/composition.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js":[function(require,module,exports){
'use strict';

/**
 * CSS identifiers with whitespace are invalid
 * Hence this key will not cause a collision
 */

module.exports = ' css ';

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/extract-exports.js":[function(require,module,exports){
'use strict';

var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = extractExports;

function extractExports(css) {
  return {
    css: css,
    keyframes: getExport(css, keyframesRegex),
    classes: getExport(css, classRegex)
  };
}

function getExport(css, regex) {
  var prop = {};
  var match;
  while((match = regex.exec(css)) !== null) {
    var name = match[2];
    prop[name] = name;
  }
  return prop;
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/get-css.js":[function(require,module,exports){
'use strict';

var cssKey = require('./css-key');

module.exports = function getCss(csjs) {
  return csjs[cssKey];
};

},{"./css-key":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/css-key.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/hash-string.js":[function(require,module,exports){
'use strict';

/**
 * djb2 string hash implementation based on string-hash module:
 * https://github.com/darkskyapp/string-hash
 */

module.exports = function hashStr(str) {
  var hash = 5381;
  var i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0;
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js":[function(require,module,exports){
'use strict';

var findClasses = /(\.)(?!\d)([^\s\.,{\[>+~#:)]*)(?![^{]*})/.source;
var findKeyframes = /(@\S*keyframes\s*)([^{\s]*)/.source;
var ignoreComments = /(?!(?:[^*/]|\*[^/]|\/[^*])*\*+\/)/.source;

var classRegex = new RegExp(findClasses + ignoreComments, 'g');
var keyframesRegex = new RegExp(findKeyframes + ignoreComments, 'g');

module.exports = {
  classRegex: classRegex,
  keyframesRegex: keyframesRegex,
  ignoreComments: ignoreComments,
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/replace-animations.js":[function(require,module,exports){
var ignoreComments = require('./regex').ignoreComments;

module.exports = replaceAnimations;

function replaceAnimations(result) {
  var animations = Object.keys(result.keyframes).reduce(function(acc, key) {
    acc[result.keyframes[key]] = key;
    return acc;
  }, {});
  var unscoped = Object.keys(animations);

  if (unscoped.length) {
    var regexStr = '((?:animation|animation-name)\\s*:[^};]*)('
      + unscoped.join('|') + ')([;\\s])' + ignoreComments;
    var regex = new RegExp(regexStr, 'g');

    var replaced = result.css.replace(regex, function(match, preamble, name, ending) {
      return preamble + animations[name] + ending;
    });

    return {
      css: replaced,
      keyframes: result.keyframes,
      classes: result.classes
    }
  }

  return result;
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scoped-name.js":[function(require,module,exports){
'use strict';

var encode = require('./base62-encode');
var hash = require('./hash-string');

module.exports = function fileScoper(fileSrc) {
  var suffix = encode(hash(fileSrc));

  return function scopedName(name) {
    return name + '_' + suffix;
  }
};

},{"./base62-encode":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/base62-encode.js","./hash-string":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/hash-string.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scopeify.js":[function(require,module,exports){
'use strict';

var fileScoper = require('./scoped-name');
var replaceAnimations = require('./replace-animations');
var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = scopify;

function scopify(css, ignores) {
  var makeScopedName = fileScoper(css);
  var replacers = {
    classes: classRegex,
    keyframes: keyframesRegex
  };

  function scopeCss(result, key) {
    var replacer = replacers[key];
    function replaceFn(fullMatch, prefix, name) {
      var scopedName = ignores[name] ? name : makeScopedName(name);
      result[key][scopedName] = name;
      return prefix + scopedName;
    }
    return {
      css: result.css.replace(replacer, replaceFn),
      keyframes: result.keyframes,
      classes: result.classes
    };
  }

  var result = Object.keys(replacers).reduce(scopeCss, {
    css: css,
    keyframes: {},
    classes: {}
  });

  return replaceAnimations(result);
}

},{"./regex":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/regex.js","./replace-animations":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/replace-animations.js","./scoped-name":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs/lib/scoped-name.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperscript-attribute-to-property/index.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/hyperscript-attribute-to-property/index.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperx/index.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-list/node_modules/hyperx/index.js"][0].apply(exports,arguments)
},{"hyperscript-attribute-to-property":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperscript-attribute-to-property/index.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/insert-css/index.js":[function(require,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/datdot-wallet.js":[function(require,module,exports){
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
      const to = head[1]
      if (type.match(/ready/)) return 
      if (type.match(/click/)) return
      if (type.match(/switch-page/)) return recipients[to](make({type: 'load-page', data}))
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
},{"container":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/container.js","footer":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/footer.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/account-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')
const i_list = require('datdot-ui-list')

module.exports = account_action

function account_action (opt, protocol) {
    const {page = '*', flow = 'account-action', name = '.', body = [], hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action account'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})

        // create/import account
        const main_action = make_element({name: 'div', classlist: 'action main'})
        // transfer, edit, delete
        const current_account_action = make_element({name: 'div', classlist: 'action current-account'})
        // switch account
        const accounts_list_action = make_element({name: 'div', classlist: 'action accounts'})

        const button_theme = {
            style: ``,
            props: {

            }
        }

        const list_theme = {
            style: ``,
            props: {
                
            }
        }

        const main_option = [
            {name: 'create-account', icon: 'plus', role: 'button', controls: 'wallet-container', theme: button_theme},
            {name: 'import-account', icon: 'import', role: 'button', controls: 'wallet-container', theme: button_theme},
        ]

        const current_account_option = [
            {name: 'account-transfer', icon: 'transfer', role: 'button', controls: 'action-panel', current: false, expanded: false, theme: button_theme},
            {name: 'account-edit', icon: 'edit', role: 'button', controls: 'action-panel',  current: false, expanded: false, theme: button_theme},
            {name: 'account-delete', icon: 'trash', role: 'button', controls: 'action-panel',  current: false, expanded: false, theme: button_theme},
        ]

        // const accounts_list_option = void 0
        const accounts_list_option = [
            {
                list_name: 'account1',
                // text: 'account1',
                icons: {
                    icon: {name: 'account'},
                },
                current: true,
            },
            {
                list_name: 'account2',
                // text: 'account2',
                icons: {
                    icon: {name: 'account'},
                },
            },
            {
                list_name: 'account3',
                // text: 'account3',
                icons: {
                    icon: {name: 'account'},
                },
            }
        ]
       
        style_sheet(shadow, style)
        set_attr({aria: 'hidden', prop: is_hidden})

        make_buttons({args: main_option, target: main_action})
        make_buttons({args: current_account_option, target: current_account_action})
        shadow.append(main_action)

        if (accounts_list_option !== undefined) {
            const accounts_list = i_list(
                {
                    name: 'account-selector', 
                    body: accounts_list_option, 
                    mode: 'single-select', 
                    hidden: false,
                    theme: {
                        grid: {
                            auto: {
                                auto_flow: 'column'
                            }
                        }
                    }
                }, actions_protocol('account-selector'))
            accounts_list_action.append(accounts_list)
            shadow.append(current_account_action, accounts_list_action)
        }

        send( make({type: 'ready'}) )
        return el

        function make_buttons ({args, target}) {
            args.forEach( obj => { 
                const expanded = ('expanded' in obj) ? obj.expanded : void 0
                const current = ('current' in obj) ? obj.current : void 0
                const button = i_button({page, name: obj.name, role: obj.role, icons: {icon: {name: obj.icon}}, expanded, current, controls: obj.controls, theme: obj.theme}, actions_protocol(obj.name))
                target.append(button)
            })
        }

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }
        function actions_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        ${make_grid({
            columns: 'auto 1fr auto',
            auto: {
                auto_flow: 'column'
            }
        })}
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","datdot-ui-list":"/Users/bxbcats/prj/play/web/datdot-ui-list/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-actions/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = i_actions
function i_actions({page = '*', flow = 'ui-actions', name, body = [], to = '#', status = {}, theme = {}}, protocol) {
    const {activities = 0, plan = undefined} = status

    const recipients = []

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'i-actions'})
        const shadow = el.attachShadow({mode: 'closed'})
        const list = make_element({name: 'div', classlist: 'list'})
        // for user account, activities
        const main_action = make_element({name: 'div', classlist: 'action main'})
        // for plans list using
        const plans_action = make_element({name: 'div', classlist: 'action plans'})
        // search, sort up/down, filter
        const search_action = make_element({name: 'div', classlist: 'action search'})
        // for each plan using
        const settings_action = make_element({name: 'div', classlist: 'action settings'})
        // for each plan using
        const plan_action = make_element({name: 'div', classlist: 'action'})
        // for activities using
        const activities_event = make_element({name: 'span', classlist: 'badge'})
        const box = make_element({name: 'div', classlist: 'activities'})
        const button_theme = {
            style: `
            :host(i-button) {
                border-bottom: 2px solid hsl(var(--color-white));
            }
            :host(i-button[aria-current="true"]) g, :host(i-button[aria-expanded="true"]) g {
                --icon-fill: var(--color-flame);
            }   
            :host(i-button[aria-expanded="true"]) {
                --bg-color: var(--color-white);
                border-color: hsl(var(--color-black));
            }
            `,
            props: {
                border_radius: '0',
                icon_size: '20px',
                icon_size_hover: '20px',
                icon_fill: 'var(--color-black)',
                icon_fill_hover: 'var(--color-black)',
                bg_color_hover: 'var(--color-greyED)',
                current_icon_fill: 'var(--color-black)',
                current_bg_color: 'var(--color-greyA2)',
                padding: '8px 10px 4px 10px'
            }
        }
        const switch_theme = {
            style: `
            :host(i-button) {
                border-bottom: 2px solid hsl(var(--color-white));
            }
            :host(i-button[aria-expanded="true"]) {
                background-color: transparent;
                border-bottom: 2px solid hsl(var(--color-black));
            }
            :host(i-button[aria-checked="true"]) {
                --bg-color: transparent;
            }
            :host(i-button[aria-checked="true"]) .icon g {
                --icon-fill: var(--color-black);
            }
            :host(i-button[aria-checked="false"]) .icon g {
                --icon-fill: var(--color-greyA2);
            }
            :host(i-button[aria-current="true"]) {
                --bg-color: var(--color-greyA2);
            }
            `,
            props: {
                border_radius: '0',
                icon_size: '20px',
                icon_size_hover: '20px',
                icon_fill: 'var(--color-greyA2)',
                icon_fill_hover: 'var(--color-black)',
                bg_color_hover: 'var(--color-greyED)',
                padding: '8px 10px 4px 10px'
            }
        }
        const main_option = [
            {name: 'account', icon: 'account', role: 'button', controls: 'account_action', current: false, expanded: false, theme: button_theme, hide: false},
            {name: 'activity', icon: 'activity', role: 'button', controls: 'wallet-container', current: false, theme: button_theme, hide: false}
        ] 
        const plans_option =  [
            {name: 'planlist', icon: 'plan-list',  role: 'switch', controls: 'wallet-container', current: false, expanded: true, checked: true, theme: switch_theme},
            {name: 'performance', icon: 'map',  role: 'switch', controls: 'wallet-container', current: false, expanded: true, checked: true, theme: switch_theme},
            {name: 'linechart', icon: 'linechart', role: 'switch', controls: 'wallet-container', current: false, expanded: true, checked: true, theme: switch_theme},
        ]
        const search_option = [
            {name: 'search', icon: 'search',  role: 'button', controls: 'search_action', current: false, expanded: false, theme: button_theme},
            {name: 'sort-up', icon: 'sort-up',  role: 'switch', controls: 'sortup_action', current: false, expanded: false, checked: false, theme: switch_theme},
            {name: 'sort-down', icon: 'sort-down',  role: 'switch', controls: 'sortdown_action', current: false, expanded: false, checked: true, theme: switch_theme},
            {name: 'filter', icon: 'filter',  role: 'button', controls: 'filter_action', current: false, expanded: false, theme: button_theme},
        ]
            
        const plan_option = [
            {name: 'plan-play', icon: 'play',  role: 'switch', controls: 'play', current: false, checked: true, theme: switch_theme},
            {name: 'plan-pause', icon: 'pause',  role: 'switch', controls: 'pause', current: false, checked: false, theme: switch_theme},
            {name: 'plan-edit', icon: 'edit',  role: 'button', controls: 'edit', current: false, theme: button_theme},
            {name: 'plan-delete', icon: 'trash',  role: 'button', controls: 'delected', current: false, theme: button_theme}
        ]
        
        const settings_option = [
            {name: 'create-plan', icon: 'plus',  role: 'button', controls: 'wallet-container', current: false, theme: button_theme},
            {name: 'custom-action', icon: 'action',  role: 'button', controls: 'custom_action', current: false, expanded: false, theme: button_theme},
            {name: 'help-mode', icon: 'help',  role: 'button', controls: 'help_action', current: false, expanded: false,theme: button_theme}
        ]
        
        make_buttons({args: main_option, target: main_action})
        make_buttons({args: settings_option, target: settings_action})
        make_buttons({args: plans_option, target: plans_action})
        make_buttons({args: search_option, target: search_action})
        // only display when click plan
        
        // console.log(first_action, second_action)
        // !important style_sheet must be implemented before shadow 
        // For Safari and Firefox cannot implement shadow before style
        style_sheet(shadow, style)
        shadow.append(main_action)
        if (plans_action) list.append(plans_action)
        if (search_action) list.append(search_action)
        if (plan) {
            make_buttons ({args: plan_option, target: plan_action})
            list.append(plan_action)
        } 
        shadow.append(list)
        shadow.append(settings_action)

        document.addEventListener('DOMContentLoaded', () => {
            // if there is any activites would be dispalying
            if (activities > 0) {
                box.append(activities_event)
                activities_event.textContent = activities
                // make activities_event align center for responsive size
                activities_event.style.marginLeft = `-${activities_event.clientWidth / 2}px`
            }
        })

        return el
      
        function make_buttons ({args, target}) {
            args.forEach( obj => {
                if (obj.hide) return
                const checked = ('checked' in obj) ? {checked: obj.checked} : void 0
                const expanded = ('expanded' in obj) ? obj.expanded : void 0
                const current = ('current' in obj) ? obj.current : void 0
                const button = i_button({page, name: obj.name, role: obj.role, icons: {icon: {name: obj.icon}}, checked, expanded, current, controls: obj.controls, theme: obj.theme}, actions_protocol(obj.name))
                if (obj.name === 'activity') {
                    const button = i_button({page, name: obj.name, role: obj.role, icons: {icon: {name: obj.icon}}, checked, expanded, current, controls: obj.controls, theme: obj.theme}, actions_protocol(obj.name))
                    box.append(button)
                    return target.append(box)
                }
                target.append(button)
            })
        }

        function handle_switch ({from, to, data}) {
            const checked = data.checked
            const make = message_maker(`${from} / ${flow} / ${page}`)
            if (from.match(/sort/)) {
                const not_switched = make({type: 'switched', data: {checked}})
                if (from === 'sort-up') recipients['sort-down'](not_switched)
                if (from === 'sort-down') recipients['sort-up'](not_switched)
            }
            recipients[from](make({type: 'switched', data: {checked: !checked}}))
        }
        function handle_expanded (from, to, {expanded}) {
            const make = message_maker(`${from} / ${flow} / ${page}`)
            Object.keys(recipients).forEach( key => {
                // to expand 
                if (key === from) {
                    const message = {type: 'expanded', data: !expanded}
                    recipients[from](make(message))
                    return send(make({type: 'expanded', data: {expanded: !expanded}}))
                }
                // to prevent planlist, performance and linechart to collapse sub-actions
                if (key.match(/account|search|sort|filter|custom|help/) && from.match(/account|search|sort|filter|custom|help/)) {
                    return handle_collapsed(key, to, {expanded: !expanded})
                }
            }) 
        }
        function handle_collapsed (from, to, {expanded}) {
            const make = message_maker(`${from} / ${flow} / ${page}`)
            const message = {type: 'collapsed', data: !expanded}
            recipients[from](make(message))
            return send(make({from, ...message}))
        }
        function handle_current ({name, current}) {
            if (current) return
            const make = message_maker(`${name} / ${flow} / ${page}`)
            
            Object.keys(recipients).forEach(key => {
                if (key === name) return recipients[name](make({type: 'current', data: !current}))
                return recipients[key](make({type: 'current', data: current}))
            }) 
        }
        function handle_click (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const role = head[0].split(' / ')[1]
            const make = message_maker(`${from} / ${flow} / ${page}`)
            const to = head[1]
            if (to) return send(make(msg))
            if (role === 'switch') return handle_switch({from, to, data})
        }
        function actions_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            const make = message_maker(`${from} / ${flow} / ${page}`)
            if (type.match(/ready/)) return send(make(msg))
            if (type.match(/click/)) return handle_click(msg)
            if (type.match(/expanded/)) return handle_expanded(from, to, data)
            if (type.match(/collapsed/)) return handle_collapsed(from, to, data)
            if (type.match(/current/)) return handle_current(data)
        }
    }

    const style = `
    :host(i-actions) {
        --bg-color: var(--color-white);
        display: grid;
        ${make_grid({
            columns: 'auto 1fr auto',
            auto: {
                auto_flow: 'column'
            }
        })}
        background-color: hsl(var(--bg-color));
        border-top: 1px solid hsl(var(--color-black));
    }
    .list {
        display: flex;
        overflow: scroll hidden;
    }
    .action {
        display: grid;
        /* auto fill all buttons */
        ${make_grid({
            columns: 'repeat(auto-fill, minmax(1fr, auto))',
            auto: {
                auto_flow: 'column'
            }
        })}
        gap: 2px;
    }
    :host(i-actions) > .action::after, .list > .action:after {
        display: block;
        content: '';
        border-right: 1px solid hsl(var(--color-greyC3));
        height: 60%;
        align-self: center;
    }
    :host(i-actions) > .action:last-child:before {
        display: block;
        content: '';
        border-right: 1px solid hsl(var(--color-greyC3));
        height: 60%;
        align-self: center;
    }
    :host(i-actions) > .action:last-child:after {
        border-right: none;
    }
    .activities {
        position: relative;
    }
    i-button[aria-label="activity"] {
        ${make_grid({
            row: '1',
            column: '2'
        })}
    }
    .badge {
        --color: var(--color-white);
        --size: var(--size12);
        --bg-color: var(--color-black);
        --opacity: 0.6;
        ${make_grid({
            row: '1',
            column: '2'
        })}
        position: absolute;
        transform: scale(0.8);
        bottom: -2px;
        left: 50%;
        z-index: 1;
        font-size: var(--size);
        color: hsl(var(--color));
        text-align: center;
        background-color: hsla(var(--bg-color), var(--opacity));
        padding: 4px 6px;
        border-radius: var(--primary-radius);
    }
    .settings {
        grid-column-end: -1;
    }
    `
    return widget()
}

},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-navigation/src/index.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const {i_button} = require('datdot-ui-button')

module.exports = navigation

function navigation ({page = '*', flow = 'ui-navigation', to = '#', name = '.', body = [], theme = {}}, protocol) {
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    
    function widget () {
        const role = 'tab'
        const send = protocol(get)
        const el = document.createElement('nav')
        const shadow = el.attachShadow({mode: 'open'})
        const tab_theme = {
            style: `
                i-button[disabled]:hover {
                    border-color: 
                }
            `,
            props: {
                border_width: '1px',
                border_color_hover: 'var(--color-black)'
            }
        }
        el.setAttribute('aria-label', name)
        el.setAttribute('role', 'tablist')
        // !important style_sheet must be implemented before shadow 
        // For Safari and Firefox cannot implement shadow before style
        style_sheet(shadow, style)
        body.forEach( opt => {
            const tab = i_button({page, flow, role, name: opt.name.toLowerCase(), body: opt.body, current: opt.current, disabled: opt.disabled, controls: to, theme: tab_theme}, btn_protocol(opt.name.toLowerCase()))
            shadow.append(tab)
        })
        return el

        function handle_current (to, data) {
            const {name, current} = data
            if (current) return            
            Object.entries(recipients).forEach(([key, value]) => {
                if (key === name) {
                    recipients[name](make({type: 'tab-selected', data: {selected: !current}}))
                    send( make({to, type: 'tab-selected', data: {name}}) )
                    return recipients[name](make({type: 'current', data: !current}))
                }
                recipients[key](make({type: 'tab-selected', data: {selected: current}}))
                return recipients[key](make({type: 'current', data: current}))
            }) 
        }
        function btn_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/ready/)) return send(make(msg))
            if (type.match(/current/)) return handle_current(to, data)
        }
    }

    const style = `
    :host(nav) {
        display: grid;
        ${make_grid({
            auto: {
                auto_flow: 'column'
            }
        })}
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/container.js":[function(require,module,exports){
const bel = require('bel')
const make_element = require('make-element')
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')

module.exports = i_container
function i_container({page = '*', flow = 'ui-container', name, body = {}}, protocol) {
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'i-container'})
        const shadow = el.attachShadow({mode: 'open'})
        const content = make_element({name: 'section', classlist: 'content'})
        content.append(bel`<h1>DatDot wallet</h1>`)
        // !important style_sheet must be implemented before shadow 
        // For Safari and Firefox cannot implement shadow before style
        style_sheet(shadow, style)
        shadow.append(content)
        return el

        function container_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            send(make(msg))
            console.log(msg)
            if (type.match(/load-page/)) return console.log(data.page)
        }
    }

    const style = `
    :host(i-container) {
        display: grid;
    }
    `
    return widget()
}

},{"bel":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/browser.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/custom-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = custom_action

function custom_action (opt, protocol) {
    const {page = '*', flow = 'search-action', name = '.', body = '', hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action custom'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})
        style_sheet(shadow, style)
        title.textContent = 'custom action'
        shadow.append(title)
        set_attr({aria: 'hidden', prop: is_hidden})
        send( make({type: 'ready'}) )
        return el

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }

        function action_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/filter-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = filter_action

function filter_action (opt, protocol) {
    const {page = '*', flow = 'search-action', name = '.', body = '', hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action filter'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})
        style_sheet(shadow, style)
        title.textContent = 'filter action'
        shadow.append(title)
        set_attr({aria: 'hidden', prop: is_hidden})
        send( make({type: 'ready'}) )
        return el

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }

        function action_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/footer.js":[function(require,module,exports){
const message_maker = require('message-maker')
const make_element = require('make-element')
const style_sheet = require('support-style-sheet')
// widgets
const i_nav = require('components/datdot-ui-navigation/src')
const i_actions = require('components/datdot-ui-actions/src')
// call actions
const account_action = require('./account-action')
const search_action = require('./search-action')
const filter_action = require('./filter-action')
const sort_action = require('./sort-action')
const custom_action = require('./custom-action')

module.exports = i_footer
function i_footer ({page = '*', flow = 'ui-footer', name = '.', body = {}, to = '#'}, protocol) {
    const {nav = {}, status = {}} = body
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    
    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'footer', classlist: 'footer'})
        const shadow = el.attachShadow({mode: 'closed'})
        const actions = i_actions( {name: `${name}-actions`, status}, footer_protocol(`${name}-actions`) )
        const navigtaion = i_nav( {name: `${name}-nav`, body: nav, to}, footer_protocol(`${name}-nav`) )
        style_sheet(el, style)
        shadow.append(actions, navigtaion)

        return el

        function handle_close_action_event({type, name, hide}) {
            Object.keys(recipients).forEach( key => {
                const regex = new RegExp(`${name}`)
                if (key.match(regex)) return recipients[`${name}-action`](make({type, data: {hide: !hide}}))
            })
        }
        function handle_open_action_event ({name, type, hide}) {
            if (name === 'planlist') return
            if (name === 'performance') return
            if (name === 'linechart') return
            // check sub-action existed
            if (shadow.querySelector(`.sub-action.${name}`)) {
                Object.keys(recipients).forEach( key => {
                    const regex = new RegExp(`${name}`)
                    if (key.match(regex)) return recipients[`${name}-action`](make({type, data: {hide: !hide}}))
                })
                return 
            }
            // check other sub-action existed and do deleted
            const sub_actions = shadow.querySelectorAll(`.sub-action`)
            const sub_option = (action) => action({name: `${name}-action`, hide: !hide}, footer_protocol(`${name}-action`))
            const sub_action =  (name === 'account') ? sub_option(account_action)
                                : (name === 'search') ? sub_option(search_action)
                                : (name === 'filter') ? sub_option(filter_action)
                                : (name.match(/sort/)) ? sub_option(sort_action)
                                : (name === 'custom-action') ? sub_option(custom_action)
                                : undefined

            if (sub_action) shadow.insertBefore(sub_action, actions)
            if (sub_actions.length > 0) {
                sub_actions.forEach( action => {
                    shadow.removeChild(action)
                })
            }
            return
        }
        function footer_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/ready/)) return send(make(msg))
            if (type.match(/click/)) return 
            if (type.match(/expanded/)) return handle_open_action_event({name: from, type: 'show', hide: data.expanded})
            if (type.match(/collapsed/)) return handle_close_action_event({name: from, type: 'hide', hide: data})
            if (type.match(/tab-selected/)) return send( make({to, type: 'switch-page', data}) )
        }
    }
    
    const style = ``

    return widget()
}
},{"./account-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/account-action.js","./custom-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/custom-action.js","./filter-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/filter-action.js","./search-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/search-action.js","./sort-action":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/sort-action.js","components/datdot-ui-actions/src":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-actions/src/index.js","components/datdot-ui-navigation/src":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/components/datdot-ui-navigation/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js":[function(require,module,exports){
module.exports = make_element

function make_element({name = '', classlist = null, role = undefined }) {
    const el = document.createElement(name)
    if (classlist) ste_class()
    if (role) set_role()
    return el

    function ste_class () {
        el.className = classlist
    }
    
    function set_role () {
        if (role.match(/button|switch/)) {
            const tabindex = role.match(/button|switch/) ? 0 : -1
            el.setAttribute('tabindex',  tabindex)
        }
        el.setAttribute('role', role)
    }
}


},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-grid.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/message-maker.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/search-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = search_action

function search_action (opt, protocol) {
    const {page = '*', flow = 'search-action', name = '.', body = '', hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action search'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})
        style_sheet(shadow, style)
        title.textContent = 'search action'
        shadow.append(title)
        set_attr({aria: 'hidden', prop: is_hidden})
        send( make({type: 'ready'}) )
        return el

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }

        function action_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/sort-action.js":[function(require,module,exports){
const style_sheet = require('support-style-sheet')
const message_maker = require('message-maker')
const make_grid = require('make-grid')
const make_element = require('make-element')
const {i_button} = require('datdot-ui-button')

module.exports = sort_action

function sort_action (opt, protocol) {
    const {page = '*', flow = 'search-action', name = '.', body = '', hide = true, to = '#'} = opt
    const recipients = []
    const make = message_maker(`${name} / ${flow} / ${page}`)
    let is_hidden = hide

    function widget () {
        const send = protocol(get)
        const el = make_element({name: 'div', classlist: 'sub-action sort'})
        const title = make_element({name: 'h5'})
        const shadow = el.attachShadow({mode: 'closed'})
        style_sheet(shadow, style)
        title.textContent = 'sort action'
        shadow.append(title)
        set_attr({aria: 'hidden', prop: is_hidden})
        send( make({type: 'ready'}) )
        return el

        function set_attr ({aria, prop}) {
            return el.setAttribute(`aria-${aria}`, prop)
        }
        function handle_hide ({hide}) {
            is_hidden = hide
            set_attr({aria: 'hidden', prop: is_hidden})
        }

        function action_protocol (name) {
            return send => {
                recipients[name] = send
                return get
            }
        }
        function get (msg) {
            const {head, type, refs, meta, data} = msg
            const from = head[0].split(' / ')[0]
            const to = head[1]
            if (type.match(/show|hide/)) return handle_hide(data)
        }
    }

    const style = `
    :host(.sub-action) {
        --bg-color: var(--color-white);
        --opacity: 1;
        --border-width: 1px;
        --border-style: solid;
        --border-color: var(--color-black);
        display: grid;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    `

    return widget()
}
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","make-element":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-element.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-wallet/src/node_modules/support-style-sheet.js":[function(require,module,exports){
module.exports = support_style_sheet
function support_style_sheet (shadow, style) {
    return (() => {
        try {
            const sheet = new CSSStyleSheet()
            sheet.replaceSync(style)
            shadow.adoptedStyleSheets = [sheet]
            return true 
        } catch (error) { 
            const inject_style = `<style>${style}</style>`
            shadow.innerHTML = `${inject_style}`
            return false
        }
    })()
}
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/web/head.js":[function(require,module,exports){
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
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/web/wallet.js":[function(require,module,exports){
const wallet = require('..')
const csjs = require('csjs-inject')
const head = require('./head')()
const el = wallet()
document.body.append(el)
// fetch('http://localhost:9966/').then( x => x.text()).then(x => {
//   console.log({x})
// })

const style = csjs`
:root {
    /* define colors ---------------------------------------------*/  
    --b: 0, 0%;
    --r: 100%, 50%;
    --color-white: var(--b), 100%;
    --color-black: var(--b), 0%;
    --color-dark: 223, 13%, 20%;
    --color-deep-black: 222, 18%, 11%;
    --color-red: 358, 99%, 53%;
    --color-amaranth-pink: 329, 100%, 65%;
    --color-persian-rose: 323, 100%, 50%;
    --color-orange: 32, var(--r);
    --color-light-orange: 36, 100%, 55%;
    --color-safety-orange: 27, 100%, 50%;
    --color-deep-saffron: 31, 100%, 56%;
    --color-ultra-red: 348, 96%, 71%;
    --color-flame: 15, 80%, 50%;
    --color-verdigris: 180, 54%, 43%;
    --color-viridian-green: 180, 100%, 63%;
    --color-blue: 214, 100%, 49%;
    --color-heavy-blue: 233, var(--r);
    --color-maya-blue: 205, 96%, 72%;
    --color-slate-blue: 248, 56%, 59%;
    --color-blue-jeans: 204, 96%, 61%;
    --color-dodger-blue: 213, 90%, 59%;
    --color-light-green: 97, 86%, 77%;
    --color-lime-green: 127, 100%, 40%;
    --color-slimy-green: 108, 100%, 28%;
    --color-maximum-blue-green: 180, 54%, 51%;
    --color-deep-green: 136, 79%, 22%;
    --color-green: 136, 82%, 38%;
    --color-lincoln-green: 97, 100%, 18%;
    --color-yellow: 44, 100%, 55%;
    --color-chrome-yellow: 39, var(--r);
    --color-bright-yellow-crayola: 35, 100%, 58%;
    --color-green-yellow-crayola: 51, 100%, 83%;
    --color-purple: 283, var(--r);
    --color-heliotrope: 288, 100%, 73%;
    --color-medium-purple: 269, 100%, 70%;
    --color-electric-violet: 276, 98%, 48%;
    --color-grey33: var(--b), 20%;
    --color-grey66: var(--b), 40%;
    --color-grey70: var(--b), 44%;
    --color-grey88: var(--b), 53%;
    --color-greyA2: var(--b), 64%;
    --color-greyC3: var(--b), 76%;
    --color-greyCB: var(--b), 80%;
    --color-greyD8: var(--b), 85%;
    --color-greyD9: var(--b), 85%;
    --color-greyE2: var(--b), 89%;
    --color-greyEB: var(--b), 92%;
    --color-greyED: var(--b), 93%;
    --color-greyEF: var(--b), 94%;
    --color-greyF2: var(--b), 95%;
    --transparent: transparent;
    /* define font ---------------------------------------------*/
    --snippet-font: Segoe UI Mono, Monospace, Cascadia Mono, Courier New, ui-monospace, Liberation Mono, Menlo, Monaco, Consolas;
    --size12: 1.2rem;
    --size13: 1.3rem;
    --size14: 1.4rem;
    --size15: 1.5rem;
    --size16: 1.6rem;
    --size18: 1.8rem;
    --size20: 2rem;
    --size22: 2.2rem;
    --size24: 2.4rem;
    --size26: 2.6rem;
    --size28: 2.8rem;
    --size30: 3rem;
    --size32: 3.2rem;
    --size34: 3.4rem;
    --size36: 3.6rem;
    --size38: 3.8rem;
    --size40: 4rem;
    --size42: 4.2rem;
    --size44: 4.4rem;
    --size46: 4.6rem;
    --size48: 4.8rem;
    --size50: 5rem;
    --size52: 5.2rem;
    --size54: 5.4rem;
    --size56: 5.6rem;
    --size58: 5.8rem;
    --size60: 6rem;
    --weight100: 100;
    --weight300: 300;
    --weight400: 400;
    --weight600: 600;
    --weight800: 800;
    /* define primary ---------------------------------------------*/
    --primary-body-bg-color: var(--color-greyF2);
    --primary-font: Arial, sens-serif;
    --primary-size: var(--size14);
    --primary-size-hover: var(--primary-size);
    --primary-weight: 300;
    --primary-weight-hover: 300;
    --primary-color: var(--color-black);
    --primary-color-hover: var(--color-white);
    --primary-color-focus: var(--color-black);
    --primary-bg-color: var(--color-white);
    --primary-bg-color-hover: var(--color-black);
    --primary-bg-color-focus: var(--color-greyA2), 0.5;
    --primary-border-width: 1px;
    --primary-border-style: solid;
    --primary-border-color: var(--color-black);
    --primary-border-opacity: 1;
    --primary-radius: 8px;
    --primary-avatar-width: 100%;
    --primary-avatar-height: auto;
    --primary-avatar-radius: 0;
    --primary-disabled-size: var(--primary-size);
    --primary-disabled-color: var(--color-greyA2);
    --primary-disabled-bg-color: var(--color-greyEB);
    --primary-disabled-icon-size: var(--primary-icon-size);
    --primary-disabled-icon-fill: var(--color-greyA2);
    --primary-listbox-option-icon-size: 20px;
    --primary-listbox-option-avatar-width: 40px;
    --primary-listbox-option-avatar-height: auto;
    --primary-listbox-option-avatar-radius: var(--primary-avatar-radius);
    --primary-option-avatar-width: 30px;
    --primary-option-avatar-height: auto;
    --primary-list-avatar-width: 30px;
    --primary-list-avatar-height: auto;
    --primary-list-avatar-radius: var(--primary-avatar-radius);
    /* define icon settings ---------------------------------------------*/
    --primary-icon-size: var(--size16);
    --primary-icon-size-hover: var(--size16);
    --primary-icon-fill: var(--primary-color);
    --primary-icon-fill-hover: var(--primary-color-hover);
    /* define current ---------------------------------------------*/
    --current-size: var(--primary-size);
    --current-weight: var(--primary-weight);
    --current-color: var(--color-white);
    --current-bg-color: var(--color-black);
    --current-icon-size: var(--primary-icon-size);
    --current-icon-fill: var(--color-white);
    --current-list-selected-icon-size: var(--list-selected-icon-size);
    --current-list-selected-icon-fill: var(--color-white);
    --current-list-selected-icon-fill-hover: var(--color-white);
    --current-list-size: var(--current-size);
    --current-list-color: var(--current-color);
    --current-list-bg-color: var(--current-bg-color);
    --current-list-avatar-width: var(--primary-list-avatar-width);
    --current-list-avatar-height: var(--primary-list-avatar-height);
    /* role listbox settings ---------------------------------------------*/
    /*-- collapsed --*/
    --listbox-collapsed-bg-color: var(--primary-bg-color);
    --listbox-collapsed-bg-color-hover: var(--primary-bg-color-hover);
    --listbox-collapsed-icon-size: var(--size14);
    --listbox-collapsed-icon-size-hover: var(--size14);
    --listbox-collapsed-icon-fill: var(--primary-icon-fill);
    --listbox-collapsed-icon-fill-hover: var(--primary-icon-fill-hover);
    --listbox-collapsed-listbox-size: var(--primary-size);
    --listbox-collapsed-listbox-size-hover: var(--primary-size-hover);
    --listbox-collapsed-listbox-weight: var(--primary-weight);
    --listbox-collapsed-listbox-weight-hover: var(--primary-weight);
    --listbox-collapsed-listbox-color: var(--primary-color);
    --listbox-collapsed-listbox-color-hover: var(--primary-color-hover);
    --listbox-collapsed-listbox-avatar-width: var(--primary-listbox-option-avatar-width);
    --listbox-collapsed-listbox-avatar-height: var(--primary-listbox-option-avatar-height);
    --listbox-collapsed-listbox-icon-size: var(--primary-listbox-option-icon-size);
    --listbox-collapsed-listbox-icon-size-hover: var(--primary-listbox-option-icon-size);
    --listbox-collapsed-listbox-icon-fill: var(--color-blue);
    --listbox-collapsed-listbox-icon-fill-hover: var(--color-yellow);
    /*-- expanded ---*/
    --listbox-expanded-bg-color: var(--current-bg-color);
    --listbox-expanded-icon-size: var(--size14);
    --listbox-expanded-icon-fill: var(--color-light-green);
    --listbox-expanded-listbox-size: var(--size20);
    --listbox-expanded-listbox-weight: var(--primary-weight);
    --listbox-expanded-listbox-color: var(--current-color);
    --listbox-expanded-listbox-avatar-width: var(--primary-listbox-option-avatar-width);
    --listbox-expanded-listbox-avatar-height: var(--primary-listbox-option-avatar-height);
    --listbox-expanded-listbox-icon-size: var(--primary-listbox-option-icon-size);
    --listbox-expanded-listbox-icon-fill: var(--color-light-green);
    /* role option settings ---------------------------------------------*/
    --list-bg-color: var(--primary-bg-color);
    --list-bg-color-hover: var(--primary-bg-color-hover);
    --list-selected-icon-size: var(--size16);
    --list-selected-icon-size-hover: var(--list-selected-icon-size);
    --list-selected-icon-fill: var(--primary-icon-fill);
    --list-selected-icon-fill-hover: var(--primary-icon-fill-hover);
    /* role link settings ---------------------------------------------*/
    --link-size: var(--size14);
    --link-size-hover: var(--primary-link-size);
    --link-color: var(--color-heavy-blue);
    --link-color-hover: var(--color-dodger-blue);
    --link-color-focus: var(--color-flame);
    --link-bg-color: transparent;
    --link-icon-size: var(--size30);
    --link-icon-fill: var(--primary-link-color);
    --link-icon-fill-hover: var(--primary-link-color-hover);
    --link-avatar-width: 60px;
    --link-avatar-width-hover: var(--link-avatar-width);
    --link-avatar-height: auto;
    --link-avatar-height-hover: auto;
    --link-avatar-radius: 0;
    --link-disabled-size: var(--primary-link-size);
    --link-disabled-color: var(--color-greyA2);
    --link-disabled-bg-color: transparent;
    --link-disabled-icon-fill: var(--color-greyA2);
    /* role menuitem settings ---------------------------------------------*/
    --menu-size: var(--size15);
    --menu-size-hover: var(--menu-size);
    --menu-weight: var(--primary-weight);
    --menu-weigh-hover: var(--primary-weight);
    --menu-color: var(--primary-color);
    --menu-color-hover: var(--color-grey88);
    --menu-icon-size: 20px;
    --menu-icon-size-hover: var(--menu-icon-size);
    --menu-icon-fill: var(--primary-color);
    --menu-icon-fill-hover: var(--color-grey88);
    --menu-avatar-width: 50px;
    --menu-avatar-width-hover: var(--menu-avatar-width);
    --menu-avatar-height: auto;
    --menu-avatar-height-hover: var(--menu-avatar-height);
    --menu-avatar-radius: 0;
    --menu-disabled-color: var(--primary-disabled-color);
    --menu-disabled-size: var(--menu-size);
    --menu-disabled-weight: var(--primary-weight);
  }
  html {
    font-size: 62.5%;
    height: 100%;
  }
  *, *:before, *:after {
    box-sizing: border-box;
    position: relative;
  }
  body {
    -webkit-text-size-adjust: 100%;
    margin: 0;
    padding: 0;
    font-size: calc(var(--primary-size) + 2px);
    font-family: var(--primary-font);
    color: var(--primary-color);
    background-color: hsl( var(--primary-body-bg-color) );
    height: 100%;
    overflow: hidden;
  }
  img {
    width: 100%;
    height: auto;
  }
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    padding: 0;
  }
`
},{"..":"/Users/bxbcats/prj/play/web/datdot-wallet/src/datdot-wallet.js","./head":"/Users/bxbcats/prj/play/web/datdot-wallet/web/head.js","csjs-inject":"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/csjs-inject/index.js"}]},{},["/Users/bxbcats/prj/play/web/datdot-wallet/web/wallet.js"]);
