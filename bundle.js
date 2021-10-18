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
    const {page = "*", flow = 'ui-button', name, role = 'button', controls, body = '', icons = {}, cover, classlist = null, mode = '', state, expanded = undefined, current = undefined, selected = false, checked = false, disabled = false, theme = {}} = opt
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
            if (role === 'switch') {
                set_attr({aria: 'checked', prop: is_checked})
            }
            if (role === 'listbox') set_attr({aria: 'haspopup', prop: role})
            if (disabled) {
                set_attr({aria: 'disabled', prop: is_disabled})
                el.setAttribute('disabled', is_disabled)
            } 
            if (is_checked) set_attr({aria: 'checked', prop: is_checked})
            if (role.match(/option/)) {
                is_selected = is_current ? is_current : is_selected
                set_attr({aria: 'selected', prop: is_selected})
            }
            if (expanded !== undefined) {
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
            if (is_checked) return set_attr({aria: 'checked', prop: is_checked})
            else el.removeAttribute('aria-checked')
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
            if (expanded !== undefined) {
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
        --icon-size: ${current_icon_size || 'var(--current-icon-size)'};
    }
    :host(i-button[aria-current="true"]) g {
        --icon-fill: ${current_icon_fill || 'var(--current-icon-fill)'};
    }
    :host(i-button[aria-current="true"]:focus) {
        --color: var(--color-focus);
        --bg-color: var(--bg-color-focus);
    }
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]) .option > .icon, 
    :host(i-button[role="option"][aria-current="true"][aria-selected="true"]:hover) .option > .icon {
        --icon-size: ${current_icon_size || 'var(--current-icon-size)'};
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
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-list/src/index.js":[function(require,module,exports){
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
                const {list_name, text = undefined, role = 'option', icons = {}, cover, current = undefined, selected = false, disabled = false, theme = {}} = list
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
                    current: is_current, 
                    selected, 
                    disabled,
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

                console.log(style);
                
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
            const type = selected ? 'selected' : 'unselected'
            const message = make({type: 'selected', data: {selected: from}})
            recipients[from](make({type, data: selected}))
            lists.forEach( list => {
                const label = list.firstChild.getAttribute('aria-label') 
                if (label === from) list.setAttribute('aria-selected', selected)
            })
            send( message )
        }

        function handle_single_selected ({make, from, lists, selected}) {
            lists.forEach( list => {
                const label = list.firstChild.getAttribute('aria-label') 
                const state = label === from
                const type = state ? 'selected' : 'unselected'
                const name = state ? from : label
                recipients[name](make({type, data: state}))
                recipients[name](make({type: 'current', data: state}))
                list.setAttribute('aria-current', state)
                list.setAttribute('aria-selected', state)
            })
            const message = make({type: 'selected', data: {selected: from}})
            send( message )
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
},{"datdot-ui-button":"/Users/bxbcats/prj/play/web/datdot-ui-button/src/index.js","make-grid":"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/make-grid.js","message-maker":"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/message-maker.js","support-style-sheet":"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/support-style-sheet.js"}],"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/make-grid.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/make-grid.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/message-maker.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/message-maker.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-ui-list/src/node_modules/support-style-sheet.js":[function(require,module,exports){
arguments[4]["/Users/bxbcats/prj/play/web/datdot-ui-button/src/node_modules/support-style-sheet.js"][0].apply(exports,arguments)
},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/appendChild.js":[function(require,module,exports){
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

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/bel/browser.js":[function(require,module,exports){
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

},{}],"/Users/bxbcats/prj/play/web/datdot-wallet/node_modules/hyperx/index.js":[function(require,module,exports){
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
                icon_size: '20px',
                icon_size_hover: '20px',
                border_radius: '0'
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
        const path = 'https://avatars.dicebear.com/api/bottts'
        const accounts_list_option = [
            {
                list_name: 'account1',
                // text: 'account1',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PG1ldGFkYXRhPjxyZGY6UkRGPjxjYzpXb3JrPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz48ZGM6dGl0bGU+Qm90dHRzPC9kYzp0aXRsZT48ZGM6Y3JlYXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPlBhYmxvIFN0YW5sZXk8L2RjOnRpdGxlPjwvY2M6QWdlbnQ+PC9kYzpjcmVhdG9yPjxkYzpzb3VyY2U+aHR0cHM6Ly9ib3R0dHMuY29tLzwvZGM6c291cmNlPjxjYzpsaWNlbnNlIHJkZjpyZXNvdXJjZT0iaHR0cHM6Ly9ib3R0dHMuY29tLyIvPjxkYzpjb250cmlidXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPkZsb3JpYW4gS8O2cm5lcjwvZGM6dGl0bGU+PC9jYzpBZ2VudD48L2RjOmNvbnRyaWJ1dG9yPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48bWFzayBpZD0iYXZhdGFyc1JhZGl1c01hc2siPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiByeD0iMCIgcnk9IjAiIHg9IjAiIHk9IjAiIGZpbGw9IiNmZmYiLz48L21hc2s+PGcgbWFzaz0idXJsKCNhdmF0YXJzUmFkaXVzTWFzaykiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDY2KSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMyAxMUgxMVYzMUgxMi40QzEwLjE1OTggMzEgOS4wMzk2OSAzMSA4LjE4NDA0IDMxLjQzNkM3LjQzMTM5IDMxLjgxOTUgNi44MTk0NyAzMi40MzE0IDYuNDM1OTcgMzMuMTg0QzYgMzQuMDM5NyA2IDM1LjE1OTggNiAzNy40VjM4LjZDNiA0MC44NDAyIDYgNDEuOTYwMyA2LjQzNTk3IDQyLjgxNkM2LjgxOTQ3IDQzLjU2ODYgNy40MzEzOSA0NC4xODA1IDguMTg0MDQgNDQuNTY0QzkuMDM5NjkgNDUgMTAuMTU5OCA0NSAxMi40IDQ1SDE4VjU1LjZDMTggNTcuODQwMiAxOCA1OC45NjAzIDE4LjQzNiA1OS44MTZDMTguODE5NSA2MC41Njg2IDE5LjQzMTQgNjEuMTgwNSAyMC4xODQgNjEuNTY0QzIxLjAzOTcgNjIgMjIuMTU5OCA2MiAyNC40IDYySDQ3LjZDNDkuODQwMiA2MiA1MC45NjAzIDYyIDUxLjgxNiA2MS41NjRDNTIuNTY4NiA2MS4xODA1IDUzLjE4MDUgNjAuNTY4NiA1My41NjQgNTkuODE2QzU0IDU4Ljk2MDMgNTQgNTcuODQwMiA1NCA1NS42VjIwLjRDNTQgMTguMTU5OCA1NCAxNy4wMzk3IDUzLjU2NCAxNi4xODRDNTMuMTgwNSAxNS40MzE0IDUyLjU2ODYgMTQuODE5NSA1MS44MTYgMTQuNDM2QzUwLjk2MDMgMTQgNDkuODQwMiAxNCA0Ny42IDE0SDI0LjRDMjIuMTU5OCAxNCAyMS4wMzk3IDE0IDIwLjE4NCAxNC40MzZDMTkuNDMxNCAxNC44MTk1IDE4LjgxOTUgMTUuNDMxNCAxOC40MzYgMTYuMTg0QzE4IDE3LjAzOTcgMTggMTguMTU5OCAxOCAyMC40VjMxSDEzVjExWk0xMjYgMzQuNEMxMjYgMzIuMTU5OCAxMjYgMzEuMDM5NyAxMjYuNDM2IDMwLjE4NEMxMjYuODE5IDI5LjQzMTQgMTI3LjQzMSAyOC44MTk1IDEyOC4xODQgMjguNDM2QzEyOS4wNCAyOCAxMzAuMTYgMjggMTMyLjQgMjhIMTU1LjZDMTU3Ljg0IDI4IDE1OC45NiAyOCAxNTkuODE2IDI4LjQzNkMxNjAuNTY5IDI4LjgxOTUgMTYxLjE4MSAyOS40MzE0IDE2MS41NjQgMzAuMTg0QzE2MiAzMS4wMzk3IDE2MiAzMi4xNTk4IDE2MiAzNC40VjQ1LjZDMTYyIDQ3Ljg0MDIgMTYyIDQ4Ljk2MDMgMTYxLjU2NCA0OS44MTZDMTYxLjE4MSA1MC41Njg2IDE2MC41NjkgNTEuMTgwNSAxNTkuODE2IDUxLjU2NEMxNTguOTYgNTIgMTU3Ljg0IDUyIDE1NS42IDUySDEzMi40QzEzMC4xNiA1MiAxMjkuMDQgNTIgMTI4LjE4NCA1MS41NjRDMTI3LjQzMSA1MS4xODA1IDEyNi44MTkgNTAuNTY4NiAxMjYuNDM2IDQ5LjgxNkMxMjYgNDguOTYwMyAxMjYgNDcuODQwMiAxMjYgNDUuNlYzNC40WiIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJzaWRlc0FudGVubmEwMU1hc2swIiBtYXNrLXR5cGU9ImFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSI2IiB5PSIxMSIgd2lkdGg9IjE1NiIgaGVpZ2h0PSI1MSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMyAxMUgxMVYzMUgxMi40QzEwLjE1OTggMzEgOS4wMzk2OSAzMSA4LjE4NDA0IDMxLjQzNkM3LjQzMTM5IDMxLjgxOTUgNi44MTk0NyAzMi40MzE0IDYuNDM1OTcgMzMuMTg0QzYgMzQuMDM5NyA2IDM1LjE1OTggNiAzNy40VjM4LjZDNiA0MC44NDAyIDYgNDEuOTYwMyA2LjQzNTk3IDQyLjgxNkM2LjgxOTQ3IDQzLjU2ODYgNy40MzEzOSA0NC4xODA1IDguMTg0MDQgNDQuNTY0QzkuMDM5NjkgNDUgMTAuMTU5OCA0NSAxMi40IDQ1SDE4VjU1LjZDMTggNTcuODQwMiAxOCA1OC45NjAzIDE4LjQzNiA1OS44MTZDMTguODE5NSA2MC41Njg2IDE5LjQzMTQgNjEuMTgwNSAyMC4xODQgNjEuNTY0QzIxLjAzOTcgNjIgMjIuMTU5OCA2MiAyNC40IDYySDQ3LjZDNDkuODQwMiA2MiA1MC45NjAzIDYyIDUxLjgxNiA2MS41NjRDNTIuNTY4NiA2MS4xODA1IDUzLjE4MDUgNjAuNTY4NiA1My41NjQgNTkuODE2QzU0IDU4Ljk2MDMgNTQgNTcuODQwMiA1NCA1NS42VjIwLjRDNTQgMTguMTU5OCA1NCAxNy4wMzk3IDUzLjU2NCAxNi4xODRDNTMuMTgwNSAxNS40MzE0IDUyLjU2ODYgMTQuODE5NSA1MS44MTYgMTQuNDM2QzUwLjk2MDMgMTQgNDkuODQwMiAxNCA0Ny42IDE0SDI0LjRDMjIuMTU5OCAxNCAyMS4wMzk3IDE0IDIwLjE4NCAxNC40MzZDMTkuNDMxNCAxNC44MTk1IDE4LjgxOTUgMTUuNDMxNCAxOC40MzYgMTYuMTg0QzE4IDE3LjAzOTcgMTggMTguMTU5OCAxOCAyMC40VjMxSDEzVjExWk0xMjYgMzQuNEMxMjYgMzIuMTU5OCAxMjYgMzEuMDM5NyAxMjYuNDM2IDMwLjE4NEMxMjYuODE5IDI5LjQzMTQgMTI3LjQzMSAyOC44MTk1IDEyOC4xODQgMjguNDM2QzEyOS4wNCAyOCAxMzAuMTYgMjggMTMyLjQgMjhIMTU1LjZDMTU3Ljg0IDI4IDE1OC45NiAyOCAxNTkuODE2IDI4LjQzNkMxNjAuNTY5IDI4LjgxOTUgMTYxLjE4MSAyOS40MzE0IDE2MS41NjQgMzAuMTg0QzE2MiAzMS4wMzk3IDE2MiAzMi4xNTk4IDE2MiAzNC40VjQ1LjZDMTYyIDQ3Ljg0MDIgMTYyIDQ4Ljk2MDMgMTYxLjU2NCA0OS44MTZDMTYxLjE4MSA1MC41Njg2IDE2MC41NjkgNTEuMTgwNSAxNTkuODE2IDUxLjU2NEMxNTguOTYgNTIgMTU3Ljg0IDUyIDE1NS42IDUySDEzMi40QzEzMC4xNiA1MiAxMjkuMDQgNTIgMTI4LjE4NCA1MS41NjRDMTI3LjQzMSA1MS4xODA1IDEyNi44MTkgNTAuNTY4NiAxMjYuNDM2IDQ5LjgxNkMxMjYgNDguOTYwMyAxMjYgNDcuODQwMiAxMjYgNDUuNlYzNC40WiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNzaWRlc0FudGVubmEwMU1hc2swKSI+PHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSI3NiIgZmlsbD0iIzI5QjZGNiIvPjxyZWN0IHk9IjM4IiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjM4IiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L2c+PHJlY3QgeD0iMTEiIHk9IjExIiB3aWR0aD0iMiIgaGVpZ2h0PSIyMCIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMiAxMkMxNC4yMDkxIDEyIDE2IDEwLjIwOTEgMTYgOEMxNiA1Ljc5MDg2IDE0LjIwOTEgNCAxMiA0QzkuNzkwODYgNCA4IDUuNzkwODYgOCA4QzggMTAuMjA5MSA5Ljc5MDg2IDEyIDEyIDEyWiIgZmlsbD0iI0ZGRUE4RiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTMgOUMxNC4xMDQ2IDkgMTUgOC4xMDQ1NyAxNSA3QzE1IDUuODk1NDMgMTQuMTA0NiA1IDEzIDVDMTEuODk1NCA1IDExIDUuODk1NDMgMTEgN0MxMSA4LjEwNDU3IDExLjg5NTQgOSAxMyA5WiIgZmlsbD0id2hpdGUiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDEsIDApIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ4IDBDMzkuMTYzNCAwIDMyIDcuMTYzNDQgMzIgMTZWMzJDMzIgMzYuNDE4MyAzNS41ODE3IDQwIDQwIDQwSDIzQzIyLjQ0NzcgNDAgMjIgNDAuNDQ3NyAyMiA0MVY1MUMyMiA1MS41NTIzIDIyLjQ0NzcgNTIgMjMgNTJINzdDNzcuNTUyMyA1MiA3OCA1MS41NTIzIDc4IDUxVjQxQzc4IDQwLjQ0NzcgNzcuNTUyMyA0MCA3NyA0MEg2MEM2NC40MTgzIDQwIDY4IDM2LjQxODMgNjggMzJWMTZDNjggNy4xNjM0NCA2MC44MzY2IDAgNTIgMEg0OFoiIGZpbGw9IiM1OUM0RkYiLz48bWFzayBpZD0idG9wQnVsYjAxMU1hc2swIiBtYXNrLXR5cGU9ImFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSIyMiIgeT0iMCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjUyIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ4IDBDMzkuMTYzNCAwIDMyIDcuMTYzNDQgMzIgMTZWMzJDMzIgMzYuNDE4MyAzNS41ODE3IDQwIDQwIDQwSDIzQzIyLjQ0NzcgNDAgMjIgNDAuNDQ3NyAyMiA0MVY1MUMyMiA1MS41NTIzIDIyLjQ0NzcgNTIgMjMgNTJINzdDNzcuNTUyMyA1MiA3OCA1MS41NTIzIDc4IDUxVjQxQzc4IDQwLjQ0NzcgNzcuNTUyMyA0MCA3NyA0MEg2MEM2NC40MTgzIDQwIDY4IDM2LjQxODMgNjggMzJWMTZDNjggNy4xNjM0NCA2MC44MzY2IDAgNTIgMEg0OFoiIGZpbGw9IndoaXRlIi8+PC9tYXNrPjxnIG1hc2s9InVybCgjdG9wQnVsYjAxMU1hc2swKSI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSI1MiIgZmlsbD0iIzI5QjZGNiIvPjxyZWN0IHg9IjIwIiB5PSItMyIgd2lkdGg9IjYwIiBoZWlnaHQ9IjQzIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjQiLz48cGF0aCBkPSJNNDkgMy41QzUzLjkzMTUgMy41IDU4LjM2NiA1LjYyODE0IDYxLjQzNTIgOS4wMTYxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTQ5LjgyODQgMjZMNDAuODI4NCAxN0wzOCAxOS44Mjg0TDQ4IDI5LjgyODRWNDBINTJWMjkuOTcwNkw2Mi4xNDIxIDE5LjgyODRMNTkuMzEzNyAxN0w1MC4zMTM3IDI2SDQ5LjgyODRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz48L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI1LCA0NCkiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMCAxOEMwIDguMDU4ODggOC4wNTg4OCAwIDE4IDBIMTEyQzEyMS45NDEgMCAxMzAgOC4wNTg4OCAxMzAgMThWNDUuMTQ4M0MxMzAgNDkuNjgzMSAxMjkuMjI5IDU0LjE4NDggMTI3LjcyIDU4LjQ2MTFMMTEwLjIzOSAxMDcuOTkxQzEwNy42OTkgMTE1LjE4NyAxMDAuODk2IDEyMCA5My4yNjQ3IDEyMEgzNi43MzUzQzI5LjEwMzYgMTIwIDIyLjMwMTQgMTE1LjE4NyAxOS43NjE0IDEwNy45OTFMMi4yODAzOCA1OC40NjExQzAuNzcxMTE3IDU0LjE4NDggMCA0OS42ODMxIDAgNDUuMTQ4M0wwIDE4WiIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJmYWNlU3F1YXJlMDNNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMCAxOEMwIDguMDU4ODggOC4wNTg4OCAwIDE4IDBIMTEyQzEyMS45NDEgMCAxMzAgOC4wNTg4OCAxMzAgMThWNDUuMTQ4M0MxMzAgNDkuNjgzMSAxMjkuMjI5IDU0LjE4NDggMTI3LjcyIDU4LjQ2MTFMMTEwLjIzOSAxMDcuOTkxQzEwNy42OTkgMTE1LjE4NyAxMDAuODk2IDEyMCA5My4yNjQ3IDEyMEgzNi43MzUzQzI5LjEwMzYgMTIwIDIyLjMwMTQgMTE1LjE4NyAxOS43NjE0IDEwNy45OTFMMi4yODAzOCA1OC40NjExQzAuNzcxMTE3IDU0LjE4NDggMCA0OS42ODMxIDAgNDUuMTQ4M0wwIDE4WiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNmYWNlU3F1YXJlMDNNYXNrMCkiPjxyZWN0IHg9Ii0yIiB5PSItMiIgd2lkdGg9IjEzNCIgaGVpZ2h0PSIxMjQiIGZpbGw9IiMwMzlCRTUiLz4gdW5kZWZpbmVkIDwvZz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTIsIDEyNCkiPjxyZWN0IHg9IjEyIiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjM2IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjI0IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjQ4IiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjxyZWN0IHg9IjYwIiB5PSIxMiIgd2lkdGg9IjQiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNiIvPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgzOCwgNzYpIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxIDQ1QzI5LjI4NDMgNDUgMzYgMzguMjg0MyAzNiAzMEMzNiAyMS43MTU3IDI5LjI4NDMgMTUgMjEgMTVDMTIuNzE1NyAxNSA2IDIxLjcxNTcgNiAzMEM2IDM4LjI4NDMgMTIuNzE1NyA0NSAyMSA0NVoiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNODMgNDVDOTEuMjg0MyA0NSA5OCAzOC4yODQzIDk4IDMwQzk4IDIxLjcxNTcgOTEuMjg0MyAxNSA4MyAxNUM3NC43MTU3IDE1IDY4IDIxLjcxNTcgNjggMzBDNjggMzguMjg0MyA3NC43MTU3IDQ1IDgzIDQ1WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yMSA0MkMyNy42Mjc0IDQyIDMzIDM2LjYyNzQgMzMgMzBDMzMgMjMuMzcyNiAyNy42Mjc0IDE4IDIxIDE4QzE0LjM3MjYgMTggOSAyMy4zNzI2IDkgMzBDOSAzNi42Mjc0IDE0LjM3MjYgNDIgMjEgNDJaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjEiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTgzIDQyQzg5LjYyNzQgNDIgOTUgMzYuNjI3NCA5NSAzMEM5NSAyMy4zNzI2IDg5LjYyNzQgMTggODMgMThDNzYuMzcyNiAxOCA3MSAyMy4zNzI2IDcxIDMwQzcxIDM2LjYyNzQgNzYuMzcyNiA0MiA4MyA0MloiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEgMzZDMjQuMzEzNyAzNiAyNyAzMy4zMTM3IDI3IDMwQzI3IDI2LjY4NjMgMjQuMzEzNyAyNCAyMSAyNEMxNy42ODYzIDI0IDE1IDI2LjY4NjMgMTUgMzBDMTUgMzMuMzEzNyAxNy42ODYzIDM2IDIxIDM2WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC44Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04MyAzNkM4Ni4zMTM3IDM2IDg5IDMzLjMxMzcgODkgMzBDODkgMjYuNjg2MyA4Ni4zMTM3IDI0IDgzIDI0Qzc5LjY4NjMgMjQgNzcgMjYuNjg2MyA3NyAzMEM3NyAzMy4zMTM3IDc5LjY4NjMgMzYgODMgMzZaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIxIDMzQzIyLjY1NjkgMzMgMjQgMzEuNjU2OSAyNCAzMEMyNCAyOC4zNDMxIDIyLjY1NjkgMjcgMjEgMjdDMTkuMzQzMSAyNyAxOCAyOC4zNDMxIDE4IDMwQzE4IDMxLjY1NjkgMTkuMzQzMSAzMyAyMSAzM1oiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNODMgMzNDODQuNjU2OSAzMyA4NiAzMS42NTY5IDg2IDMwQzg2IDI4LjM0MzEgODQuNjU2OSAyNyA4MyAyN0M4MS4zNDMxIDI3IDgwIDI4LjM0MzEgODAgMzBDODAgMzEuNjU2OSA4MS4zNDMxIDMzIDgzIDMzWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC44Ii8+PC9nPjwvZz48L3N2Zz4=',
                // icons: {
                //     icon: {name: 'datdot-app', path: 'https://avatars.dicebear.com/api/pixel-art-neutral/'},
                // },
                current: true,
            },
            {
                list_name: 'account2',
                // text: 'account2',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PG1ldGFkYXRhPjxyZGY6UkRGPjxjYzpXb3JrPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz48ZGM6dGl0bGU+Qm90dHRzPC9kYzp0aXRsZT48ZGM6Y3JlYXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPlBhYmxvIFN0YW5sZXk8L2RjOnRpdGxlPjwvY2M6QWdlbnQ+PC9kYzpjcmVhdG9yPjxkYzpzb3VyY2U+aHR0cHM6Ly9ib3R0dHMuY29tLzwvZGM6c291cmNlPjxjYzpsaWNlbnNlIHJkZjpyZXNvdXJjZT0iaHR0cHM6Ly9ib3R0dHMuY29tLyIvPjxkYzpjb250cmlidXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPkZsb3JpYW4gS8O2cm5lcjwvZGM6dGl0bGU+PC9jYzpBZ2VudD48L2RjOmNvbnRyaWJ1dG9yPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48bWFzayBpZD0iYXZhdGFyc1JhZGl1c01hc2siPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiByeD0iMCIgcnk9IjAiIHg9IjAiIHk9IjAiIGZpbGw9IiNmZmYiLz48L21hc2s+PGcgbWFzaz0idXJsKCNhdmF0YXJzUmFkaXVzTWFzaykiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDY2KSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNC45ODA5IDIwLjkxNDFDMTQgMjIuODM5MyAxNCAyNS4zNTk1IDE0IDMwLjRWNDUuNkMxNCA1MC42NDA1IDE0IDUzLjE2MDcgMTQuOTgwOSA1NS4wODU5QzE1Ljg0MzggNTYuNzc5NCAxNy4yMjA2IDU4LjE1NjIgMTguOTE0MSA1OS4wMTkxQzIwLjgzOTMgNjAgMjMuMzU5NSA2MCAyOC40IDYwSDM1LjZDNDAuNjQwNSA2MCA0My4xNjA3IDYwIDQ1LjA4NTkgNTkuMDE5MUM0Ni43Nzk0IDU4LjE1NjIgNDguMTU2MiA1Ni43Nzk0IDQ5LjAxOTEgNTUuMDg1OUM1MCA1My4xNjA3IDUwIDUwLjY0MDUgNTAgNDUuNlYzMC40QzUwIDI1LjM1OTUgNTAgMjIuODM5MyA0OS4wMTkxIDIwLjkxNDFDNDguMTU2MiAxOS4yMjA2IDQ2Ljc3OTQgMTcuODQzOCA0NS4wODU5IDE2Ljk4MDlDNDMuMTYwNyAxNiA0MC42NDA1IDE2IDM1LjYgMTZIMjguNEMyMy4zNTk1IDE2IDIwLjgzOTMgMTYgMTguOTE0MSAxNi45ODA5QzE3LjIyMDYgMTcuODQzOCAxNS44NDM4IDE5LjIyMDYgMTQuOTgwOSAyMC45MTQxWk0xMzAuOTgxIDIwLjkxNDFDMTMwIDIyLjgzOTMgMTMwIDI1LjM1OTUgMTMwIDMwLjRWNDUuNkMxMzAgNTAuNjQwNSAxMzAgNTMuMTYwNyAxMzAuOTgxIDU1LjA4NTlDMTMxLjg0NCA1Ni43Nzk0IDEzMy4yMjEgNTguMTU2MiAxMzQuOTE0IDU5LjAxOTFDMTM2LjgzOSA2MCAxMzkuMzYgNjAgMTQ0LjQgNjBIMTUxLjZDMTU2LjY0IDYwIDE1OS4xNjEgNjAgMTYxLjA4NiA1OS4wMTkxQzE2Mi43NzkgNTguMTU2MiAxNjQuMTU2IDU2Ljc3OTQgMTY1LjAxOSA1NS4wODU5QzE2NiA1My4xNjA3IDE2NiA1MC42NDA1IDE2NiA0NS42VjMwLjRDMTY2IDI1LjM1OTUgMTY2IDIyLjgzOTMgMTY1LjAxOSAyMC45MTQxQzE2NC4xNTYgMTkuMjIwNiAxNjIuNzc5IDE3Ljg0MzggMTYxLjA4NiAxNi45ODA5QzE1OS4xNjEgMTYgMTU2LjY0IDE2IDE1MS42IDE2SDE0NC40QzEzOS4zNiAxNiAxMzYuODM5IDE2IDEzNC45MTQgMTYuOTgwOUMxMzMuMjIxIDE3Ljg0MzggMTMxLjg0NCAxOS4yMjA2IDEzMC45ODEgMjAuOTE0MVoiIGZpbGw9IiMwMDc2REUiLz48bWFzayBpZD0ic2lkZXNTcXVhcmVNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMTQiIHk9IjE2IiB3aWR0aD0iMTUyIiBoZWlnaHQ9IjQ0Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTE0Ljk4MDkgMjAuOTE0MUMxNCAyMi44MzkzIDE0IDI1LjM1OTUgMTQgMzAuNFY0NS42QzE0IDUwLjY0MDUgMTQgNTMuMTYwNyAxNC45ODA5IDU1LjA4NTlDMTUuODQzOCA1Ni43Nzk0IDE3LjIyMDYgNTguMTU2MiAxOC45MTQxIDU5LjAxOTFDMjAuODM5MyA2MCAyMy4zNTk1IDYwIDI4LjQgNjBIMzUuNkM0MC42NDA1IDYwIDQzLjE2MDcgNjAgNDUuMDg1OSA1OS4wMTkxQzQ2Ljc3OTQgNTguMTU2MiA0OC4xNTYyIDU2Ljc3OTQgNDkuMDE5MSA1NS4wODU5QzUwIDUzLjE2MDcgNTAgNTAuNjQwNSA1MCA0NS42VjMwLjRDNTAgMjUuMzU5NSA1MCAyMi44MzkzIDQ5LjAxOTEgMjAuOTE0MUM0OC4xNTYyIDE5LjIyMDYgNDYuNzc5NCAxNy44NDM4IDQ1LjA4NTkgMTYuOTgwOUM0My4xNjA3IDE2IDQwLjY0MDUgMTYgMzUuNiAxNkgyOC40QzIzLjM1OTUgMTYgMjAuODM5MyAxNiAxOC45MTQxIDE2Ljk4MDlDMTcuMjIwNiAxNy44NDM4IDE1Ljg0MzggMTkuMjIwNiAxNC45ODA5IDIwLjkxNDFaTTEzMC45ODEgMjAuOTE0MUMxMzAgMjIuODM5MyAxMzAgMjUuMzU5NSAxMzAgMzAuNFY0NS42QzEzMCA1MC42NDA1IDEzMCA1My4xNjA3IDEzMC45ODEgNTUuMDg1OUMxMzEuODQ0IDU2Ljc3OTQgMTMzLjIyMSA1OC4xNTYyIDEzNC45MTQgNTkuMDE5MUMxMzYuODM5IDYwIDEzOS4zNiA2MCAxNDQuNCA2MEgxNTEuNkMxNTYuNjQgNjAgMTU5LjE2MSA2MCAxNjEuMDg2IDU5LjAxOTFDMTYyLjc3OSA1OC4xNTYyIDE2NC4xNTYgNTYuNzc5NCAxNjUuMDE5IDU1LjA4NTlDMTY2IDUzLjE2MDcgMTY2IDUwLjY0MDUgMTY2IDQ1LjZWMzAuNEMxNjYgMjUuMzU5NSAxNjYgMjIuODM5MyAxNjUuMDE5IDIwLjkxNDFDMTY0LjE1NiAxOS4yMjA2IDE2Mi43NzkgMTcuODQzOCAxNjEuMDg2IDE2Ljk4MDlDMTU5LjE2MSAxNiAxNTYuNjQgMTYgMTUxLjYgMTZIMTQ0LjRDMTM5LjM2IDE2IDEzNi44MzkgMTYgMTM0LjkxNCAxNi45ODA5QzEzMy4yMjEgMTcuODQzOCAxMzEuODQ0IDE5LjIyMDYgMTMwLjk4MSAyMC45MTQxWiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNzaWRlc1NxdWFyZU1hc2swKSI+PHJlY3Qgd2lkdGg9IjE4MCIgaGVpZ2h0PSI3NiIgZmlsbD0iI0ZGNzA0MyIvPjxyZWN0IHk9IjM4IiB3aWR0aD0iMTgwIiBoZWlnaHQ9IjM4IiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQxLCAwKSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik01MCAxM0MzOC45NTQzIDEzIDMwIDIxLjk1NDMgMzAgMzNWMzZIMjFDMjAuNDQ3NyAzNiAyMCAzNi40NDc3IDIwIDM3VjUxQzIwIDUxLjU1MjMgMjAuNDQ3NyA1MiAyMSA1Mkg3OUM3OS41NTIzIDUyIDgwIDUxLjU1MjMgODAgNTFWMzdDODAgMzYuNDQ3NyA3OS41NTIzIDM2IDc5IDM2SDcwVjMzQzcwIDIxLjk1NDMgNjEuMDQ1NyAxMyA1MCAxM1oiIGZpbGw9IiM1OUM0RkYiLz48bWFzayBpZD0idG9wQnVsYjAxTWFzazAiIG1hc2stdHlwZT0iYWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjIwIiB5PSIxMyIgd2lkdGg9IjYwIiBoZWlnaHQ9IjM5Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUwIDEzQzM4Ljk1NDMgMTMgMzAgMjEuOTU0MyAzMCAzM1YzNkgyMUMyMC40NDc3IDM2IDIwIDM2LjQ0NzcgMjAgMzdWNTFDMjAgNTEuNTUyMyAyMC40NDc3IDUyIDIxIDUySDc5Qzc5LjU1MjMgNTIgODAgNTEuNTUyMyA4MCA1MVYzN0M4MCAzNi40NDc3IDc5LjU1MjMgMzYgNzkgMzZINzBWMzNDNzAgMjEuOTU0MyA2MS4wNDU3IDEzIDUwIDEzWiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCN0b3BCdWxiMDFNYXNrMCkiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTIiIGZpbGw9IiNGRjcwNDMiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUwIDM2QzUyLjIwOTEgMzYgNTQgMzUuMDI4IDU0IDMxLjcxNDNDNTQgMjguNDAwNiA1Mi4yMDkxIDI0IDUwIDI0QzQ3Ljc5MDkgMjQgNDYgMjguNDAwNiA0NiAzMS43MTQzQzQ2IDM1LjAyOCA0Ny43OTA5IDM2IDUwIDM2WiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC42Ii8+PHJlY3QgeD0iMjAiIHk9IjEzIiB3aWR0aD0iNjAiIGhlaWdodD0iMjMiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNCIvPjxwYXRoIGQ9Ik01MCAxNC41QzQ5LjQ0NzcgMTQuNSA0OSAxNC45NDc3IDQ5IDE1LjVDNDkgMTYuMDUyMyA0OS40NDc3IDE2LjUgNTAgMTYuNVYxNC41Wk02MS42OTQxIDIxLjY4NzVDNjIuMDY0OSAyMi4wOTY4IDYyLjY5NzMgMjIuMTI4MSA2My4xMDY2IDIxLjc1NzNDNjMuNTE1OSAyMS4zODY1IDYzLjU0NzEgMjAuNzU0MSA2My4xNzYzIDIwLjM0NDhMNjEuNjk0MSAyMS42ODc1Wk02NS43NTk1IDI0LjA0NzNDNjUuNTAzNSAyMy41NTc5IDY0Ljg5OTMgMjMuMzY4NiA2NC40MDk5IDIzLjYyNDZDNjMuOTIwNSAyMy44ODA2IDYzLjczMTMgMjQuNDg0OCA2My45ODczIDI0Ljk3NDJMNjUuNzU5NSAyNC4wNDczWk02NS40MjQ4IDI4Ljk1NTlDNjUuNTQwNCAyOS40OTU5IDY2LjA3MTkgMjkuODQgNjYuNjExOSAyOS43MjQ0QzY3LjE1MiAyOS42MDg4IDY3LjQ5NjEgMjkuMDc3MyA2Ny4zODA1IDI4LjUzNzNMNjUuNDI0OCAyOC45NTU5Wk01MCAxNi41QzU0LjYzNzUgMTYuNSA1OC44MDY1IDE4LjQ5OTkgNjEuNjk0MSAyMS42ODc1TDYzLjE3NjMgMjAuMzQ0OEM1OS45MjU2IDE2Ljc1NjMgNTUuMjI1NiAxNC41IDUwIDE0LjVWMTYuNVpNNjMuOTg3MyAyNC45NzQyQzY0LjYzNTcgMjYuMjEzOSA2NS4xMjM5IDI3LjU1MDEgNjUuNDI0OCAyOC45NTU5TDY3LjM4MDUgMjguNTM3M0M2Ny4wNDExIDI2Ljk1MTggNjYuNDkwNCAyNS40NDQ4IDY1Ljc1OTUgMjQuMDQ3M0w2My45ODczIDI0Ljk3NDJaIiBmaWxsPSJ3aGl0ZSIvPjwvZz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjUsIDQ0KSI+PHJlY3Qgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiIHJ4PSIxOCIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJmYWNlU3F1YXJlMDFNYXNrMCIgbWFzay10eXBlPSJhbHBoYSIgbWFza1VuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeD0iMCIgeT0iMCIgd2lkdGg9IjEzMCIgaGVpZ2h0PSIxMjAiPjxyZWN0IHdpZHRoPSIxMzAiIGhlaWdodD0iMTIwIiByeD0iMTgiIGZpbGw9IndoaXRlIi8+PC9tYXNrPjxnIG1hc2s9InVybCgjZmFjZVNxdWFyZTAxTWFzazApIj48cmVjdCB4PSItMiIgeT0iLTIiIHdpZHRoPSIxMzQiIGhlaWdodD0iMTI0IiBmaWxsPSIjRjQ1MTFFIi8+IHVuZGVmaW5lZCA8L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUyLCAxMjQpIj48cmVjdCB4PSIxMiIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSIzNiIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSIyNCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSI0OCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48cmVjdCB4PSI2MCIgeT0iMTIiIHdpZHRoPSI0IiBoZWlnaHQ9IjgiIHJ4PSIyIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjYiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzgsIDc2KSI+PHJlY3QgeT0iNCIgd2lkdGg9IjEwNCIgaGVpZ2h0PSI0MiIgcng9IjQiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuOCIvPjxyZWN0IHg9IjI4IiB5PSIyNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjExIiByeD0iMiIgZmlsbD0iIzhCRERGRiIvPjxyZWN0IHg9IjY2IiB5PSIyNSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjExIiByeD0iMiIgZmlsbD0iIzhCRERGRiIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMjEgNEgyOUwxMiA0Nkg0TDIxIDRaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjQiLz48L2c+PC9nPjwvc3ZnPg==',
                // icons: {
                //     icon: {name: 'robot', path},
                // },
            },
            {
                list_name: 'account3',
                // text: 'account3',
                cover: `data:image/svg+xml;base64,PHN2ZyB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTgwIDE4MCI+PG1ldGFkYXRhPjxyZGY6UkRGPjxjYzpXb3JrPjxkYzpmb3JtYXQ+aW1hZ2Uvc3ZnK3htbDwvZGM6Zm9ybWF0PjxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz48ZGM6dGl0bGU+Qm90dHRzPC9kYzp0aXRsZT48ZGM6Y3JlYXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPlBhYmxvIFN0YW5sZXk8L2RjOnRpdGxlPjwvY2M6QWdlbnQ+PC9kYzpjcmVhdG9yPjxkYzpzb3VyY2U+aHR0cHM6Ly9ib3R0dHMuY29tLzwvZGM6c291cmNlPjxjYzpsaWNlbnNlIHJkZjpyZXNvdXJjZT0iaHR0cHM6Ly9ib3R0dHMuY29tLyIvPjxkYzpjb250cmlidXRvcj48Y2M6QWdlbnQ+PGRjOnRpdGxlPkZsb3JpYW4gS8O2cm5lcjwvZGM6dGl0bGU+PC9jYzpBZ2VudD48L2RjOmNvbnRyaWJ1dG9yPjwvY2M6V29yaz48L3JkZjpSREY+PC9tZXRhZGF0YT48bWFzayBpZD0iYXZhdGFyc1JhZGl1c01hc2siPjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTgwIiByeD0iMCIgcnk9IjAiIHg9IjAiIHk9IjAiIGZpbGw9IiNmZmYiLz48L21hc2s+PGcgbWFzaz0idXJsKCNhdmF0YXJzUmFkaXVzTWFzaykiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsIDY2KSI+PGcgb3BhY2l0eT0iMC45Ij48cGF0aCBpZD0iQ2FibGUiIGQ9Ik0zOCAxMkMzNS4wNDYgMjMuNjk2NiAxOC4wOTU5IDE4LjY2NjMgMTQuNjMxMyAzMC4wMDlDMTEuMTY2OCA0MS4zNTE4IDIyLjY1NjUgNTAgMzIuMTU1MiA1MCIgc3Ryb2tlPSIjMkEzNTQ0IiBzdHJva2Utd2lkdGg9IjYiLz48cGF0aCBpZD0iQ2FibGVfMiIgZD0iTTE1MCA1NUMxNTguMzk0IDU4LjQ4NjQgMTcwLjEwMiA0Ny40MDYzIDE2NiAzOC41QzE2MS44OTggMjkuNTkzNiAxNTAgMzEuODA1NiAxNTAgMTkuMTk1IiBzdHJva2U9IiMyQTM1NDQiIHN0cm9rZS13aWR0aD0iNCIvPjwvZz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEzOCA2QzEzNi44OTUgNiAxMzYgNi44OTU0MyAxMzYgOFYyMkMxMzYgMjMuMTA0NiAxMzYuODk1IDI0IDEzOCAyNEgxNTdDMTU4LjEwNSAyNCAxNTkgMjMuMTA0NiAxNTkgMjJWOEMxNTkgNi44OTU0MyAxNTguMTA1IDYgMTU3IDZIMTM4Wk0yMSAzN0MyMSAzNS44OTU0IDIxLjg5NTQgMzUgMjMgMzVIMzVDMzYuMTA0NiAzNSAzNyAzNS44OTU0IDM3IDM3VjU1QzM3IDU2LjEwNDYgMzYuMTA0NiA1NyAzNSA1N0gyM0MyMS44OTU0IDU3IDIxIDU2LjEwNDYgMjEgNTVWMzdaTTEzNiA0NEMxMzYgNDIuODk1NCAxMzYuODk1IDQyIDEzOCA0MkgxNTdDMTU4LjEwNSA0MiAxNTkgNDIuODk1NCAxNTkgNDRWNjJDMTU5IDYzLjEwNDYgMTU4LjEwNSA2NCAxNTcgNjRIMTM4QzEzNi44OTUgNjQgMTM2IDYzLjEwNDYgMTM2IDYyVjQ0WiIgZmlsbD0iIzI3Mzk1MSIvPjxtYXNrIGlkPSJzaWRlc0NhYmxlczAxTWFzazAiIG1hc2stdHlwZT0iYWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjIxIiB5PSI2IiB3aWR0aD0iMTM4IiBoZWlnaHQ9IjU4Ij48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTEzOCA2QzEzNi44OTUgNiAxMzYgNi44OTU0MyAxMzYgOFYyMkMxMzYgMjMuMTA0NiAxMzYuODk1IDI0IDEzOCAyNEgxNTdDMTU4LjEwNSAyNCAxNTkgMjMuMTA0NiAxNTkgMjJWOEMxNTkgNi44OTU0MyAxNTguMTA1IDYgMTU3IDZIMTM4Wk0yMSAzN0MyMSAzNS44OTU0IDIxLjg5NTQgMzUgMjMgMzVIMzVDMzYuMTA0NiAzNSAzNyAzNS44OTU0IDM3IDM3VjU1QzM3IDU2LjEwNDYgMzYuMTA0NiA1NyAzNSA1N0gyM0MyMS44OTU0IDU3IDIxIDU2LjEwNDYgMjEgNTVWMzdaTTEzNiA0NEMxMzYgNDIuODk1NCAxMzYuODk1IDQyIDEzOCA0MkgxNTdDMTU4LjEwNSA0MiAxNTkgNDIuODk1NCAxNTkgNDRWNjJDMTU5IDYzLjEwNDYgMTU4LjEwNSA2NCAxNTcgNjRIMTM4QzEzNi44OTUgNjQgMTM2IDYzLjEwNDYgMTM2IDYyVjQ0WiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNzaWRlc0NhYmxlczAxTWFzazApIj48cmVjdCB3aWR0aD0iMTgwIiBoZWlnaHQ9Ijc2IiBmaWxsPSIjNjZCQjZBIi8+PC9nPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MSwgMCkiPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNzEuMjEwNCA0MEM3OC44NDk5IDMzLjI5MzEgODQuNjMxMyAyMC42ODgyIDg0IDE0QzgzLjg2MzUgMTIuNTUzNSA4NS45OTk4IDEyLjI5OTMgODcgMTRDOTEuNDE4IDIxLjUxMjQgODkuNzE3MiAzNi4wNjcyIDg5LjE1MzUgNDBIOTJWNTJINjZWNDBINzEuMjEwNFpNMTYuNTIxIDEzLjc0MDhDMTYuNTIxIDIxLjI3MzMgMjEuNDkxOCAzMy40NDUgMjkuMjYxOCA0MEgzNFY1Mkg4VjQwSDExLjIyNTFDMTAuNjI5OSAzNi40NDE0IDguNTI5MjkgMjEuNjAxMiAxMy40MzM3IDE0LjEwMDlDMTQuMzM1MyAxMi43MjE5IDE2LjUyMSAxMi42ODA3IDE2LjUyMSAxMy43NDA4WiIgZmlsbD0iI0UxRTZFOCIvPjxtYXNrIGlkPSJ0b3BIb3Juc01hc2swIiBtYXNrLXR5cGU9ImFscGhhIiBtYXNrVW5pdHM9InVzZXJTcGFjZU9uVXNlIiB4PSI4IiB5PSIxMiIgd2lkdGg9Ijg0IiBoZWlnaHQ9IjQwIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTcxLjIxMDQgNDBDNzguODQ5OSAzMy4yOTMxIDg0LjYzMTMgMjAuNjg4MiA4NCAxNEM4My44NjM1IDEyLjU1MzUgODUuOTk5OCAxMi4yOTkzIDg3IDE0QzkxLjQxOCAyMS41MTI0IDg5LjcxNzIgMzYuMDY3MiA4OS4xNTM1IDQwSDkyVjUySDY2VjQwSDcxLjIxMDRaTTE2LjUyMSAxMy43NDA4QzE2LjUyMSAyMS4yNzMzIDIxLjQ5MTggMzMuNDQ1IDI5LjI2MTggNDBIMzRWNTJIOFY0MEgxMS4yMjUxQzEwLjYyOTkgMzYuNDQxNCA4LjUyOTI5IDIxLjYwMTIgMTMuNDMzNyAxNC4xMDA5QzE0LjMzNTMgMTIuNzIxOSAxNi41MjEgMTIuNjgwNyAxNi41MjEgMTMuNzQwOFoiIGZpbGw9IndoaXRlIi8+PC9tYXNrPjxnIG1hc2s9InVybCgjdG9wSG9ybnNNYXNrMCkiPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iNTIiIGZpbGw9IiM2NkJCNkEiLz48cmVjdCB5PSI0MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMiIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC40Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNS40NTU4IDEzSDMxLjU2ODlWNDBIMjAuODIwMUMxMy4zNzEyIDMyLjE0OTkgMTUuNDU1OCAxMyAxNS40NTU4IDEzWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik04NC44MjAzIDEzSDkyLjU2OTFWNDBIODEuODIwM0M4Ny41NzEzIDMyLjE5NDYgODQuODIwMyAxMyA4NC44MjAzIDEzWiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PC9nPjwvZz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNSwgNDQpIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTAgMTAyVjY4Ljg1MTdDMCA2NC4zMTY5IDAuNzcxMTIgNTkuODE1MiAyLjI4MDM5IDU1LjUzODlMMTkuNzYxNCAxMi4wMDkyQzIyLjMwMTQgNC44MTI2MyAyOS4xMDM2IDAgMzYuNzM1MyAwTDkzLjI2NDcgMEMxMDAuODk2IDAgMTA3LjY5OSA0LjgxMjYzIDExMC4yMzkgMTIuMDA5MkwxMjcuNzIgNTUuNTM4OUMxMjkuMjI5IDU5LjgxNTIgMTMwIDY0LjMxNjkgMTMwIDY4Ljg1MTdWMTAyQzEzMCAxMTEuOTQxIDEyMS45NDEgMTIwIDExMiAxMjBIMThDOC4wNTg4NyAxMjAgMCAxMTEuOTQxIDAgMTAyWiIgZmlsbD0iIzAwNzZERSIvPjxtYXNrIGlkPSJmYWNlU3F1YXJlTWFzazAiIG1hc2stdHlwZT0iYWxwaGEiIG1hc2tVbml0cz0idXNlclNwYWNlT25Vc2UiIHg9IjAiIHk9IjAiIHdpZHRoPSIxMzAiIGhlaWdodD0iMTIwIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTAgMTAyVjY4Ljg1MTdDMCA2NC4zMTY5IDAuNzcxMTIgNTkuODE1MiAyLjI4MDM5IDU1LjUzODlMMTkuNzYxNCAxMi4wMDkyQzIyLjMwMTQgNC44MTI2MyAyOS4xMDM2IDAgMzYuNzM1MyAwTDkzLjI2NDcgMEMxMDAuODk2IDAgMTA3LjY5OSA0LjgxMjYzIDExMC4yMzkgMTIuMDA5MkwxMjcuNzIgNTUuNTM4OUMxMjkuMjI5IDU5LjgxNTIgMTMwIDY0LjMxNjkgMTMwIDY4Ljg1MTdWMTAyQzEzMCAxMTEuOTQxIDEyMS45NDEgMTIwIDExMiAxMjBIMThDOC4wNTg4NyAxMjAgMCAxMTEuOTQxIDAgMTAyWiIgZmlsbD0id2hpdGUiLz48L21hc2s+PGcgbWFzaz0idXJsKCNmYWNlU3F1YXJlTWFzazApIj48cmVjdCB4PSItMiIgeT0iLTIiIHdpZHRoPSIxMzQiIGhlaWdodD0iMTI0IiBmaWxsPSIjNDNBMDQ3Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNDEuOTQyIDEuOTkyNjFDMTQyLjg4NSAxLjg0MzM1IDE0My43MjUgMS41MTYyNyAxNDQuNDYyIDEuMDExMzdDMTQ0LjY0MSAwLjk4NjA3IDE0NC45MDQgMC45NDUzOTggMTQ1LjIzMyAwLjg5NDU2NEMxNDcuOTU0IDAuNDc0MzE4IDE1NS4xNzEgLTAuNjQwNDcxIDE1Ni40NzcgMC40OTU4NjVDMTU3LjMzIDEuMjM3MjcgMTU2Ljk0NyAzLjg3NTU2IDE1Ni42NzEgNS43NzI1NEMxNTYuNTY2IDYuNDkyOTYgMTU2LjQ3NyA3LjEwNjQ2IDE1Ni40NzcgNy40Njg1NEMxNTUuMTQ5IDcuNTMxNCAxNTQuMTQyIDYuMDY3NzUgMTUzLjE1NyA0LjYzNzI2QzE1MS42OTYgMi41MTUwNiAxNTAuMjg1IDAuNDY1ODE3IDE0Ny45NTQgMy41ODIwM0MxNDYuODYgNS4wNDI5IDE0Ny4xMTMgNi44ODY4MSAxNDcuMzY5IDguNzYwNzlDMTQ3LjYzOSAxMC43MzY5IDE0Ny45MTQgMTIuNzQ2NCAxNDYuNjIxIDE0LjM3NTZDMTQ1LjA4MyAxNi4zMTMzIDE0Mi42MjkgMTYuNTgyMiAxNDAuMjAzIDE2Ljg0NzlDMTM3LjYzNSAxNy4xMjkyIDEzNS4wOTkgMTcuNDA3IDEzMy43MTggMTkuNjU5OEMxMzMuMzIxIDIwLjMwODcgMTMzLjIxMyAyMS40NTg1IDEzMy4wOTYgMjIuNjk5NkMxMzIuODk0IDI0Ljg1MyAxMzIuNjY1IDI3LjI4MDkgMTMwLjg1NCAyNy44NDI1QzEyNy43MjggMjguODExOCAxMjcuNTI4IDI2LjE1MjUgMTI3LjM1NCAyMy44MzE0QzEyNy4yNiAyMi41ODUxIDEyNy4xNzQgMjEuNDM2MyAxMjYuNjQ2IDIwLjk5OTFDMTIwLjk1NyAxNi4yOTAxIDEyMC40MiAyNS4zNjkyIDEyMC4yOTggMjcuNDI5NEwxMjAuMjk2IDI3LjQ2MzFDMTIwLjI3MSAyNy44ODg5IDEyMC4zNDggMjguMjM2MiAxMjAuNDE5IDI4LjU1NDNDMTIwLjU0NiAyOS4xMzE2IDEyMC42NTMgMjkuNjEzIDEyMC4wODkgMzAuMjk0QzExOS43OTQgMzAuNjUwNyAxMTkuMzkxIDMwLjU4ODYgMTE4Ljk2NiAzMC41MjMyQzExOC41MzYgMzAuNDU3IDExOC4wODQgMzAuMzg3NSAxMTcuNyAzMC43NDU3QzExNi4xOTIgMzIuMTU1NCAxMTYuMTYyIDMyLjI5MDEgMTE1LjgxNiAzMy44NjAxTDExNS44MTYgMzMuODYwOEMxMTUuNzkxIDMzLjk3NTMgMTE1Ljc2NCAzNC4wOTc0IDExNS43MzUgMzQuMjI4MkMxMTUuNjE1IDM0Ljc2MjEgMTE1LjU0NSAzNS4yMTY4IDExNS40ODEgMzUuNjMwNkMxMTUuMzM1IDM2LjU2OTUgMTE1LjIyMiAzNy4yOTg1IDExNC42NDQgMzguMjY2OUMxMTQuMzc0IDM4LjcxNzcgMTE0LjAxMSAzOS4xNTg0IDExMy42NDkgMzkuNTk4MkMxMTIuNDQ4IDQxLjA1NzIgMTExLjI1MyA0Mi41MDczIDExMy41MDUgNDQuMjg3OUMxMTIuODg3IDQ0LjI5NDggMTA3LjUwNSA0NS43NDU1IDEwNy4xNDYgNDUuOTMzM0MxMDYuNjI2IDQ2LjIwNDggMTA2LjAyOCA0Ni45MTAzIDEwNS40OTMgNDcuNTQyMUwxMDUuNDkzIDQ3LjU0MjJMMTA1LjQ5MyA0Ny41NDIyQzEwNS4wMjIgNDguMDk3OSAxMDQuNiA0OC41OTY2IDEwNC4zMjEgNDguNjkzMkMxMDEuMTI3IDQ5Ljc5ODQgMTAxLjM1IDQ3LjQxMTkgMTAxLjU3OSA0NC45NTMxQzEwMS43MTcgNDMuNDc0MiAxMDEuODU3IDQxLjk2OTIgMTAxLjI1OCA0MS4xODIxQzEwOS41NDEgNDAuOTA1NiAxMTQuNTE5IDMyLjk2NzkgMTE1LjAxIDI2LjgwNDdDMTE1LjA4NSAyNS44NjM1IDExNC43MTQgMjUuMDU2NiAxMTQuMzY1IDI0LjI5NTdDMTE0LjA4NCAyMy42ODQ5IDExMy44MTcgMjMuMTAzOCAxMTMuODA1IDIyLjUwNjZDMTEzLjc4OCAyMS42NjYgMTE0LjA1OCAyMS4wOTY0IDExNC4zMjUgMjAuNTMwN0MxMTQuNTQ2IDIwLjA2MzUgMTE0Ljc2NiAxOS41OTkgMTE0LjgyMiAxOC45ODY5QzExNS4wNjQgMTYuMzUxMyAxMTMuOTggMTUuMzc2NyAxMTIuNTY0IDE0LjEwMzlDMTExLjg1MSAxMy40NjMgMTExLjA1NCAxMi43NDY1IDExMC4yOTkgMTEuNzA0NEMxMDcuNzk2IDguMjQ1NDcgMTA5LjEwNiA3LjcxMzU2IDExMi44OTQgOC4zMzY5NEMxMTUuMDcxIDguNjk1NCAxMTcuMTY0IDkuMzMyOTIgMTE5LjI1NyA5Ljk3MDUxQzEyMS44MTkgMTAuNzUxIDEyNC4zODEgMTEuNTMxNyAxMjcuMSAxMS44MDA2QzEzMC41NzkgMTIuMTQ0OCAxMzMuODEyIDExLjk3NTkgMTM1LjQ1OCA5LjE0MjU5QzEzNi40MDkgNy41MDcwMSAxMzYuODI1IDMuMDEwMjggMTMzLjY1OSAyLjY1NzM4QzEzNC40NTIgMi41MzI1NCAxMzUuMTAzIDIuMjc3ODkgMTM1Ljc2OCAyLjAxNzg5QzEzNi42MzQgMS42Nzg5MiAxMzcuNTI0IDEuMzMwODQgMTM4Ljc4MyAxLjI0OTM3QzEzOS43ODcgMS42NDA1NyAxNDAuODQxIDEuODg4NDkgMTQxLjk0MiAxLjk5MjYxWk0xNDcuNjk0IDg1Ljg3NDdDMTQ3LjY5NSA4NS44Nzc4IDE0Ny42OTcgODUuODgwMyAxNDcuNjk5IDg1Ljg4MkMxNDcuNzAxIDg1Ljg4MzggMTQ3LjcwMyA4NS44ODQ3IDE0Ny43MDUgODUuODg0NUMxNDcuNzAzIDg1Ljg4MjcgMTQ3LjcwMSA4NS44ODEyIDE0Ny43IDg1Ljg3OTdMMTQ3LjY5NCA4NS44NzQ3Wk01Ni4zNzk0IDkyLjQ2NTVDNTYuNDgxMSA5Mi41MDgzIDU2LjU5NDggOTIuNTA3MSA1Ni43MjEgOTIuNDYyQzU2LjUzNiA5Mi41OTg4IDU2LjI2MTEgOTIuNDg4MSA1Ni4zNTA2IDkyLjQ2NTlMNTYuMzQ5MiA5Mi40NjY2QzU2LjM1ODggOTIuNDY2MyA1Ni4zNjk3IDkyLjQ2NjEgNTYuMzgwMSA5Mi40NjZMNTYuMzc5NCA5Mi40NjU1Wk01Ni4zNzI4IDkyLjQ2MjhDNTYuMzY1OSA5Mi40NjEgNTYuMzU4NiA5Mi40NjIxIDU2LjM1MDYgOTIuNDY1OUM1Ni4zNTY0IDkyLjQ2NDUgNTYuMzYzOCA5Mi40NjM0IDU2LjM3MjggOTIuNDYyOFpNMTU1LjQzNyAxMzIuNDg3QzE1NS4xIDEzMi40NjEgMTU1LjEwNiAxMzIuNDUyIDE1NS40NDkgMTMyLjQyNkMxNTUuNTA5IDEzMi4xNDkgMTU1LjYwNCAxMzEuODU3IDE1NS42OTYgMTMxLjU3N0MxNTUuOTEzIDEzMC45MTMgMTU2LjEwNiAxMzAuMzIzIDE1NS43MyAxMzAuMTlDMTU2Ljg2MSAxMjkuOTcgMTU2LjY1IDEzMS45ODcgMTU2LjUyOSAxMzMuMTQ1TDE1Ni41MjkgMTMzLjE0NkMxNTYuNTAxIDEzMy40MTcgMTU2LjQ3NyAxMzMuNjQyIDE1Ni40NzcgMTMzLjc3OUMxNTUuNDE3IDEzMy43ODQgMTU1LjI5OCAxMzMuMTkzIDE1NS40MzcgMTMyLjQ4N1pNMTU1LjUxNiAxMzEuNzg1TDE1NS41MTQgMTMxLjc2NUwxNTUuNTEzIDEzMS43NEMxNTUuMDgzIDEzMS43NzEgMTU1LjA4NCAxMzEuNzc5IDE1NS41MTcgMTMxLjgxMkwxNTUuNTE2IDEzMS43ODVaTTY1LjY1MjYgMC40OTU4NjVDNjYuMDM2OSAwLjU3Mzk3NSA2Ny4xNDg3IDAuNjc4NTE5IDY3LjUxNTcgMC40OTU4NjVMNjUuNjUyNiAwLjQ5NTg2NVpNNjMuMDEzNSA1Ny40Nzk0QzYxLjk0OTcgNTcuMjI4MyA2MS41NjU1IDU2LjU2MDkgNjEuMjc3IDU2LjA1OTZDNjEuMTE1NyA1NS43Nzk1IDYwLjk4NDMgNTUuNTUxMiA2MC43ODA4IDU1LjQ3NjRDNTcuOTQ3NSA1NC40MzQ2IDU3LjQ5NDEgNTYuMzk1NyA1Ny4wMDcgNTkuNDYzMUM1Ni45MTkyIDYwLjAxNjEgNTYuODk4NiA2MC40OTQ1IDU2Ljg3OTggNjAuOTMwOFY2MC45MzA4QzU2LjgzMzUgNjIuMDA2MiA1Ni43OTgzIDYyLjgyNTUgNTUuNzk0MyA2My44NzQzQzU1LjIyMzggNjQuNDcwNCA1NC4yODMzIDY0Ljc4MzggNTMuMzUyMiA2NS4wOTQxTDUzLjM1MjEgNjUuMDk0MUM1Mi42NzU2IDY1LjMxOTUgNTIuMDA0MSA2NS41NDMzIDUxLjQ4MjkgNjUuODcyN0M1MC4wMTE3IDY2LjgwMjMgNDkuMzU4OSA2Ny42NTQ1IDQ4LjU2MDYgNjguNjk2NEM0OC4yNDM5IDY5LjEwOTggNDcuOTA0NCA2OS41NTMxIDQ3LjQ4MTcgNzAuMDQyOUM0Ni41MjIgNzEuMTU1IDQ1LjExODMgNzIuMjI1MSA0My42NjE1IDczLjMzNTdDMzkuNzUxMyA3Ni4zMTY2IDM1LjQ1ODUgNzkuNTg5MiAzOC4zNDA0IDg0Ljc0ODZDNDEuNDM2NCA5MC4yOTE3IDQyLjY2MjkgODUuNjA1OCA0My42MDkzIDgxLjk5MDFDNDMuOTcyNCA4MC42MDMxIDQ0LjI5NDIgNzkuMzczNyA0NC42NjQ0IDc4LjkzOTRDNDkuMzI1OCA3My40NzQgNTAuMzM4MiA3OC44MTU0IDUwLjk0NTYgODIuMDE5NkM1MS4wNDQ4IDgyLjU0MyA1MS4xMzMyIDgzLjAwOTQgNTEuMjI0OSA4My4zNjIzQzUyLjUzMyA4OC4zOTQxIDU0LjMyMjQgODQuNzY3NCA1NS43OTc0IDgxLjc3NzlDNTYuMjQxNSA4MC44Nzc4IDU2LjY1NyA4MC4wMzU1IDU3LjAyMjQgNzkuNTA0N0M1Ny40NjA2IDc4Ljg2OCA1OC4wMDg2IDc4LjQwMzkgNTguNTQxOSA3Ny45NTIxTDU4LjU0MiA3Ny45NTJDNTkuMjAyMSA3Ny4zOTI5IDU5LjgzOTcgNzYuODUyOCA2MC4yMTkyIDc2LjAyODJDNjAuNDU4MiA3NS41MDg2IDYwLjM0MTQgNzQuODU5IDYwLjIyMTMgNzQuMTkxNUM2MC4wMjMyIDczLjA4OTYgNTkuODE2MiA3MS45Mzg4IDYxLjE4NjkgNzEuMjQzN0M2Mi42MzkyIDcwLjUwNzEgNjQuMzA3MSA3MS40MDM1IDY1Ljc5MjggNzIuMjAxOUM2Ni45MTkxIDcyLjgwNzMgNjcuOTQwOCA3My4zNTYzIDY4LjY4NDQgNzMuMDk1QzcxLjAyMjkgNzIuMjczNCA2OC45MTk1IDY5LjQ5ODQgNjcuMjM2NCA2Ny4yNzc5TDY3LjIzNjQgNjcuMjc3OEw2Ny4yMzYyIDY3LjI3NzdMNjcuMjM2IDY3LjI3NzRMNjcuMjM2IDY3LjI3NzRMNjcuMjM1OSA2Ny4yNzcyTDY3LjIzNTcgNjcuMjc3MUM2Ni40NjIzIDY2LjI1NjYgNjUuNzc3NyA2NS4zNTM0IDY1LjY1NDEgNjQuODEwOEM2NS4yOTQyIDYzLjIzMiA2NS45MjggNjEuODYyNyA2Ni41NjE0IDYwLjQ5NDJDNjcuMjAyNiA1OS4xMDg5IDY3Ljg0MzUgNTcuNzI0MyA2Ny40NTMgNTYuMTIzOUM2Ni43OTc4IDU2LjIxMzggNjYuMjI4NiA1Ni41MjYzIDY1LjY2NDggNTYuODM1OUM2NC44NTA4IDU3LjI4MjggNjQuMDQ4IDU3LjcyMzYgNjMuMDEzNSA1Ny40Nzk0Wk0xMDQuNjA2IDk0LjA2NTJDMTA0LjUyMSA5NC4wNjU5IDEwNC40MzkgOTQuMDY4MSAxMDQuMzYyIDk0LjA3MzdDMTA0LjQ0NCA5NC4wODExIDEwNC41MjYgOTQuMDc3MyAxMDQuNjA2IDk0LjA2NTJaTTExOS44ODUgNzguNzAwMUMxMjAuMjY4IDc2LjAzOTIgMTE4LjE2NCA3NC42Nzg3IDExNS45ODYgNzMuMjdDMTE1LjI5NyA3Mi44MjQyIDExNC42IDcyLjM3MzYgMTEzLjk3MyA3MS44NzUzQzExMi41NDQgNzAuNzQyMSAxMTEuNTc3IDY5Ljc5NTcgMTEwLjg0OSA2OC4yMDU4QzExMC43MjUgNjcuOTM0MiAxMTAuNzAxIDY3LjQ3NzcgMTEwLjY3NyA2Ny4wMDUxQzExMC42NDEgNjYuMzIwNSAxMTAuNjA0IDY1LjYwMiAxMTAuMjU3IDY1LjM2MjZDMTA4LjQxMSA2NC4wODg3IDEwNy4zNzYgNjQuOTY1MyAxMDYuMTMzIDY2LjAxODNDMTA1LjUzOCA2Ni41MjI3IDEwNC44OTUgNjcuMDY3NyAxMDQuMDkyIDY3LjQzNkMxMDEuMzcxIDY4LjY4MzYgMTAxLjMzOCA2OC42NjM5IDk5LjcwOCA2Ny43MDA0TDk5LjcwNzkgNjcuNzAwM0w5OS43MDcgNjcuNjk5OEw5OS43MDY3IDY3LjY5OTZDOTkuMzc4NSA2Ny41MDU2IDk4Ljk4NTcgNjcuMjczMyA5OC40OTMzIDY3LjAwNTVDOTguMjQxOCA2Ni44Njg3IDk4LjAwNDUgNjYuNzI3NCA5Ny43NzcxIDY2LjU5MTlMOTcuNzc3IDY2LjU5MTlMOTcuNzc2OSA2Ni41OTE4Qzk2LjI4MyA2NS43MDE5IDk1LjIxODQgNjUuMDY3NyA5My4zODE4IDY3LjY2NjJDOTIuNjQ1NSA2OC43MDc4IDkyLjY4MzggNzAuNTM4NCA5Mi43MjM2IDcyLjQzOTJDOTIuNzkwMyA3NS42MjQyIDkyLjg2MTEgNzkuMDA2NSA4OS4yOTg3IDc5LjIwNTRDOTAuODY1NSA3OS44OTU4IDkwLjE1OTggODEuOTUxOSA4OS40NDMyIDg0LjAzOTRDODguNzAzOSA4Ni4xOTMyIDg3Ljk1MyA4OC4zODA1IDg5LjY3NDkgODkuMTM2QzkzLjg1MjcgOTAuOTY4OSA5NS4wNjQ5IDgyLjI3OTcgOTUuNzU4NCA3Ny4zMDc3Qzk1Ljk4NyA3NS42NjkyIDk2LjE1OTMgNzQuNDM0NCA5Ni4zNjI4IDc0LjExMjlDOTguMDI1MiA3MS40ODYyIDEwMy45ODcgNjkuMjUzNCAxMDUuNzAzIDczLjEyNzZDMTA2LjAxIDczLjgyMSAxMDUuNzgyIDc0LjU2NzkgMTA1LjU1MSA3NS4zMjU5QzEwNS4zMjggNzYuMDYwMSAxMDUuMTAxIDc2LjgwNDcgMTA1LjM1MyA3Ny41MjE0QzEwNS43MiA3OC41NjMyIDEwNi4zMjQgNzguOTQ0MiAxMDcuMDIzIDc5LjM4NTlDMTA3LjM5OCA3OS42MjI2IDEwNy44IDc5Ljg3NjggMTA4LjIwOSA4MC4yNTk2QzExMS4xMDMgODIuOTcxMiAxMTAuOTk4IDgzLjEzNzIgMTA5LjU0OSA4NS40NDI1TDEwOS41NDkgODUuNDQyNkMxMDkuMzAxIDg1LjgzNzkgMTA5LjAxMyA4Ni4yOTYyIDEwOC42OTQgODYuODQwOUMxMDguMzggODcuMzc2MSAxMDguMTMzIDg4LjIyMzYgMTA3Ljg2MyA4OS4xNTM0QzEwNy4yNSA5MS4yNTcyIDEwNi41MTQgOTMuNzgyNiAxMDQuNjA2IDk0LjA2NTNDMTA1LjY0NiA5NC4wNTc5IDEwNi43MzUgOTQuMzExNyAxMDcuODEyIDk0LjU2MjVMMTA3LjgxMiA5NC41NjI1QzEwOS44NzQgOTUuMDQyNSAxMTEuODg5IDk1LjUxMTkgMTEzLjQyMSA5NC4xMjFDMTE0LjQ4OCA5My4xNTE1IDExNC4zMDYgOTEuMzk3OCAxMTQuMTMyIDg5LjcyNkMxMTQuMDE5IDg4LjYzMTMgMTEzLjkwOSA4Ny41NzE3IDExNC4xNTYgODYuNzkwM0MxMTQuNjAzIDg1LjM3MjUgMTE1Ljc5MSA4NC4xOTE2IDExNi45NzMgODMuMDE2M0MxMTguMzEzIDgxLjY4MyAxMTkuNjQ3IDgwLjM1NjggMTE5Ljg4NSA3OC43MDAxWk00Mi44OTEgMTEwLjQ1NEM0Mi45MjgxIDExMC45MzQgNDIuOTcwNiAxMTEuNDgzIDQzLjA3NyAxMTIuMTVDNDMuNDcyNCAxMTQuNjI3IDQ0LjU5MzUgMTE2LjA0MiA0Ni4wMzI2IDExNy44NTlMNDYuMDMyNiAxMTcuODU5TDQ2LjAzMzggMTE3Ljg2MUM0Ni4zMzU0IDExOC4yNDEgNDYuNjUwOSAxMTguNjQgNDYuOTc2NiAxMTkuMDY5QzQyLjYxMyAxMTkuMTM4IDM5LjE3MjEgMTIzLjY4IDQzLjk0NDQgMTI2LjI0NEM0Mi4wMTI5IDEyNS4yMDYgNDAuNTUyMyAxMjYuMzY0IDM5LjM2NSAxMjcuMzA1QzM3Ljg3MjEgMTI4LjQ4OCAzNi44MTEyIDEyOS4zMjkgMzUuNzg5NyAxMjUuMDMxQzM1LjcxNTIgMTI0LjcxNyAzNS42MTYyIDEyNC4zMzggMzUuNTExMSAxMjMuOTM2QzM1LjI4NDEgMTIzLjA2NyAzNS4wMjg3IDEyMi4wODkgMzQuOTI5OCAxMjEuNDI1QzM0LjcxNzIgMTE5Ljk5NSAzNC43NTQzIDExOS44MTcgMzQuOTE4OCAxMTkuMDI3TDM0LjkxODggMTE5LjAyN0MzNC45NDcyIDExOC44OTEgMzQuOTc5MyAxMTguNzM3IDM1LjAxNDUgMTE4LjU1NUMzNS4xMDQxIDExOC4wOTMgMzUuMjgxOSAxMTcuNzcxIDM1LjQ0NjEgMTE3LjQ3M0MzNS43OTU4IDExNi44MzggMzYuMDgzNSAxMTYuMzE2IDM1LjMyNDEgMTE0LjgwM0MzNC45Mjg1IDExNC4wMTQgMzQuNDQwOCAxMTMuMzk5IDMzLjk3NzkgMTEyLjgxNEMzMy4xMzQ5IDExMS43NSAzMi4zNzQgMTEwLjc4OSAzMi40MDA2IDEwOS4wOEMzMi40MDggMTA4LjYgMzIuNjExNCAxMDguMjIxIDMyLjgzMDQgMTA3LjgxM0MzMy4xOTgyIDEwNy4xMjcgMzMuNjEwMyAxMDYuMzU5IDMzLjIxMjUgMTA0Ljg5MkMzMi45ODE5IDEwNC4wNDIgMzIuNTU4MiAxMDMuMjM2IDMyLjEzNDEgMTAyLjQyOUMzMS42MjUgMTAxLjQ2MSAzMS4xMTU0IDEwMC40OTEgMzAuOTM5NCA5OS40NDQzQzMyLjc0MDYgOTkuNTIwNCAzMy44ODU0IDEwMC44OTIgMzQuOTEzMyAxMDIuMTI1QzM1LjI3NDQgMTAyLjU1NyAzNS42MjExIDEwMi45NzMgMzUuOTc2OCAxMDMuMzA5QzM2Ljc3MzggMTA0LjA2MiAzNy43MzQ1IDEwNC41OTUgMzguNjY2MiAxMDUuMTExQzM5LjQ3OTEgMTA1LjU2MiA0MC4yNzAxIDEwNi4wMDEgNDAuOTExMiAxMDYuNTYzQzQyLjcxMiAxMDguMTQyIDQyLjc3NSAxMDguOTU1IDQyLjg5MSAxMTAuNDU0Wk00OC42ODE3IDk3LjI5NjRDNTAuMTY5NiA5Ny40MiA1NC4xNjEzIDk0LjE1NzYgNTQuNDE4NCA5My4yMjYxQzUzLjEzNCA5My40NjY0IDUxLjgyMjUgOTIuODY5OCA1MC41Mzc4IDkyLjI4NTNDNDkuMTAwOSA5MS42MzE2IDQ3LjY5NzYgOTAuOTkzMSA0Ni40MDI5IDkxLjU1NzhDNDQuMTA5NSA5Mi41NTgxIDQ2LjU1IDk3LjExOTQgNDguNjgxNyA5Ny4yOTY0Wk0xMDcuMDQgOTguOTI0NUMxMDUuNDA2IDk5LjIyNDYgMTAzLjU1MyA5OS41NjUgMTAyLjQ2IDk4LjkyMjRDMTAxLjQwMyA5OC4zMDA0IDk5LjI5NzUgOTUuNjM4MyAxMDIuMzU4IDk1Ljc4NzdDMTAzLjEzNiA5Ni4wODc4IDEwNC4wMzMgOTYuMjgxNiAxMDQuOTE4IDk2LjQ3MjhDMTA2Ljc5MSA5Ni44NzczIDEwOC42MSA5Ny4yNzAyIDEwOS4xMzIgOTguNjMzNUMxMDguNTU4IDk4LjY0NTcgMTA3LjgyNCA5OC43ODA1IDEwNy4wNCA5OC45MjQ1Wk04Ni41OTA2IDc0Ljk4NzRDODUuNzU4MSA3NC45Mzc3IDg0Ljk3NjIgNzQuNzg4IDg0LjI1NzQgNzQuNjUwNEM4Mi4wOTY0IDc0LjIzNjcgODAuNTA2OCA3My45MzI0IDc5LjgzMSA3Ni43ODI3QzgwLjk0NTMgNzYuNzMzNSA4Mi4wNjQgNzcuMDI3IDgzLjA2MiA3Ny4yODg4Qzg1LjE3MTggNzcuODQyMyA4Ni43NDIyIDc4LjI1NDIgODYuNTkwNiA3NC45ODc0Wk0xMTUuNTY2IDExMS40MzlDMTE0Ljg1IDExMS4wNzggMTE0LjE3NiAxMTAuNzM4IDExMy42NDIgMTEwLjdDMTE0LjMyNSAxMTAuNTkyIDExNC40NDcgMTA5LjkzMyAxMTQuNTYzIDEwOS4zMDdDMTE0LjY2MSAxMDguNzgxIDExNC43NTQgMTA4LjI3OSAxMTUuMTcyIDEwOC4xNDRDMTE1LjMzNyAxMDguMTg2IDExNS41MzMgMTA4LjIzMiAxMTUuNzQ4IDEwOC4yODJDMTE3LjUxMyAxMDguNjkzIDEyMC42MzEgMTA5LjQyIDExOS44NjQgMTExLjEwMUMxMTguOTM0IDExMy4xMzggMTE3LjE0OCAxMTIuMjM3IDExNS41NjYgMTExLjQzOVpNNDcuMDE2MiAxMTkuMTUzQzQ2LjI4MDkgMTE5LjE5MSA0Ni43NzY3IDExOS4zNTQgNDcuMDkzOCAxMTkuMzkzTDQ3LjAxNjIgMTE5LjE1M1pNODguNDc0OCA3MS4xMjUxQzg5LjMwMTYgNzAuNTU3NiA4OS4yNzU0IDY3LjkzNzIgODguMDE3NiA2Ny44MTg3Qzg2LjI3MiA2OC4yMDk3IDg3LjE1ODkgNzIuMDI4NSA4OC40NzQ4IDcxLjEyNTFaTTE1My42MDIgNDAuNDQ5OEMxNTMuNjI3IDQxLjAzNTcgMTU2LjIwNSA0My41NDI4IDE1Ni40NzcgNDMuNTM0NEMxNTYuNDc3IDQzLjQ1ODMgMTU2LjUwMyA0My4yNzIyIDE1Ni41MzcgNDMuMDE4MkMxNTYuNzEzIDQxLjczMTYgMTU3LjEyNSAzOC43MDE1IDE1NS42ODUgMzkuMzgyN0MxNTUuNDQyIDM5LjQ5NzggMTU1LjIxMSAzOS42NTkyIDE1NC45NzkgMzkuODIxN0MxNTQuNTU1IDQwLjExODMgMTU0LjEyNiA0MC40MTg5IDE1My42MDIgNDAuNDQ5OFpNNDUuNjI0NyAxMzMuODU5QzQwLjQ4NDEgMTMzLjg1OSA0Mi4zMDc5IDEzMS40NzQgNDMuNjgwMyAxMzIuMjA5QzQzLjk3NzcgMTMyLjM2OSA0NC4yMzQzIDEzMi42NDUgNDQuNDkwOSAxMzIuOTIyQzQ0Ljc4ODIgMTMzLjI0MiA0NS4wODUzIDEzMy41NjIgNDUuNDQ1NSAxMzMuN0M0NS41MzgzIDEzMy43MzYgNDUuNTYyMiAxMzMuNzcyIDQ1LjU4NiAxMzMuODA5QzQ1LjU5NjggMTMzLjgyNiA0NS42MDc2IDEzMy44NDMgNDUuNjI0NyAxMzMuODU5Wk0yMy4zMDAyIDUuMTI0NDFDMjMuMzEzNiA0LjY4NzkgMjAuODc1MyAzLjkzMiAyMi4zMDA5IDQuOTA2NzVDMjIuMTU1NCA0LjgwNzI5IDIyLjI3MDggNC44NTUwMSAyMi40Njc1IDQuOTM2MzdDMjIuNzc5MiA1LjA2NTM1IDIzLjI5NTMgNS4yNzg4NCAyMy4zMDAyIDUuMTI0NDFaTTE0Ny4zNyA0OS43NTA4QzE0NS44MzggNDkuMzM0IDE0OS45OTMgNDkuNTIyNyAxNDkuNDc0IDUwLjY4MzNDMTQ5LjA0OSA1MC42MjU5IDE0OC42OCA1MC40MTA1IDE0OC4zMSA1MC4xOTQ2QzE0OC4wMDcgNTAuMDE4MiAxNDcuNzA0IDQ5Ljg0MTYgMTQ3LjM3IDQ5Ljc1MDhaIiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjIiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTYyLjEyMzcgMzIuNzQ3NkM2Mi4zNTczIDMxLjk4OTcgNjEuOTcyNyAzMS4xNTI0IDYxLjU4NjcgMzAuMzExOEM2MS4yNjY5IDI5LjYxNTUgNjAuOTQ2MiAyOC45MTcgNjAuOTc1MSAyOC4yNTk5QzYxLjAwMjYgMjcuNjM1NCA2MS40NTQ1IDI2LjUwOTEgNjEuODg0OSAyNS40MzYyTDYxLjg4NDkgMjUuNDM2MkM2Mi4xODY2IDI0LjY4NDEgNjIuNDc3OCAyMy45NTg0IDYyLjYwNDggMjMuNDUwMkM2Mi42NDIyIDIzLjMwMDYgNjIuNjgxIDIzLjE0MTYgNjIuNzIxOCAyMi45NzQ3QzYzLjUxMTQgMTkuNzQxOCA2NS4wMTM1IDEzLjU5MTYgNzAuNDI1MyAxNi40NTMzQzY2LjA4NyAxNC4xNTkzIDY3Ljg3MDggMTIuMzMxNyA2OS44NTc1IDEwLjI5NjNDNzAuNjMwMiA5LjUwNDU3IDcxLjQzMzYgOC42ODE0MyA3MS45MTk0IDcuNzg3MTZDNzIuMzIwNyA3LjA0ODQ5IDcyLjY0MyA2LjcxMzIyIDcyLjgzMjIgNi41MTY0NEM3Mi45NDM3IDYuNDAwNDYgNzMuMDA4OSA2LjMzMjYgNzMuMDE2OCA2LjI1ODZDNzMuMDI4IDYuMTU0MjEgNzIuOTI1IDYuMDM3NjMgNzIuNjc2NyA1Ljc1NjU2QzcyLjU3MjggNS42Mzg5NyA3Mi40NDM1IDUuNDkyNTggNzIuMjg2NCA1LjMwNjI1QzcxLjY5MzggNC42MDMxMiA2Ny40OTc1IDMuNjU1MTYgNjYuNTAwNiAzLjY3NzkzQzYyLjY3NDggMy43NjU3NiA1OC41MjQ3IDcuMzgxMjQgNTYuNjAyNiAxMC4yOTY1QzU1LjU3MTIgMTEuODYwNSA1NS45Mjk0IDEyLjczMDMgNTYuMjcwOCAxMy41NTkzQzU2LjQ3NjQgMTQuMDU4NyA1Ni42NzYgMTQuNTQzMyA1Ni41NjIxIDE1LjE1NTlDNTYuNTE1NSAxNS40MDY4IDU2LjU0NDggMTUuNjU4NyA1Ni41NzI3IDE1Ljg5ODNWMTUuODk4M0M1Ni42NTgzIDE2LjYzMyA1Ni43MzA0IDE3LjI1MjEgNTQuNTU3NCAxNy4zNzI4QzUxLjg1MTEgMTcuNTIzMyA0Ni43ODYgMTMuMDM4NSA0Ni43NjEyIDEwLjg0MjVDNDYuNzUzMSAxMC4xMDkgNDcuNTQwNSA5LjI3NzY2IDQ4LjMyODQgOC40NDU4MUM0OS43MjE1IDYuOTc1MDQgNTEuMTE2MSA1LjUwMjY4IDQ4LjExNzcgNC41NjY4MkM0NS44NzY5IDMuODY3NjMgMzkuMDg4NiA4LjM2ODkxIDM4LjY2ODcgMTAuMDc2N0MzOC40MDg4IDExLjEzNCAzOS4xNjMxIDEyLjI3NTEgMzkuODI0NiAxMy4yNzU5QzQwLjg3OTQgMTQuODcxNCA0MS42OTgzIDE2LjExMDMgMzcuNzk1NCAxNi4wODQyQzM3LjgwOTMgMTYuMDU1MSA0MS40MzA4IDE4LjM2ODkgNDEuODAzMyAxOC44NTAzQzQyLjY0NTggMTkuOTM5NSA0Mi45Njg5IDIwLjczMjUgNDMuMjQ1NyAyMS40MTJDNDMuNzIyOSAyMi41ODM1IDQ0LjA2MjcgMjMuNDE3OCA0Ni42OTAxIDI0Ljg1MDhDNDcuNzkxNCAyNS40NTE2IDQ4Ljk2NjggMjUuOTcxNSA1MC4xNDI1IDI2LjQ5MTZDNTEuNzIwNyAyNy4xODk4IDUzLjI5OTYgMjcuODg4MyA1NC43MDA4IDI4Ljc4MjdDNTUuNDU4MSAyOS4yNjYgNTYuMTAzNiAyOS44NDU5IDU2LjczMzggMzAuNDEyQzU4LjIwNTMgMzEuNzMzOCA1OS41OTMxIDMyLjk4MDUgNjIuMTIzNyAzMi43NDc2Wk0xNTEuMzY2IDkuNTA0NDdDMTQ5Ljk1NyAxMC4yNDM1IDE1MC43NjggMTAuODk2NiAxNTEuNzQzIDExLjY4MjJDMTUyLjcxNyAxMi40NjY3IDE1My44NTUgMTMuMzgzNCAxNTMuMTEgMTQuNjQ5NkMxNTIuNjMxIDE1LjQ2MjggMTUxLjUgMTUuNjM2NCAxNTAuMzQxIDE1LjgxNDNDMTQ5LjE2OSAxNS45OTQxIDE0Ny45NjggMTYuMTc4NCAxNDcuMzg1IDE3LjAzMjVDMTQ2LjU0NCAxOC4yNjE5IDE0Ni44ODMgMTkuMTI4NSAxNDcuMjEzIDE5Ljk2OTRDMTQ3LjU5NyAyMC45NTE2IDE0Ny45NjggMjEuODk4OCAxNDYuNDI5IDIzLjM0ODJDMTQ1LjM1MSAyNC4zNjQ1IDE0NC4zMzMgMjQuNjkwNiAxNDMuNDQ5IDI0Ljk3MzdDMTQyLjEzOSAyNS4zOTM1IDE0MS4xMjQgMjUuNzE4NiAxNDAuNjQ0IDI4LjA1OTJDMTM5LjkwOCAzMS42NDQzIDE0MS43NCAzNC4wMjYzIDE0My40OTEgMzYuMzAxOEMxNDUuNDcyIDM4Ljg3NzIgMTQ3LjM0OCA0MS4zMTYyIDE0NS4yNzcgNDUuMjA5QzE0NS4xODIgNDUuMzg4MSAxNDUuMDY0IDQ1LjU5MzYgMTQ0LjkzNSA0NS44MTkzTDE0NC45MzUgNDUuODE5OEMxNDMuODUgNDcuNzE3MSAxNDEuOTQ5IDUxLjA0MjMgMTQ1LjU1OCA1Mi4xNTczQzE0OC4xOTQgNTIuOTcxNyAxNDguMDM1IDUyLjA0MTMgMTQ3Ljg3MSA1MS4wNzUyQzE0Ny43NDcgNTAuMzQ4OCAxNDcuNjIgNDkuNjAyMyAxNDguNjc0IDQ5LjU2MkMxNDguNDU1IDQ4Ljk2NzIgMTUxLjY0OSA0OS42NTk5IDE1MS4yNTQgNTAuNTM4MkMxNTIuMDk1IDUwLjYyODYgMTUyLjUwMyA1MS4wODE2IDE1Mi45IDUxLjUyMTFDMTUzLjQ3MSA1Mi4xNTQxIDE1NC4wMTYgNTIuNzU5MiAxNTUuNzkgNTIuMjEyOUMxNTcuNTY0IDUxLjY2NjggMTU3Ljg0NyA1MC4wMjE2IDE1OC4wOCA0OC42NjY4TDE1OC4wOTggNDguNTYxM0MxNTguNDQ4IDQ2LjUzMDQgMTU3LjUxIDQ0Ljc2ODkgMTU2LjYwNiA0My4wNzE2QzE1NS44NTQgNDEuNjU5NiAxNTUuMTI1IDQwLjI5MjEgMTU1LjE4MiAzOC44NTFDMTU1LjE5MSAzOC42NDI3IDE1NS4xODUgMzguNDcxMyAxNTUuMTc5IDM4LjMxNDlDMTU1LjE2NiAzNy45NDU0IDE1NS4xNTcgMzcuNjYwNiAxNTUuMzQ0IDM3LjE3NTRDMTU1LjkzMSAzNi43NjMzIDE1Ni41OTcgMzYuNjA2IDE1Ny4zNDIgMzYuNzAzNEMxNTguNDk1IDM2Ljk0MzMgMTU4LjgxNyAzNi41MDc3IDE1OC4zMDcgMzUuMzk2OEMxNTkuMzExIDMzLjQ3MjggMTU4LjkzMiAzMC4yMTkzIDE1OC41OTkgMjcuMzUzM0MxNTguNDQ4IDI2LjA1NTkgMTU4LjMwNyAyNC44Mzc5IDE1OC4zMDcgMjMuODU4NUMxNTguMzA3IDIzLjE4MTQgMTU4LjQyNiAyMi4wNDkyIDE1OC41NjUgMjAuNzIzN0MxNTguOTMgMTcuMjU0MiAxNTkuNDM1IDEyLjQ2MDQgMTU4LjMwNyAxMS4wMzgzQzE1Ny42NDkgMTAuMjA5MSAxNTIuNDk4IDguOTExMjUgMTUxLjM2NiA5LjUwNDQ3Wk0xNTMuNTgyIDU4LjM1MjVDMTUwLjYwNyA1Ny41OTQgMTUwLjk2OCA1OS45MTYyIDE1MS4yNDUgNjEuNzAzM1Y2MS43MDM0VjYxLjcwMzVMMTUxLjI0NSA2MS43MDM3TDE1MS4yNDUgNjEuNzA0OEwxNTEuMjQ2IDYxLjcwNTVDMTUxLjMyNiA2Mi4yMjA4IDE1MS4zOTkgNjIuNjkxNSAxNTEuMzgyIDYzLjAzMDhDMTUxLjI0MiA2NS45ODU5IDE1MC44OTkgNjYuNzA1NSAxNDcuMjI5IDY3LjE5MjhDMTQ2LjM1MSA2Ny4zMDk0IDE0NS41MTIgNjcuMDk2NyAxNDQuNjg0IDY2Ljg4NjZDMTQzLjI4OSA2Ni41MzI2IDE0MS45MjMgNjYuMTg2MiAxNDAuNDQ3IDY3LjQzOTFDMTM5LjYxNyA2OC4xNDM5IDEzOS42NTUgNjkuMDEgMTM5LjY5NCA2OS44ODA4QzEzOS43MTMgNzAuMzA2NCAxMzkuNzMyIDcwLjczMzEgMTM5LjY0OSA3MS4xNDI2QzEzOS41MDkgNzEuODM2OSAxMzguOTc0IDcyLjkxNTkgMTM4LjQwNCA3NC4wNjU5TDEzOC40MDQgNzQuMDY2QzEzNy4zNTQgNzYuMTg1IDEzNi4xODQgNzguNTQ1MiAxMzcuMTQ0IDc5LjE4NDVDMTM3Ljc5MyA3OS42MTY3IDEzOS42NjcgNzkuMTIzNSAxNDEuODAyIDc4LjU2MkMxNDUuNDc1IDc3LjU5NTkgMTQ5LjkxOCA3Ni40MjczIDE1MC4yMDkgNzkuNDIwNkMxNTAuMzgyIDgxLjE5NTMgMTQ4LjA0OSA4MS40Njc0IDE0NS44MzIgODEuNzI2MUMxNDQuMzkyIDgxLjg5NDIgMTQzIDgyLjA1NjUgMTQyLjM3NiA4Mi42MjE0QzE0Mi4xODkgODIuNzkwOCAxNDEuODI2IDg0LjA0OTYgMTQxLjQ2NSA4NS4zMDRDMTQxLjA2MiA4Ni43MDI0IDE0MC42NiA4OC4wOTUyIDE0MC41MDUgODcuOTY3M0MxNDEuMTYgODguNTA5MSAxNDIuMTk2IDg3Ljc3MTUgMTQzLjQyMyA4Ni44OTc0QzE0NS4yMjMgODUuNjE1NSAxNDcuNDM1IDg0LjA0MDEgMTQ5LjQ2MSA4NS43NzU5QzE0Ni45NzMgODEuMDI0NiAxNTQuMzE0IDgxLjY5OTggMTU3LjQ0OSA4MS45ODgxQzE1Ny43OTEgODIuMDE5NiAxNTguMDgzIDgyLjA0NjQgMTU4LjMwNyA4Mi4wNjExVjY2LjIxMTRDMTU0Ljc1NCA2Ny4xNDQ2IDE1NC45ODMgNjUuMTMzNiAxNTUuMjM4IDYyLjg5NTlDMTU1LjQ1NyA2MC45NzY4IDE1NS42OTUgNTguODkxIDE1My41ODIgNTguMzUyNVpNMTU1LjUxMSAxMjYuNTU0SDE1NS41MTFIMTU1LjUxMkgxNTUuNTEySDE1NS41MTJDMTU2LjQxMyAxMjYuNjA0IDE1Ny4zMjQgMTI2LjY1NCAxNTguMzA3IDEyNi42NDFDMTU4LjMwNyAxMjcuNDU5IDE1Ny41NjkgMTI3LjgxOSAxNTYuODI4IDEyOC4xOEMxNTYuMTg3IDEyOC40OTMgMTU1LjU0NCAxMjguODA2IDE1NS4zNzMgMTI5LjQxOEMxNTQuODg2IDEzMS4xNTUgMTU1Ljk1NCAxMzEuNzUyIDE1Ni45MzUgMTMyLjNDMTU3LjY0MyAxMzIuNjk3IDE1OC4zMDcgMTMzLjA2NyAxNTguMzA3IDEzMy44MjNDMTU3LjQ3IDEzMy44MjMgMTU2LjUyOSAxMzMuODY0IDE1NS41NTIgMTMzLjkwN0MxNTMuNDgzIDEzMy45OTcgMTUxLjI1MyAxMzQuMDkzIDE0OS41MTIgMTMzLjgyM0gxNDYuNTgxQzE0Ni40OTYgMTMzLjQ0MyAxNDYuNDExIDEzMy4wNjIgMTQ2LjMyNiAxMzIuNjgxQzE0Ni4yIDEzMi42MjIgMTQ2LjA1NiAxMzIuNTU1IDE0NS44OTggMTMyLjQ4MUMxNDQuNjgzIDEzMS45MTMgMTQyLjYxOCAxMzAuOTQ4IDE0MS43MTIgMTMwLjMxN0MxMzcuMTk5IDEyNy4xNzIgMTQxLjI1MyAxMjMuOSAxNDUuNDkyIDEyMi41OTZDMTQyLjU2NSAxMjMuNDk3IDE0Ni41ODIgMTI2LjM4OCAxNDguMDAxIDEyNi43ODRDMTQ5LjA5NCAxMjcuMDg4IDE0OS43MzkgMTI2LjkzNCAxNTAuNDk0IDEyNi43NTRDMTUwLjk0NCAxMjYuNjQ2IDE1MS40MzUgMTI2LjUyOSAxNTIuMDgzIDEyNi40OTRDMTUzLjI4NiAxMjYuNDMgMTU0LjM5MSAxMjYuNDkxIDE1NS41MTEgMTI2LjU1NFpNMzcuMjg4NiAzNy44NDU0QzM2LjY3MTYgMzcuNTM4NiAzNi4wMDM4IDM3LjczMjEgMzUuMzMwMiAzNy45MjczQzM0LjU1MjcgMzguMTUyNSAzMy43Njc0IDM4LjM4MDEgMzMuMDQzNSAzNy44NDMzQzMyLjY1MjkgMzcuNTUzNSAzMi43ODQ1IDM2Ljk2NjcgMzIuOTA2IDM2LjQyNTZDMzMuMDA0NyAzNS45ODU0IDMzLjA5NjcgMzUuNTc1MyAzMi44OTU0IDM1LjM3OTdDMzAuODk3MyAzMy40Mzc4IDMwLjc3NjkgMzMuOTA5NyAzMC40NDEzIDM1LjIyNTJMMzAuNDQxMyAzNS4yMjUyQzMwLjI5MDUgMzUuODE2MSAzMC4wOTYzIDM2LjU3NzMgMjkuNjY4OSAzNy4zNjYzQzI4LjgwODggMzguOTU0MSAyNy43MDYyIDM5LjMxOTkgMjYuNjExIDM5LjY4MzNDMjUuMzA5MSA0MC4xMTUyIDI0LjAxNzYgNDAuNTQzNyAyMy4xNTYxIDQzLjAxNzFDMjEuMzE1OSA0OC4zMDA0IDE3Ljk2MzQgNDYuNjMyOSAxNi43NDk5IDQyLjAxNDNDMTYuNTYzMSA0MS4zMDMxIDE1Ljk5NDMgNDAuMjM4MSAxNS4zNTYyIDM5LjA0M0MxMy43NjQ2IDM2LjA2MjUgMTEuNzQxMSAzMi4yNzMgMTQuMTMwNSAzMS4xNDVDMTIuNDczOSAzMS45MjY5IDEwLjUxODkgMzIuMjczNyA4LjU2Mzc3IDMyLjYyMDVMOC41NjM3NCAzMi42MjA1QzYuMjkxMzQgMzMuMDIzNiA0LjAxODg4IDMzLjQyNjcgMi4yMTQ5NCAzNC41MTNDMC4zMDAyMzggMzUuNjY2IDAuMzA3NDg1IDM1LjkzMzUgMC4zNDMzODQgMzcuMjU5QzAuMzUwMjY1IDM3LjUxMyAwLjM1ODE5OCAzNy44MDU5IDAuMzUzODU1IDM4LjE1MTNDMC4zMzYzNTcgMzkuNTQ3NiAwLjM3ODc1IDQxLjIzMjkgMC40MTgyOTEgNDIuODA0OEMwLjQzMTQ0NiA0My4zMjc3IDAuNDQ0Mjg1IDQzLjgzODEgMC40NTQ0OTggNDQuMzIxMUMwLjQ4NjM3OCA0NS44MjgxIDEuMTIzMDQgNDcuMTAzIDEuNzc1OTcgNDguNDEwNEMyLjE2MjA3IDQ5LjE4MzYgMi41NTM4NiA0OS45NjgyIDIuODI5NjQgNTAuODE4OEMzLjQwODE2IDUyLjYwMzIgMy42NDU4OSA1NC40NzkyIDMuODgyOTUgNTYuMzQ5OEM0LjA0MDAyIDU3LjU4OTMgNC4xOTY4IDU4LjgyNjQgNC40NTIyMSA2MC4wMzNDNC41MDUyNyA2MC4yODM3IDQuNTYwMiA2MC41MzI5IDQuNjE0ODIgNjAuNzgwN0M1LjEzMjc3IDYzLjEzMDYgNS42MjQgNjUuMzU5MyA0LjI0OTQ5IDY3LjYyNjZDNC4wNjQ0NyA2Ny45MzE3IDMuNjAyMDggNjguMjg1OCAzLjEwNDYgNjguNjY2OEMyLjIyNzA3IDY5LjMzODggMS4yNDAzNCA3MC4wOTQ0IDEuNDc0MDIgNzAuODEyOEMxLjgxMzQyIDcxLjg1NjcgMy41MTEzNiA3MC4zMjE1IDQuMzg3NDggNjkuNTI5M0M0LjU3Njk4IDY5LjM1NzkgNC43MjgwMyA2OS4yMjE0IDQuODE4NTggNjkuMTUzMkM1LjYwNTY5IDY4LjU1OTggNS42NDg0NSA2Ny45NzYzIDUuNjgyNzcgNjcuNTA3OEM1LjcyNDI5IDY2Ljk0MTIgNS43NTM0OCA2Ni41NDI3IDcuMDcxOCA2Ni40OTgxQzguODgwOTkgNjYuNDM3MiAxMC43Mjc2IDY4LjQyNjkgMTEuODI0NSA2OS42MDg4TDExLjgyNSA2OS42MDk0QzExLjkzOTUgNjkuNzMyOCAxMi4wNDU4IDY5Ljg0NzMgMTIuMTQzIDY5Ljk0OThDMTIuNzQ2NSA3MC41ODU5IDEzLjMxMTggNzEuMzc4NSAxMy44OTkgNzIuMjAxN0MxNS40MjIzIDc0LjMzNzMgMTcuMDkyNyA3Ni42NzkzIDE5Ljk1ODUgNzcuMDMxMUMyOC44NDMxIDc4LjEyMjQgMzAuNjIzNiA2Ny44NzkxIDI3LjMxNSA2My4yMjYzQzI2LjYzNzkgNjIuMjc0MiAyNS42NzEgNjEuMzQyOSAyNC42ODU3IDYwLjM5NDFDMjMuMDIgNTguNzkgMjEuMzAyMSA1Ny4xMzU1IDIwLjg0MzYgNTUuMjQ0NEMyMC4wODQzIDUyLjExMTcgMjIuNzcyMiA0OS41NzQzIDI2LjQ2MDggNTEuMzczQzI4LjIxNTMgNTIuMjI4NSAyOC43ODA3IDUzLjcxOTYgMjkuMzUwNiA1NS4yMjI1QzI5LjgzNTcgNTYuNTAyIDMwLjMyNDEgNTcuNzkgMzEuNTUyMyA1OC43MDE3QzM0LjE1MzcgNjAuNjMzMSAzNC40IDYwLjA3ODIgMzQuODMyMSA1OS4xMDQ4QzM1LjA2MzMgNTguNTgzOCAzNS4zNDc4IDU3Ljk0MjggMzYuMDc1MyA1Ny40OTlDMzguMTg1MSA1Ni4yMTE5IDQxLjgyNzkgNTUuMTUyNSA0Mi4zMzE2IDU4LjM1OTVDNDIuNTA4NyA1OS40ODc1IDQxLjU3MjQgNjAuNDQ4IDQwLjYxOTIgNjEuNDI1OEMzOS40ODM5IDYyLjU5MDQgMzguMzI0NiA2My43Nzk3IDM4Ljk5NCA2NS4zMDU5QzQwLjI4NzkgNjguMjU1NSA0MS40NTgxIDY2LjY2MDEgNDIuNDU2OCA2NS4yOTg1QzQyLjY2OSA2NS4wMDkxIDQyLjg3MzUgNjQuNzMwMyA0My4wNjk4IDY0LjUwNzlDNDUuODU1NyA2MS4zNTE2IDQ4LjYzMyA1OC4wNTg4IDQ3LjgwMjcgNTMuOTE0N0M0Ny4yNzA3IDUxLjI1ODQgNDUuNDE2MyA0OS4zNjU0IDQzLjUyOTcgNDcuNDM5NkM0Mi42NzIyIDQ2LjU2NDIgNDEuODA4IDQ1LjY4MiA0MS4wNTg0IDQ0LjcxODNDNDAuNjEgNDQuMTQxOSA0MC4xODMzIDQzLjA3OTggMzkuNzMxMSA0MS45NTQyQzM5LjAzNDggNDAuMjIxIDM4LjI3ODEgMzguMzM3NSAzNy4yODg2IDM3Ljg0NTRaTTg2Ljk3NjUgMTA4LjQ4NUM4Ni45NTA2IDEwOS43MzcgODYuOTI0OCAxMTAuOTg2IDg3LjQ4OTEgMTEyLjIxM0M4OC43Njg2IDExNC45OTUgODkuNDcwNSAxMTYuNjYgODcuNzAzMyAxMTkuMjYxQzg3LjIyMzkgMTE5Ljk2NiA4Ni43MjQzIDEyMC40ODMgODYuMjQyMSAxMjAuOTgxQzg1LjQzNjYgMTIxLjgxMyA4NC42Nzk5IDEyMi41OTUgODQuMTQ4IDEyNC4xMjVDODMuOTg2MyAxMjQuNTkgODMuODcwOCAxMjUuMDIgODMuNzYzIDEyNS40MjJMODMuNzYzIDEyNS40MjJDODMuMzcyNSAxMjYuODc4IDgzLjA4MzYgMTI3Ljk1NCA4MS4wNjQ3IDEyOC45MjlDNzYuNDE4NyAxMzEuMTcyIDcyLjk0NjkgMTI5LjExNyA2OS44OTQzIDEyNi41NDdDNjkuNjUzMyAxMjYuMzQ0IDY5LjQyMzYgMTI2LjE1NCA2OS4yMDQgMTI1Ljk3MUM2Ny42NTc3IDEyNC42ODcgNjYuNjEyIDEyMy44MTkgNjUuNjY3NSAxMjIuMDY0QzY1LjM1ODIgMTIxLjQ5IDY1LjQwNjcgMTIwLjk4OCA2NS40NTEyIDEyMC41MjhDNjUuNTIyMSAxMTkuNzk0IDY1LjU4MyAxMTkuMTY1IDY0LjE3MjYgMTE4LjUwOUM2Mi44MDQzIDExNy44NzIgNjEuNDY1OSAxMTguMTE1IDYwLjEyMTQgMTE4LjM1OUM1OC40MzY4IDExOC42NjQgNTYuNzQyOCAxMTguOTcxIDU0Ljk2ODQgMTE3LjU1M0M1MC45NDg0IDExNC4zNDIgNTEuOTcxOCAxMDguMDY1IDU1LjY4NTggMTA1LjMzOUM1Ni43MzM4IDEwNC41NyA1Ny42OTQ2IDEwNC4xMTcgNTguNDkxNyAxMDMuNzRDNjAuMzM2MiAxMDIuODcgNjEuMzA0MyAxMDIuNDEzIDYwLjQ0OTYgOTkuNDE0MUM1OS42ODcyIDk4LjgwMDUgNTkuMTY3NCA5OC4wNjU2IDU4Ljg5MDIgOTcuMjA5NUM1OC44NTMgOTYuNDgyOCA1OS4wMTg5IDk1Ljc4ODcgNTkuMzg4MSA5NS4xMjc3QzU5LjI4ODIgOTQuNjc0IDU5LjQ0MDggOTQuMjI0NCA1OS41NzY3IDkzLjgyNEM1OS44NTY2IDkyLjk5OTIgNjAuMDY1NiA5Mi4zODM0IDU3Ljg1MDggOTIuMzcxN0M1OC40NjU0IDkxLjkxODcgNTguNjQwMSA5MC45MjQ5IDU4LjgyMjYgODkuODg2M0M1OS4wODkxIDg4LjM2OTYgNTkuMzcyNCA4Ni43NTczIDYxLjA2NzEgODYuNTk0OEM2My45ODg0IDg2LjMxNDQgNjQuMzE0NiA4OS4zMDQyIDY0LjU1OTQgOTEuNTQ4MkM2NC42Mzk1IDkyLjI4MjMgNjQuNzEwOSA5Mi45MzY2IDY0Ljg2MTUgOTMuMzcwNUM2Ni4wNDI2IDk2Ljc3MjUgNjcuNDI3MSA5Ny45NDIxIDcxLjIxMTkgOTYuNTkyNEM3Mi4xOTAzIDk2LjI0MzQgNzYuNzgxOCA5My43Nzk4IDc3LjEzNTUgOTMuMjQxNkM3NS40OTE1IDk1Ljc0MjggNzguODY0IDk4LjEwOTEgODEuMzg0MyA5OS44Nzc0QzgyLjAwNCAxMDAuMzEyIDgyLjU3MjMgMTAwLjcxMSA4My4wMDE3IDEwMS4wNjdDODMuMTc1MSAxMDEuMjEgODMuMzUwNSAxMDEuMzUyIDgzLjUyNiAxMDEuNDk1Qzg0LjU2NDQgMTAyLjMzNyA4NS42MDUzIDEwMy4xODEgODYuMjQzMSAxMDQuMjk4Qzg3LjAzNDUgMTA1LjY4MyA4Ny4wMDU1IDEwNy4wODYgODYuOTc2NSAxMDguNDg1Wk0xMjguNDIzIDEyNi45ODhDMTI2Ljk3OSAxMjYuODMyIDEyMS42OTIgMTI0Ljc4NSAxMjIuMzM1IDEyMy4wNzhDMTIzLjk2MyAxMTguNzUxIDEzMi40NTQgMTIzLjY0MSAxMzUuMzkgMTI1LjMzMkMxMzUuNTkzIDEyNS40NDkgMTM1Ljc2OSAxMjUuNTUxIDEzNS45MTUgMTI1LjYzM0MxMzQuODA0IDEyNS42OTIgMTMzLjcyNiAxMjYuMDA5IDEzMi42NTIgMTI2LjMyNkMxMzEuMjU5IDEyNi43MzcgMTI5Ljg3MiAxMjcuMTQ2IDEyOC40MjMgMTI2Ljk4OFoiIGZpbGw9ImJsYWNrIiBmaWxsLW9wYWNpdHk9IjAuNCIvPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNNDMuMjQ3IDIuNDExMkM0My40NTMyIDMuOTIxODcgNDYuNDExNyA2LjIxNjMgNDguMzIwOCA0Ljg1Mzc3QzQ5LjUzODcgNS4yOTQ5NSA0Ny43MzUyIDIuMDYyNjUgNDcuNDMzOSAxLjc2MjQ1QzQ1Ljg0NDggMC4xNzk5MzIgNDIuODQwNSAtMC41NjM0ODMgNDMuMjQ3IDIuNDExMlpNNzYuMjY3NCA0LjM1NTk5Qzc1LjUyOTcgNC4xODI0OSA3NC44Mjc3IDQuMDE3MzYgNzQuMjQxOCAzLjgxMDczQzczLjcwMzQgMy42MjA4NyA3My42NyAxLjU2ODA1IDczLjg5NDIgMS4xNTk0Qzc0LjMzMjEgMC4zNjA4MzMgNzUuODQ0MSAwLjQ1MDk1NiA3Ny4yMjMxIDAuNTMzMTUxQzc3LjYyODcgMC41NTczMjIgNzguMDIyNyAwLjU4MDgwNyA3OC4zNzQ1IDAuNTgwODA3TDkxLjY2NzQgMC41ODA4MDdDODkuODA4NCAxLjMyMDY1IDkxLjgxNjcgMi4wNzUxMyA5Mi43NzM4IDIuMjg1OTNDOTMuNTQ5OCAyLjA2Mzg5IDk5LjEzNjEgNi4xOTg5OSA5OC45ODExIDcuOTI5MzFDOTguODk2NyA4Ljg3MzI4IDk4LjIzMzggOS41NjA2MyA5Ny41NTQ4IDEwLjI2NDdDOTYuNzQwNyAxMS4xMDg4IDk1LjkwMzUgMTEuOTc2OSA5Ni4wMTI2IDEzLjM0MDFDOTYuMDc4NiAxNC4xNjQzIDk2Ljg4MDQgMTUuNTE3MyA5Ny43NzkzIDE3LjAzNDFDMTAwLjAyOSAyMC44MzAxIDEwMi44ODYgMjUuNjUyMSA5Ni4zNDAzIDI1Ljc3OTFDOTMuMjg4MyAyNS44MzgzIDkzLjM2NDggMjQuNDAzMyA5My40NTQzIDIyLjcyNDNDOTMuNTEzOSAyMS42MDY3IDkzLjU3OTIgMjAuMzgxMSA5Mi43MzEzIDE5LjQxNjFDOTIuMjQwNyAxOC44NTggOTEuNDUyNCAxOC41MDA3IDkwLjY2MDYgMTguMTQxOEM4OS42NDg5IDE3LjY4MzEgODguNjMxNCAxNy4yMjE5IDg4LjIyMTkgMTYuMzM1OUM4OC4wMjE4IDE1LjkwMjkgODguMTc1MiAxNC45Njc2IDg4LjM0MDQgMTMuOTYwOUM4OC43NTEyIDExLjQ1NjggODkuMjM0NiA4LjUxMDEzIDg0LjUzMDEgMTEuNzQ4NUM4NC4wNTI0IDEyLjA3NzUgODMuNzU3MSAxMi43MTg4IDgzLjQ2MTQgMTMuMzYxMkM4Mi44OTI2IDE0LjU5NjkgODIuMzIyMSAxNS44MzYyIDgwLjQ0NzMgMTQuODYwOEM3OC44MjM5IDE0LjAxNjIgNzkuNzIyIDEyLjM1MjkgODAuNjI0MSAxMC42ODIxQzgxLjMwODggOS40MTM5NSA4MS45OTU5IDguMTQxNDYgODEuNTg0NCA3LjIxOTQ0QzgwLjc4MDIgNS40MTc0OCA3OC4zNzgxIDQuODUyNDcgNzYuMjY3NCA0LjM1NTk5Wk0xNTYuNjk4IDkxLjgwNUMxNTMuOTQzIDkyLjUyNDUgMTUyLjM1NSA4OS45NjQyIDE1MS4wODEgODcuOTExQzE1MC4yMTMgODYuNTEzMiAxNDkuNDkyIDg1LjM1MDMgMTQ4LjY0NyA4NS42MTc0QzE0Ni40MTYgODMuNjkxOCAxNDQuMjYgODUuNDUyNCAxNDIuNDc1IDg2LjkwOThMMTQyLjQ3NSA4Ni45MDk4QzE0MS44IDg3LjQ2MDkgMTQxLjE3OCA4Ny45Njg2IDE0MC42MjYgODguMjE3M0MxNDAuNzQgODguMjg5MSAxMzUuNjQ4IDg3LjA5MTQgMTM2LjY4MyA4Ni44ODk4QzEyOS44NjIgODQuNTcxNiAxMjkuNzggODkuNzgxNyAxMjkuNzA5IDk0LjMyMjhDMTI5LjY3OSA5Ni4yODE4IDEyOS42NSA5OC4xMTYzIDEyOS4wODMgOTkuMTY4MUMxMjguMDYgMTAxLjA2NiAxMjYuNjI0IDEwMS43OTUgMTI0LjI2NyAxMDIuNjIzQzEyMy40NCAxMDIuOTE0IDEyMi41MyAxMDMuMDgxIDEyMS42MjMgMTAzLjI0N0MxMTkuNzIyIDEwMy41OTYgMTE3LjgzNSAxMDMuOTQyIDExNi43NjQgMTA1LjQxNUMxMTYuNTY2IDEwNS42ODggMTE2LjM3MiAxMDYuNTU0IDExNi4yMzYgMTA3LjE2QzExNi4xNTcgMTA3LjUxNCAxMTYuMDk4IDEwNy43NzkgMTE2LjA2OSAxMDcuNzg1QzExNi42NzUgMTA3LjkzOCAxMjAuOTQ2IDEwOS4yOTQgMTIxLjM4OCAxMDkuNjZDMTIxLjc5MyAxMDkuOTk0IDEyMS44OTggMTEwLjU4MyAxMjEuOTkzIDExMS4xMjJDMTIyLjA3NCAxMTEuNTc3IDEyMi4xNDggMTExLjk5NiAxMjIuMzkgMTEyLjIwMUMxMjMuMDg0IDExMi43ODcgMTIzLjc3MyAxMTMuMTkyIDEyNC40MzIgMTEzLjU4QzEyNS41NDggMTE0LjIzNiAxMjYuNTc2IDExNC44NDEgMTI3LjM5NCAxMTYuMTg2QzEyNy43NCAxMTYuNzU1IDEyNy45MTcgMTE3LjQxOCAxMjguMDkzIDExOC4wNzRDMTI4LjUyIDExOS42NjkgMTI4LjkzNiAxMjEuMjIzIDEzMS43MjkgMTIxLjI3OUMxMzQgMTIxLjMyNCAxMzUuMzQ1IDExOS41NTggMTM2LjA0NCAxMTguMDUyQzEzNi4zNTkgMTE3LjM3NCAxMzYuMjc1IDExNS40OSAxMzYuMTgxIDExMy4zNjlDMTM1Ljk1MSAxMDguMTk1IDEzNS42NTkgMTAxLjYxNCAxNDAuOTMyIDEwNy43MTFDMTQxLjQ0OSAxMDguMzA5IDE0MS42NDcgMTA4LjcxNCAxNDEuODEzIDEwOS4wNTRDMTQyLjA4NyAxMDkuNjE2IDE0Mi4yNzQgMTEwIDE0My42NzggMTEwLjc4NkMxNDQuMjYxIDExMS4xMTEgMTQ0Ljg0IDExMS4xMjYgMTQ1LjQwMSAxMTEuMTQxQzE0Ni4yMTIgMTExLjE2MiAxNDYuOTg0IDExMS4xODEgMTQ3LjY3MSAxMTIuMTQyQzE0OC4zODEgMTEzLjEzNCAxNDguMDI4IDExNC4wODUgMTQ3LjgxOCAxMTQuNjQ5QzE0Ny41ODIgMTE1LjI4NCAxNDcuNTI3IDExNS40MzEgMTQ5LjM3IDExNC42MDJDMTUzLjY1NyAxMTIuNjczIDE1My44MjUgMTA4LjM1OCAxNTMuOTY2IDEwNC43NDFWMTA0Ljc0MVYxMDQuNzQxQzE1My45OTQgMTA0LjAyMyAxNTQuMDIxIDEwMy4zMzMgMTU0LjA3OSAxMDIuNjk0QzE1NC4yODMgMTAwLjQ0NCAxNTQuNzggOTkuMTAxNyAxNTUuNzA3IDk3LjExMzdDMTU1Ljc2MiA5Ni45OTYyIDE1NS45MTcgOTYuNzQ2NCAxNTYuMTI0IDk2LjQxNTZDMTU3LjE1NCA5NC43NjI0IDE1OS40NDQgOTEuMDg3NSAxNTYuNjk4IDkxLjgwNVpNNzIuMTk3MyAxMjguNTUxQzcxLjQxNyAxMjcuNDU5IDcwLjQyMTYgMTI2LjczNiA2OS4zNzMzIDEyNS45NzRDNjguODkxOCAxMjUuNjI0IDY4LjM5OTIgMTI1LjI2NiA2Ny45MTExIDEyNC44NjFDNjcuNjMzOSAxMjQuNjMxIDY3LjMxNjMgMTI0LjQyOSA2Ni45OTc5IDEyNC4yMjZMNjYuOTk3NyAxMjQuMjI2QzY2LjM3MjYgMTIzLjgyOSA2NS43NDQxIDEyMy40MjkgNjUuNDExMSAxMjIuODA4QzY1LjE0MjcgMTIyLjMwOCA2NS4yMzkzIDEyMS42MzIgNjUuMzM1NiAxMjAuOTU3QzY1LjQ0NjMgMTIwLjE4MSA2NS41NTY2IDExOS40MDggNjUuMTExOSAxMTguOTA5QzYzLjg0NDggMTE3LjQ4NiA2Mi4xMjcgMTE3LjgyNyA2MC4zMjQxIDExOC4xODRDNTcuOTE2OSAxMTguNjYxIDU1LjM1OCAxMTkuMTY3IDUzLjUxNzkgMTE1LjU0OEM1Mi4yMDI2IDExMi45NjEgNTEuNTU4MiAxMDkuMjM0IDUzLjI3NTIgMTA2LjcxM0M1My45OTczIDEwNS42NTIgNTUuNTkxMSAxMDQuOTIgNTcuMTU2NyAxMDQuMkM1OS4xMDUxIDEwMy4zMDUgNjEuMDA5NyAxMDIuNDMgNjEuMTM1OSAxMDAuOTY3QzYxLjIwOSAxMDAuMTIgNjAuNTcwOCA5OS41MDk0IDU5LjkwNzkgOTguODc1NEM1OS4zMjcxIDk4LjMyIDU4LjcyNzMgOTcuNzQ2NCA1OC41NzA2IDk2Ljk3OTNDNTguNDM4NCA5Ni4zMzI2IDU4Ljc4NDEgOTUuNTU3OSA1OS4xMTI5IDk0LjgyMTJDNTkuNzUyNiA5My4zODc4IDYwLjMyODMgOTIuMDk3NyA1Ny4xOTU3IDkyLjE3MThDNTcuMjQ5MSA5Mi4xOTIgNTcuMjAyNyA5Mi4yMTE3IDU3LjE1NjUgOTIuMjMxM0M1Ny4xNDQ1IDkyLjIzNjMgNTcuMTMyNiA5Mi4yNDE0IDU3LjEyMjQgOTIuMjQ2NEM1Ny4wNzYxIDkyLjIyNzYgNTYuNzI0NCA5Mi4zNzQzIDU2LjMwNjEgOTIuNTQ4N0w1Ni4zMDYgOTIuNTQ4N0w1Ni4zMDU5IDkyLjU0ODdDNTUuNzU3NSA5Mi43Nzc0IDU1LjA5NDYgOTMuMDUzOCA1NC44NTQ5IDkzLjA2NzhDNTQuODQyMSA5My4wNjUxIDU0LjcxNDIgOTMuMTk0NCA1NC41MDM0IDkzLjQwNzZDNTMuNTQwNiA5NC4zODE1IDUwLjg0NzggOTcuMTA0OSA0OS40ODY1IDk2Ljk4MjRDNDYuODA3MSA5Ni43NDE1IDQ1Ljc1NjMgOTEuNTM1NCA0Ny4yMDQ2IDkxLjI2NzNDNDYuNTkwNCA5MS4xNjkyIDQ2LjEyNiA5MC44NDAzIDQ1LjY0NzEgOTAuNTAxQzQ0LjgwMTUgODkuOTAyIDQzLjkxMDYgODkuMjcwOCA0Mi4wNjkzIDg5LjgyMTZDNDAuNjI2NiA5MC4yNTI5IDQwLjI2OTggOTAuODY2MiAzOS43OTY4IDkxLjY3OTFDMzkuNjQyMSA5MS45NDUgMzkuNDc1IDkyLjIzMjIgMzkuMjUzNCA5Mi41NDEzQzM4LjU2MDggOTMuNTA3NyAzOC4xNzIyIDk0LjE1NTQgMzcuOTIyNyA5NC41NzEzQzM3LjY2NTQgOTUuMDAwMyAzNy41NTU5IDk1LjE4MjggMzcuNDEzMyA5NS4yMTQxQzM3LjMwNzYgOTUuMjM3MyAzNy4xODM4IDk1LjE3NzcgMzYuOTY4MiA5NS4wNzM5QzM2LjU2ODggOTQuODgxNiAzNS44NTQ2IDk0LjUzNzcgMzQuMzU4IDk0LjI4ODNMMzQuMzA0MSA5NC41OTI0QzM0LjA5ODEgOTUuNzUzIDM0LjAxNzQgOTYuMjA3NSAzNC4xNzI5IDk2LjU1NjhDMzQuMjczIDk2Ljc4MTYgMzQuNDcwOCA5Ni45NjI5IDM0Ljc5NiA5Ny4yNjA4QzM1LjA1MzkgOTcuNDk3MSAzNS4zOTE5IDk3LjgwNjcgMzUuODI0NiA5OC4yNjk1QzM2LjM3MjMgOTguODU1MyAzNy4wMDQgOTkuMzk0NSAzNy42MzQ1IDk5LjkzMjdDMzguMDg0OSAxMDAuMzE3IDM4LjUzNDcgMTAwLjcwMSAzOC45NTI4IDEwMS4xMDFDMzkuNDc1MyAxMDEuNjAxIDQ0LjMwNDEgMTA2LjU5MSA0My4zMDA2IDEwNi44MzJDNDQuMjY4NSAxMDcuMDExIDQ0LjM2NjcgMTA5LjMxMyA0NC40NjA5IDExMS41MjFDNDQuNTI2OSAxMTMuMDY5IDQ0LjU5MSAxMTQuNTcxIDQ0Ljk1MTYgMTE1LjI2M0M0NS4zMTA1IDExNS45NTIgNDUuODg3NyAxMTYuNTQ1IDQ2LjQ2NCAxMTcuMTM3QzQ2LjkyODEgMTE3LjYxNCA0Ny4zOTE2IDExOC4wOSA0Ny43Mzk4IDExOC42MTZDNDguNjgxOSAxMjAuMDM3IDQ4LjgyNzIgMTIxLjcwMSA0OC45NzQ0IDEyMy4zODhDNDkuMTE1NiAxMjUuMDA1IDQ5LjI1ODcgMTI2LjY0MyA1MC4xMDc2IDEyOC4xMDhDNTAuMzI5NiAxMjguNDkxIDUwLjY5MjggMTI4LjgwOCA1MS4wNTI0IDEyOS4xMjJDNTEuMzk3NiAxMjkuNDIzIDUxLjczOTQgMTI5LjcyMSA1MS45NDk1IDEzMC4wNzJDNTIuMDg4NyAxMzAuMzA1IDUyLjMzOTcgMTMwLjUyMyA1Mi41Nzk5IDEzMC43MzNMNTIuNTggMTMwLjczM0M1Mi43MjE0IDEzMC44NTYgNTIuODU5MSAxMzAuOTc2IDUyLjk2NzggMTMxLjA5M0M1My43MDc2IDEzMS44OTIgNTMuNzk0NiAxMzIuMzExIDUzLjg0NzYgMTMyLjU2NkM1My44NjQ4IDEzMi42NDkgNTMuODc4NCAxMzIuNzE0IDUzLjkwOTUgMTMyLjc3QzU0LjAyODIgMTMyLjk4MiA1NC40MDExIDEzMy4wNTIgNTYuMTk1IDEzMy4zOUw1Ni4yMTk5IDEzMy4zOTRDNTkuNDk1OSAxMzQuMDEgNjguODQxOCAxMzMuNzE3IDcxLjQxNDIgMTMxLjYyMUM3MS43ODMgMTMxLjMyMSA3Mi4xNjMzIDEzMC41MDYgNzIuNDQ5NyAxMjkuODkzQzcyLjY0MSAxMjkuNDgzIDcyLjc5MDQgMTI5LjE2NCA3Mi44NjY2IDEyOS4xNDZDNzIuNDg5IDEyOC45NjYgNzIuMzYxMSAxMjguNzg0IDcyLjIzMzEgMTI4LjYwMUM3Mi4yMjEyIDEyOC41ODUgNzIuMjA5NCAxMjguNTY4IDcyLjE5NzMgMTI4LjU1MVpNMTAzLjE3OSAxMjYuNDUxQzEwMi4yODkgMTI2LjM1MyAxMDEuNjM0IDEyNi4wNjYgMTAwLjk5MyAxMjUuNzg2QzEwMC4xMDkgMTI1LjM5OSA5OS4yNTI2IDEyNS4wMjQgOTcuODQ0NiAxMjUuMTdDOTYuNjQyOSAxMjUuMjk0IDk1LjcyNDcgMTI1Ljg2MSA5NC44MDQgMTI2LjQyOUM5NC4yNjcgMTI2Ljc2IDkzLjcyOTIgMTI3LjA5MiA5My4xMzM4IDEyNy4zMzdDOTEuNjgzIDEyNy45MzQgODkuMTcyNiAxMjguMTkyIDg2LjQzNTMgMTI4LjQ3M0M4MC45MzI4IDEyOS4wMzggNzQuNTEzOSAxMjkuNjk2IDczLjk0MzYgMTMzLjM5NEM3NC44NzM0IDEzMy4zOTQgNzYuMjkxNyAxMzMuNDgyIDc3LjkzNjIgMTMzLjU4M0M4My4wMTM1IDEzMy44OTYgOTAuMjQ4MSAxMzQuMzQzIDkxLjkyODYgMTMyLjc1OUM5Mi43ODg3IDEzMS45NDggOTIuNjcwOCAxMzEuMjY3IDkyLjU3MTIgMTMwLjY5M0M5Mi40MjgyIDEyOS44NjggOTIuMzIzMSAxMjkuMjYyIDk1LjIwNDQgMTI4LjgwMkM5Ni4xNDUxIDEyOC42NTIgOTYuODMzNyAxMjguODkyIDk3LjUxOTUgMTI5LjEzMkM5OC41NjkyIDEyOS40OTggOTkuNjEyNCAxMjkuODYyIDEwMS41NDMgMTI4LjgyQzEwMS44MTQgMTI4LjY3NCAxMDUuMzAyIDEyNi42ODUgMTAzLjE3OSAxMjYuNDUxWk0xMDEuNCAxMDYuMTQ3QzEwNi4zNDUgMTAxLjAxOSAxMDcuNjggMTA4LjM2NyAxMDcuNjggMTExLjQxMkMxMDcuNjc5IDExNC44ODkgMTAxLjY3NCAxMTcuNDU4IDk5LjgxMjggMTEzLjcxNkM5OS4xOTQ4IDExMi40NzQgMTAwLjE4MiAxMDcuNDEgMTAxLjQgMTA2LjE0N1pNMTU2Ljk5OSA3LjczNzMyQzE1Ni4zMzcgNy4yNjc1MyAxNTUuNzEzIDYuMzI0NTUgMTU1LjA1OCA1LjMzNjYzQzE1NC4wNTEgMy44MTU5MiAxNTIuOTczIDIuMTg4NzQgMTUxLjU4MiAyLjAxNjk4QzE0Ny44MTggMS41NTI2NSAxNDguMjU2IDUuOTkyNCAxNDguNjEyIDkuNjA1OTdDMTQ4Ljc5OSAxMS40OTQzIDE0OC45NjMgMTMuMTU3IDE0OC40OTMgMTMuNzc2NEMxNDguNTQ2IDEzLjc3OTggMTQ4Ljc3MyAxMy45MjA2IDE0OS4xMDEgMTQuMTI0MkMxNTAuNjg1IDE1LjEwNjUgMTU0LjYyNSAxNy41NDk2IDE1Mi42NDYgMTMuMDY0M0MxNTIuNDcgMTIuNjY0MyAxNTEuNzcyIDEyLjMzODQgMTUxLjA3NiAxMi4wMTMxQzE0OS43ODggMTEuNDExNiAxNDguNTA2IDEwLjgxMjIgMTUwLjUzIDkuNzUwNjRDMTUxLjgxOSA5LjA3NTEgMTUzLjI1MSA5Ljc1MTkgMTU0LjYzNiAxMC40MDY1QzE1NS42MTQgMTAuODY4NCAxNTYuNTY4IDExLjMxOTMgMTU3LjQzMiAxMS4yNzYxQzE1Ny40MzIgMTEuMDY0NCAxNTcuNDQ4IDEwLjgwNTQgMTU3LjQ2NiAxMC41MjM3QzE1Ny41MyA5LjQ5ODkyIDE1Ny42MTQgOC4xNzQyMSAxNTYuOTk5IDcuNzM3MzJaTTE1NS43NyA1MC45MTM2QzE1Ni4xNjQgNTAuMzc3MSAxNTYuNTM0IDQ5Ljg3NDQgMTU2Ljg0NyA0OS42ODgyQzE1Ny4wMzcgNDkuNTc0OCAxNTcuNjggNjYuMzYwNSAxNTYuOTk4IDY2LjE1MTRDMTUzLjY5OCA2OC4xMTY5IDE1NC4xMTIgNjMuNzUwOCAxNTQuMzY5IDYxLjA0NTlDMTU0LjQ2MSA2MC4wNzM3IDE1NC41MzMgNTkuMzE2IDE1NC40MDUgNTkuMTQ0MUMxNTMuOTI4IDU4LjUwNTYgMTUyLjk0MiA1OC4yNzA5IDE1MS45NTMgNTguMDM1NkMxNTAuNTg4IDU3LjcxMDYgMTQ5LjIxNyA1Ny4zODQzIDE0OS4xNzYgNTUuOTkwM0MxNDkuMTYgNTUuNDAxMiAxNTEuMjc4IDUzLjc2ODMgMTUxLjgxMyA1My40MTI0QzE1Mi4wMDcgNTMuMjgzNiAxNTIuMDIgNTMuMDYyMSAxNTIuMDM0IDUyLjgzMzVDMTUyLjA0OSA1Mi41ODk4IDE1Mi4wNjQgNTIuMzM4MSAxNTIuMjk4IDUyLjE4MkMxNTIuNDQgNTIuMDg3NSAxNTIuNzg1IDUyLjE4MSAxNTMuMTcxIDUyLjI4NTZDMTUzLjY3IDUyLjQyMDkgMTU0LjIzNyA1Mi41NzQ2IDE1NC41MTkgNTIuMzYyM0MxNTQuOTM5IDUyLjA0NDggMTU1LjM2OCA1MS40NjE2IDE1NS43NyA1MC45MTM2Wk0xMTkuMzYyIDYzLjk5MTVDMTE4Ljg2MiA2My4xNDE4IDExOC4zNTYgNjIuMjgwMSAxMTcuMjE1IDYxLjc3NUMxMTQuMTg0IDYwLjQzMjcgMTE0LjEyNCA1OS44MDY4IDExNC4wMjIgNTguNzQ3MUMxMTMuOTYyIDU4LjEyMjMgMTEzLjg4OCA1Ny4zNDY3IDExMy4xODIgNTYuMTg0NkMxMTEuNDY0IDUzLjM1ODQgMTA3LjEyNSA1My41NTQxIDEwMy42ODQgNTMuNzA5M0MxMDIuOTg0IDUzLjc0MDkgMTAyLjMyMiA1My43NzA4IDEwMS43MjYgNTMuNzczMkMxMDAuOTYzIDUzLjc3NjIgMTAwLjQxMiA1My43NDE0IDk5Ljk4MiA1My43MTQzQzk4LjYyMTMgNTMuNjI4NCA5OC40Nzg0IDUzLjYxOTQgOTYuNzE1MiA1NS4xMzIxQzk1Ljk5NjYgNTUuNzQ4NyA5NS4yOTEzIDU2LjQ3MzMgOTQuNTY4MyA1Ny4yMTZMOTQuNTY4MiA1Ny4yMTYxQzkzLjc1NTEgNTguMDUxNSA5Mi45MTk2IDU4LjkwOTkgOTIuMDE3OSA1OS42NjMxQzkwLjA4NDYgNjEuMjc4IDg1LjYwMTUgNjUuMzY3NCA4OC44NzY5IDY3LjYyNjFDODcuMjc1NCA2Ny45ODI4IDg3Ljc3MyA3MC42OTU3IDg4Ljg5NCA3MS4yOTcxQzg4Ljc1OTEgNzEuMzQ4OCA4Ny4zNzY1IDc0LjU4ODYgODcuNDQ4MSA3NC43NjU0Qzg2LjcyMzggNzQuNzIyMyA4Ni4wMzM1IDc0LjU0NCA4NS4zNjk2IDc0LjM3MjVDODMuODg4MSA3My45ODk3IDgyLjUzOCA3My42NDEgODEuMjM1MyA3NC45MDUzQzgwLjExNTUgNzUuOTkxOCA4MC40OCA3Ny41Njg1IDgwLjg0NTEgNzkuMTQ4QzgxLjE1MjQgODAuNDc3IDgxLjQ2IDgxLjgwOCA4MC44ODQ0IDgyLjg1MDVDNzkuMjY2OCA4NS43ODAyIDczLjk3MTkgODYuMDYwOCA3MS4xOTQyIDg0LjMwNjVDNjkuMjkxOSA4My4xMDQ4IDY0Ljk0NDQgNzkuMjIzIDYzLjczNDEgNzcuNDMyMkM2MS42NjY5IDc0LjM3MzYgNjIuNDg2MyA3MS42MzYxIDY2LjgxMTIgNzEuNzQ2N0M2Ny44NTU2IDcxLjc3MzUgNjguNjA4NyA3Mi4yMTc3IDY5LjE1NzMgNzIuNTQxMkM2OS45NzkgNzMuMDI1OSA3MC4zNDE4IDczLjIzOTggNzAuNTM3IDcxLjM3NDVDNzAuNjIyOSA3MC41NTM4IDY5Ljc0MzIgNjkuNTAxOCA2OS4wMjc0IDY4LjY0NTZDNjguNzU5OSA2OC4zMjU3IDY4LjUxNTMgNjguMDMzMiA2OC4zNTI1IDY3Ljc5MDNDNjguMjM3NyA2Ny42MTkxIDY4LjEyNjUgNjcuNDU0MyA2OC4wMTkgNjcuMjk0OUw2OC4wMTcyIDY3LjI5MjJDNjYuMTcwNCA2NC41NTQ3IDY1LjQyMTcgNjMuNDQ0OSA2Ni44MTQyIDYwLjEwMjRDNjYuODg0IDU5LjkzNSA2Ni45NTEyIDU5Ljc3NTEgNjcuMDE1NiA1OS42MjE2TDY3LjAxNTkgNTkuNjIxQzY4LjAxNSA1Ny4yNDI2IDY4LjM2MDIgNTYuNDIwOSA2Ny40MTIxIDUzLjcwMDVDNjYuMzIxMyA1MC41NzAyIDY2LjAxODUgNDkuMjQ5OSA2Ni4yNzcgNDUuOTQxNEM2Ni4yODg3IDQ1Ljc5MiA2Ni4zMDk5IDQ1LjYxNzggNjYuMzMzMiA0NS40MjY0VjQ1LjQyNjNDNjYuNTAxMSA0NC4wNDkyIDY2Ljc3NzggNDEuNzgwMSA2NC4zODU2IDQxLjQzNTdDNjQuNzUxOCA0MC44OTk2IDY2LjEyMDggMzYuOTg5NiA2NS43ODg4IDM2LjYyMTJDNjcuODI4NCAzNi44NjAzIDY4LjE1NDIgMzYuNDg2OCA2OC43NTgxIDM1Ljc5NDdDNjkuMTQxIDM1LjM1NTggNjkuNjM1NiAzNC43ODg5IDcwLjc0OTcgMzQuMTY4N0M3MS41MjI0IDMzLjczODYgNzIuNTAzOSAzMy42MzMyIDczLjQ5NjQgMzMuNTI2NkM3NC44ODMxIDMzLjM3NzcgNzYuMjkxNCAzMy4yMjY1IDc3LjE4MTggMzIuMTg0Qzc3Ljk5MzYgMzEuMjMzOSA3OC4wMjY1IDI5LjY5MzMgNzguMDU4OCAyOC4xNzk1Qzc4LjA4MjYgMjcuMDY1MSA3OC4xMDYgMjUuOTY1MyA3OC40Mzk4IDI1LjEyNjNDNzkuMDUzMSAyMy41ODQgNzkuODcyIDIxLjY2ODkgODEuOTQ2MyAyMC45NzY5Qzg2Ljk0NTggMTkuMzA5NCA4Ni41NDk2IDIzLjU5NjkgODYuMjcxMyAyNi42MDc5TDg2LjI3MTMgMjYuNjA4Qzg2LjIyMzYgMjcuMTIzOCA4Ni4xNzk0IDI3LjYwMiA4Ni4xNjY0IDI4LjAwNjVDODYuMDAxNiAzMy4xMjM2IDg1LjkyMTkgMzguNTYzNiA4Ni45MjQzIDQzLjUwMjRDODcuOTQxNyA0OC41MTYxIDg4Ljc5MTggNDYuNTk2MyA4OS45NDI4IDQzLjk5NzNDOTAuMTYzNiA0My40OTg2IDkwLjM5NTUgNDIuOTc0OSA5MC42NDE4IDQyLjQ3MDRDOTEuMDc2MyA0MS41ODA0IDkxLjc5MzMgNDAuOTI4MyA5Mi41MDY3IDQwLjI3OTVDOTMuMTcyMiAzOS42NzQyIDkzLjgzNDcgMzkuMDcxNyA5NC4yNjIyIDM4LjI4MTNDOTQuNTgzOCAzNy42ODY2IDk0LjU1NSAzNy4wNjkyIDk0LjUyNzIgMzYuNDcxNUM5NC40ODg2IDM1LjY0NDcgOTQuNDUxOCAzNC44NTU3IDk1LjM0NzQgMzQuMjE3NEM5Ni4wMTk1IDMzLjczODQgOTYuODE3MSAzMy45MDAxIDk3LjU0NTMgMzQuMDQ3N0M5OC4xNDcyIDM0LjE2OTcgOTguNzAxNyAzNC4yODIxIDk5LjA5ODQgMzQuMDE1Qzk5Ljg2OTYgMzMuNDk1OSA5OS45ODM5IDMyLjA0NzQgMTAwLjEwMiAzMC41NTI5QzEwMC4yNyAyOC40MTk2IDEwMC40NDYgMjYuMTkyNSAxMDIuNTUgMjYuNDQxQzEwNC42MTEgMjYuNjg0NSAxMDQuODAyIDI4Ljc3NjYgMTA0Ljk2MSAzMC41MzU5QzEwNS4wNzQgMzEuNzc5NiAxMDUuMTcyIDMyLjg1NyAxMDUuOTA2IDMyLjk5NzJDMTA1LjUxNCAzMy4xMDIxIDEwNS4wNDEgMzMuMjExNyAxMDQuNTM1IDMzLjMyOUMxMDEuMzE3IDM0LjA3NDkgOTYuNzU2NiAzNS4xMzIzIDEwMy4wNTUgMzcuMjQ3MUMxMDEuMTIxIDM3LjQzIDEwMS42ODMgMzkuNzMxMyAxMDEuOTQxIDQwLjc5QzEwMS45NiA0MC44Njc0IDEwMS45NzcgNDAuOTM4MyAxMDEuOTkyIDQxLjAwMTFDMTAyLjA2MiA0MS4zMDQ4IDEwMi40MjUgNDEuNTU2MSAxMDIuNzkxIDQxLjgwOUMxMDMuMTcyIDQyLjA3MjkgMTAzLjU1NiA0Mi4zMzg2IDEwMy42MTQgNDIuNjY3OEMxMDMuNzQxIDQzLjQwMDEgMTAzLjU0IDQzLjc2NTMgMTAzLjM0MSA0NC4xMjcyQzEwMy4xOTYgNDQuMzkxNSAxMDMuMDUxIDQ0LjY1NDEgMTAzLjAzNiA0NS4wNTY3QzEwMy4wMTcgNDUuNTkzMiAxMDIuOTYzIDQ2LjA5OTIgMTAyLjkxNSA0Ni41NTQ5QzEwMi43MDQgNDguNTYzNCAxMDIuNTk1IDQ5LjU5NzMgMTA1LjkwMSA0Ny45NzUyQzEwNi44MzMgNDcuNTE3NyAxMDcuMDQ4IDQ2Ljg4OTQgMTA3LjIxNyA0Ni4zOTY3QzEwNy40NTIgNDUuNzEwMyAxMDcuNTk3IDQ1LjI4NzIgMTA5LjQ2NiA0NS45NTY5QzEwOS41MzcgNDYuMTQ5NyAxMDkuNzA1IDQ2LjI2NTUgMTA5Ljk2OSA0Ni4zMDQxQzExMC4yNDggNDYuMjIzMyAxMTAuNyA0Ni41Mjg0IDExMS4yMzQgNDYuODg4N0MxMTIuMDQ3IDQ3LjQzNjYgMTEzLjA0OCA0OC4xMTIyIDExMy45MTYgNDcuNzUyNkMxMTUuNjQ0IDQ3LjAzNzUgMTE0Ljk5NCA0NS44MjI2IDExNC40MDUgNDQuNzIyN0MxMTQuMTg3IDQ0LjMxNDIgMTEzLjk3NyA0My45MjE1IDExMy45IDQzLjU3NjJDMTEzLjMyMSA0MC45NjY0IDExMy42OTMgNDAuNzkyNSAxMTQuNTMxIDQwLjQwMDdDMTE1LjEyOSA0MC4xMjEgMTE1Ljk2NSAzOS43MzAxIDExNi44NjEgMzguMjYxOEMxMTcuNjAxIDM3LjA1MDIgMTE3LjEyNCAzNS44NDExIDExNi42NzYgMzQuNzA4NEMxMTYuMDg0IDMzLjIxMDkgMTE1LjU0NSAzMS44NDcgMTE3Ljk0MiAzMC43ODc2QzEyNC4wNSAyOC4wODg0IDEyNS4wMDQgMzQuMzYxOCAxMjQuMjM2IDM3LjM0NzlMMTI0LjE0NiAzNy42OTU5QzEyMy4zMDkgNDAuOTM2OCAxMjIuNjg1IDQzLjM1MjYgMTI0LjI2NyA0Ni42OTQ3QzEyNS4zNTEgNDguOTg2NCAxMjcuMTMgNTAuMzQwNSAxMjkuMDM4IDUxLjc5MjFMMTI5LjAzOCA1MS43OTIyQzEyOS45OTggNTIuNTIzIDEzMC45OTEgNTMuMjc4NSAxMzEuOTQ0IDU0LjE5MDdDMTM1LjUyNiA1Ny42MTk1IDEzNS44MTYgNjEuNzA2MSAxMzEuNzI3IDY0Ljk5MjdDMTI4LjQ1MyA2Ny42MjM5IDEyNC4wNTQgNjguNDA0MyAxMjAuNjM0IDY1LjY0NjdDMTIwLjA2NSA2NS4xODgxIDExOS43MTUgNjQuNTkyOCAxMTkuMzYyIDYzLjk5MTVaTTExMy4xMjIgOTQuODQzNkMxMDguMzk4IDk0LjIxNzUgMTA2Ljc2NyA5NC4wOTcxIDEwMy4xOTkgOTQuOTc1OUMxMDMuNDI4IDk1LjIwNTQgMTAzLjQ0IDk1LjM3MzMgMTAzLjIzNyA5NS40Nzk3QzEwMy44MzggOTUuNzEwNSAxMDQuNzU1IDk1Ljg2NjkgMTA1LjczNiA5Ni4wMzQzQzEwNy40ODcgOTYuMzMzMSAxMDkuNDQzIDk2LjY2NjcgMTEwLjE3IDk3LjUyMDNDMTEwLjM1IDk3LjczMSAxMTAuMjAxIDk4LjU1OTUgMTEwLjA2NSA5OS4zMTJMMTEwLjA2NSA5OS4zMTJMMTEwLjA2NSA5OS4zMTIzQzEwOS45NDcgOTkuOTcxNCAxMDkuODM5IDEwMC41NzIgMTA5Ljk3MiAxMDAuNjQ4QzEwOS44NjQgMTAwLjU4NiAxMTQuMTgzIDk1LjM4ODggMTE0Ljg0OSA5NC44OTJDMTE0LjI3MSA5NC45MTI2IDExMy42OTYgOTQuODk2NiAxMTMuMTIyIDk0Ljg0MzZaTTMxLjIzMTcgMTA4LjI3N0wzMS4yMzIxIDEwOC4yNzdDMzEuNDIzMiAxMDguMzg0IDMxLjU1ODIgMTA4LjQ2IDMxLjU4NzIgMTA4LjQ3MUMzMi4wOTA4IDEwOC42NTggMzIuNjIyOCAxMDguNzQgMzMuMTgyOCAxMDguNzE3QzMyLjkyNSAxMTAuMTIxIDMwLjg3MDcgMTEyLjcyMyAyOC42MzE3IDExMi4yOTRDMjUuOTY4MSAxMTEuNzgzIDI2Ljk4ODcgMTEwLjYxIDI4LjA3MDUgMTA5LjM2OEMyOC42NTc5IDEwOC42OTMgMjkuMjYzMyAxMDcuOTk4IDI5LjMwNjkgMTA3LjM3NkMyOS4zMTg4IDEwNy4yMDggMzAuNTkwMSAxMDcuOTE4IDMxLjIzMTUgMTA4LjI3N0wzMS4yMzE2IDEwOC4yNzdMMzEuMjMxNyAxMDguMjc3Wk0zMC4xMTg3IDEwMS42MzJDMzAuNTE1OCAxMDIuMTg2IDMxLjIwNDMgMTAyLjYxNiAzMS44NjQ3IDEwMy4wMjlDMzIuMTU5NiAxMDMuMjEzIDMyLjQ0ODkgMTAzLjM5NCAzMi43MDQxIDEwMy41OEMzMy4wNjk4IDEwMy4wNDEgMzIuNzEzMyAxMDEuOTc1IDMyLjM2MjIgMTAwLjkyNUMzMi4wNjk3IDEwMC4wNSAzMS43ODA5IDk5LjE4NjIgMzEuOTE2MyA5OC42NDY4QzMwLjIwOTggOTguNTkxNSAyOS4zNzIxIDEwMC41OTEgMzAuMTE4NyAxMDEuNjMyWk02MS4xNTIyIDAuNjkyMzJDNTkuNTIyNCAxLjYxMTUgNTMuODA2NCA0LjgzNTMgNTMuNDg5MSAxLjQ5Njk4QzUzLjQ2MzIgMS4xOTE4NSA1My40NDA2IDAuODg2MzggNTMuNDIxNSAwLjU4MDkwOUw2MS4zNTAzIDAuNTgwOTA5QzYxLjI5MzYgMC42MTI1ODcgNjEuMjI3MiAwLjY1MDAxMyA2MS4xNTIyIDAuNjkyMzJaIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjIiLz48L2c+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUyLCAxMjQpIj48cmVjdCB4PSIyNCIgeT0iNiIgd2lkdGg9IjI3IiBoZWlnaHQ9IjgiIHJ4PSI0IiBmaWxsPSJibGFjayIgZmlsbC1vcGFjaXR5PSIwLjgiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzgsIDc2KSI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNSAyNy4yTDMwLjUgMzIuN0MzMSAzMy4xIDMxLjcgMzMuMSAzMi4xIDMyLjdMMzMuNyAzMS4xQzM0LjEgMzAuNiAzNC4xIDI5LjkgMzMuNyAyOS41TDI4LjIgMjRMMzMuNyAxOC41QzM0LjEgMTggMzQuMSAxNy4zIDMzLjcgMTYuOUwzMi4xIDE1LjNDMzEuNiAxNC45IDMwLjkgMTQuOSAzMC41IDE1LjNMMjUgMjAuOEwxOS41IDE1LjNDMTkgMTQuOSAxOC4zIDE0LjkgMTcuOSAxNS4zTDE2LjMgMTYuOUMxNS45IDE3LjMgMTUuOSAxOCAxNi4zIDE4LjVMMjEuOCAyNEwxNi4zIDI5LjVDMTUuOSAzMCAxNS45IDMwLjcgMTYuMyAzMS4xTDE3LjkgMzIuN0MxOC40IDMzLjEgMTkuMSAzMy4xIDE5LjUgMzIuN0wyNSAyNy4yWiIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC44Ii8+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03OSAyNy4yTDg0LjUgMzIuN0M4NSAzMy4xIDg1LjcgMzMuMSA4Ni4xIDMyLjdMODcuNyAzMS4xQzg4LjEgMzAuNiA4OC4xIDI5LjkgODcuNyAyOS41TDgyLjIgMjRMODcuNyAxOC41Qzg4LjEgMTggODguMSAxNy4zIDg3LjcgMTYuOUw4Ni4xIDE1LjNDODUuNiAxNC45IDg0LjkgMTQuOSA4NC41IDE1LjNMNzkgMjAuOEw3My41IDE1LjNDNzMgMTQuOSA3Mi4zIDE0LjkgNzEuOSAxNS4zTDcwLjMgMTYuOUM2OS45IDE3LjMgNjkuOSAxOCA3MC4zIDE4LjVMNzUuOCAyNEw3MC4zIDI5LjVDNjkuOSAzMCA2OS45IDMwLjcgNzAuMyAzMS4xTDcxLjkgMzIuN0M3Mi40IDMzLjEgNzMuMSAzMy4xIDczLjUgMzIuN0w3OSAyNy4yWiIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC44Ii8+PC9nPjwvZz48L3N2Zz4=`,
                // icons: {
                //     icon: {name: 'developer', path},
                // },
            },
            {
                list_name: 'account4',
                // text: 'account1',
                cover: `${path}/ai.svg`,
                // icons: {
                //     icon: {name: 'ai', path},
                // },
            },
            {
                list_name: 'account5',
                // text: 'account2',
                cover: `${path}/flower.svg`,
                // icons: {
                //     icon: {name: 'flower', path},
                // },
            },
            {
                list_name: 'account6',
                // text: 'account3',
                cover: `${path}/marine.svg`,
                // icons: {
                //     icon: {name: 'marine', path},
                // },
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
                        style: `
                            :host(i-button) .avatar {
                                max-width: 30px;
                            }
                        `,
                        props: {
                            border_width: '0',
                            border_radius: '0',
                            option_avatar_width: '30px'
                        },
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
        grid-template-columns: repeat(auto-fill, minmax(0, auto));
        grid-auto-flow: column;
        background-color: hsla(var(--bg-color), var(--opacity));
        border-top: var(--border-width) var(--border-style) hsl(var(--color-black));
    }
    :host(.sub-action[aria-hidden="true"]) {
        display: none;
    }
    :host(.sub-action[aria-hidden="false"]) {
    }
    .accounts {
        width: 100%;
        overflow: scroll hidden;
    }
    .accounts > i-list {
        height: 100%;
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
                current_icon_size: '20px',
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
                current_icon_size: '20px',
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
                const checked = ('checked' in obj) ?  obj.checked : void 0
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
            const {name, checked} = data
            const make = message_maker(`${name} / ${flow} / ${page}`)
            // for sort-up and sort-down
            if (from.match(/sort/))  {
                if (checked) return
                const filter_results = Object.keys(recipients).filter( key => key.match(/sort/) )
                filter_results.forEach( result => {
                    if (result === from) return recipients[from]( make({type: 'switched', data: {checked: !checked}}) )
                    recipients[result]( make({type: 'switched', data: {checked}}) )
                })
                return
            }
            // for plan-play and plan-pasue
            if (from.match(/plan-/)) {
                if (checked) return
                const filter_results = Object.keys(recipients).filter( key => key.match(/plan-play|plan-pause/) )
                filter_results.forEach( result => {
                    if (result === from) return recipients[from]( make({type: 'switched', data: {checked: !checked}}) )
                    recipients[result]( make({type: 'switched', data: {checked}}) )
                })
                return
            }
            // toggle planlist or performance or linechart to show/hide
            if (from.match(/planlist|performance|linechart/)) {
                const message = {to, type: 'panel-hide', data: {name, hide: checked}}
                send(make(message))
                recipients[from]( make({type: 'switched', data: {checked: !checked}}) )
                return
            }
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
            send(make(msg))
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
