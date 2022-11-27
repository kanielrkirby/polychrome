import { v4 as uuidv4 } from 'uuid'

const siteTitle = document.title

function deconstructHex(hex: string) {
	let r = parseInt(hex[0] + hex[1], 16) / 255,
		g = parseInt(hex[2] + hex[3], 16) / 255,
		b = parseInt(hex[4] + hex[5], 16) / 255,
		max = Math.max(r, g, b),
		min = Math.min(r, g, b),
		h,
		s,
		lum = r * 0.299 + g * 0.587 + b * 0.114,
		l = (max + min) / 2

	if (max == min) h = s = 0
	else {
		let d = max - min
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0)
				break
			case g:
				h = (b - r) / d + 2
				break
			default:
				h = (r - g) / d + 4
				break
		}
		h = h * 60
	}
	return { r, g, b, h, s, l, lum }
}

function hslToHex(h: number, s: number, l: number) {
	if (h > 360) h -= 360
	else if (h < 0) h += 360
	if (s > 1) s = 1
	else if (s < 0) s = 0
	if (l > 1) l = 1
	else if (l < 0) l = 0
	s *= 100
	const a = (s * Math.min(l, 1 - l)) / 100
	const f: any = (n: any) => {
		const k = (n + h / 30) % 12
		const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
		return Math.round(255 * color)
			.toString(16)
			.padStart(2, '0')
	}
	return `${f(0)}${f(8)}${f(4)}`
}

const local = {
	get info(): any {
		let storageItem = localStorage.getItem('info')
		if (storageItem) {
			return JSON.parse(storageItem)
		} else {
			localStorage.setItem(
				'info',
				JSON.stringify({
					firstVisit: true,
				})
			)
			return this.info
		}
	},
	set info(changes) {
		let items = this.info
		if (changes)
			for (let [key, value] of Object.entries(changes)) {
				items[key] = value
			}
		localStorage.setItem('info', JSON.stringify(items))
	},
	get settings(): any {
		let storageItem = localStorage.getItem('settings')
		if (storageItem) {
			return JSON.parse(storageItem)
		} else {
			localStorage.setItem(
				'settings',
				JSON.stringify({
					lastColorAlgorithmIndex: 2,
					cookiesOk: false,
				})
			)
			return this.settings
		}
	},
	set settings(changes) {
		let items = this.settings
		if (changes)
			for (let [key, value] of Object.entries(changes)) {
				items[key] = value
			}
		localStorage.setItem('settings', JSON.stringify(items))
	},
	savedPalettes: {
		get items() {
			let localString = localStorage.getItem('saved-palettes')
			let storageItems
			if (localString) {
				let array = []
				storageItems = JSON.parse(localString)
				for (let item of storageItems) array.push(item)
				return array
			} else return []
		},
		set items(palettes: any[]) {
			localStorage.setItem('saved-palettes', JSON.stringify(palettes))
		},
		addItem(item: any) {
			let array = this.items
			array.push(item)
			this.items = array
		},
		removeItem(index: number) {
			this.items.splice(index, 1)
		},
	},
}

const session = {
	create: {
		cmds: <{ undo: Function; redo: Function }[]>[],
		cmdIndex: -1,
		push(cmd: { undo: Function; redo: Function }) {
			this.cmds.splice(this.cmdIndex + 1, Infinity, cmd)
			this.cmdIndex = this.cmds.length - 1
		},
		undo() {
			if (this.cmdIndex > -1) {
				this.cmds[this.cmdIndex].undo()
				this.cmdIndex--
			}
		},
		redo() {
			if (this.cmdIndex < this.cmds.length - 1) {
				this.cmdIndex++
				this.cmds[this.cmdIndex].redo()
			}
		},
	},
	palettes: {
		cmds: <{ undo: Function; redo: Function }[]>[],
		cmdIndex: -1,
		push(cmd: { undo: Function; redo: Function }) {
			this.cmds.splice(this.cmdIndex + 1, Infinity, cmd)
			this.cmdIndex = this.cmds.length - 1
		},
		undo() {
			if (this.cmdIndex > -1) {
				let cmd = this.cmds[this.cmdIndex]
				this.cmdIndex--
				cmd.undo()
			}
		},
		redo() {
			if (this.cmdIndex < this.cmds.length - 1) {
				this.cmdIndex++
				let cmd = this.cmds[this.cmdIndex]
				cmd.redo()
			}
		},
	},
}

const toolbar = document.querySelector('.toolbar')!
function pageFactory(title: string, element: HTMLElement, context?: any): Function {
	return (ids?: string[]) => {
		document.title = siteTitle + ' | ' + title
		const currentView = document.querySelector('main.visible')
		if (currentView) currentView.classList.remove('visible')
		const nextView = element
		nextView?.classList.add('visible')
		if (title == 'Palettes') {
			document.body.parentElement!.style.overflow = ''
			document.body.style.overflow = ''
			toolbar.classList.add('palettes')
			toolbar.classList.remove('create')
			context.draw(local.savedPalettes.items)
		} else if (title == 'Create') {
			document.body.parentElement!.style.overflow = 'hidden'
			document.body.style.overflow = 'hidden'
			toolbar.classList.add('create')
			toolbar.classList.remove('palettes')
			if (ids) context.generate(ids)
			else {
				let slots = context.generate()
				let hexes = []
				for (let slot of slots) hexes.push(slot.hex)
				history.replaceState('', '', hexes.join('-'))
			}
		} else {
			toolbar.classList.remove('palettes', 'create')
			document.documentElement.style.overflow = ''
			document.body.style.overflow = ''
		}
	}
}

const random = (min: number, max: number) => Math.random() * (max - min) + min

const uuid = () => btoa(parseInt(uuidv4(), 16).toString(36)).replaceAll('=', '')

function toolTip(message: string, options?: { pos?: [x: number, y: number]; duration?: number }) {
	const tip = document.createElement('div')
	tip.classList.add('tooltip', 'appearing')
	const text = document.createElement('h2')
	text.innerHTML = message
	tip.append(text)
	if (options?.pos) {
		tip.style.left = options.pos[0] + 'px'
		tip.style.top = options.pos[1] + 'px'
	} else tip.classList.add('centered')
	setTimeout(() => {
		if (options && options.pos) {
			if (tip.clientWidth + options.pos[0] > document.body.clientWidth) {
				tip.style.translate = '-100%'
				if (tip.clientHeight + options.pos[1] > document.body.clientHeight) {
					tip.style.translate = '-100 -100%'
				}
			} else if (tip.clientHeight + options.pos[1] > document.body.clientHeight) {
				tip.style.translate = '0 -100%'
			}
		}
	}, 0)
	tip.addEventListener(
		'animationend',
		() => {
			tip.classList.remove('appearing')
			setTimeout(() => {
				tip.classList.add('disappearing')
				tip.addEventListener(
					'animationend',
					() => {
						tip.remove()
					},
					{ once: true }
				)
			}, options?.duration || 1000)
		},
		{ once: true }
	)
	return tip
}

function popOver(
	choices: { content?: string; id?: string; class?: string }[],
	options?: { type?: string; hex?: string }
) {
	let div = document.createElement('div')
	div.classList.add('popover')
	let overlay = document.createElement('div')
	overlay.classList.add('clear-overlay')
	if (options?.type == 'menu' || options?.type == 'tool-menu' || options?.type == 'tool-menu-side') {
		let list = document.createElement('ul')
		list.classList.add('list')
		for (let choice of choices) {
			let item = document.createElement('div')
			if (choice.id) item.id = choice.id
			item.classList.add('choice')
			if (choice.content) item.innerHTML = choice.content
			if (choice.class) item.classList.add(choice.class)
			list.append(item)
		}
		div.append(list)
		document.body.append(overlay)
	} else if (options?.type == 'color-picker') {
		let canvas = document.createElement('canvas')
		canvas.id = 'color-picker'
		canvas.classList.add('color-picker')
		let ctx = canvas.getContext('2d')!

		let { h } = deconstructHex(options.hex!)
		let color = `hsl(${h}, 100%, 50%)`
		let gH = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0)
		gH.addColorStop(0, '#fff')
		gH.addColorStop(1, color)
		ctx.fillStyle = gH
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

		let gV = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
		gV.addColorStop(0, 'rgba(0,0,0,0)')
		gV.addColorStop(1, 'black')
		ctx.fillStyle = gV
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

		let canvCurs = document.createElement('div')
		canvCurs.classList.add('color-picker-cursor')

		let canvInput = document.createElement('input')
		canvInput.setAttribute('min', '0')
		canvInput.setAttribute('max', '360')
		canvInput.setAttribute('type', 'range')

		let hueBar = document.createElement('div')
		hueBar.classList.add('huebar')

		let hueCurs = document.createElement('div')
		hueCurs.classList.add('huebar-cursor')

		let hueInput = document.createElement('input')
		hueInput.setAttribute('min', '0')
		hueInput.setAttribute('max', '360')
		hueInput.setAttribute('type', 'range')

		canvas.append(canvCurs, canvInput)
		hueBar.append(hueCurs, hueInput)
		div.append(canvas, hueBar)
	}
	if (options?.type == 'tool-menu') div.style.translate = '0 -100%'
	if (options?.type == 'tool-menu-side') div.style.translate = '100% -100%'
	return div
}

function confirmation(
	message: { message: string; value: string },
	options: { message: string; value: string; call?: Function }[]
) {
	let div = document.createElement('div')
	div.classList.add('confirmation-screen', message.value + '-confirmation')
	let box = document.createElement('div')
	box.classList.add('box')
	let h2 = document.createElement('h2')
	h2.innerHTML = message.message
	let list = document.createElement('ul')
	let overlay = document.createElement('div')
	overlay.classList.add('overlay')
	box.append(h2, list)
	div.append(box, overlay)
	for (let { message, value, call } of options) {
		let option = document.createElement('li')
		option.innerHTML = message
		option.classList.add(value)
		list.append(option)
		option.addEventListener(
			'click',
			() => {
				if (call) call()
				div.remove()
			},
			{ once: true }
		)
	}
	document.body.append(div)
}

function inputField(content: string, value: string) {
	let div = document.createElement('div')
	div.classList.add('confirmation-screen', value)
	let h2 = document.createElement('h2')
	h2.innerHTML = content
	let field = document.createElement('textarea')
	let overlay = document.createElement('div')
	overlay.classList.add('overlay')
	let box = document.createElement('div')
	box.classList.add('box')
	let options = document.createElement('ul')
	let confirm = document.createElement('li')
	confirm.classList.add('yes')
	confirm.innerHTML = 'Confirm'
	let cancel = document.createElement('li')
	cancel.innerHTML = 'Cancel'
	cancel.classList.add('no')
	options.append(cancel, confirm)
	box.append(h2, field, options)
	div.append(box, overlay)
	return div
}

function settingsPopover() {
	let div = document.createElement('div')
	div.classList.add('confirmation-screen', 'settings-popover')
	let box = document.createElement('div')
	box.classList.add('box')
	let overlay = document.createElement('div')
	overlay.classList.add('overlay')
	let heading = document.createElement('h2')
	heading.innerText = 'Settings'
	let options = document.createElement('ul')
	options.classList.add('options')
	let algorithm = document.createElement('li')
	let algLabel = document.createElement('label')
	algLabel.innerText = 'Algorithm'
	let algChoices = document.createElement('select')
	algChoices.id = 'algorithm'
	let random = document.createElement('option')
	random.value = 'random'
	random.innerText = 'Random Algorithm'
	let monochromatic = document.createElement('option')
	monochromatic.value = 'monochromatic'
	monochromatic.innerText = 'Monochromatic'
	let analogous = document.createElement('option')
	analogous.value = 'analogous'
	analogous.innerText = 'Analogous'
	let complementary = document.createElement('option')
	complementary.value = 'complementary'
	complementary.innerText = 'Complementary'
	let splitComplementary = document.createElement('option')
	splitComplementary.value = 'split-complementary'
	splitComplementary.innerText = 'Split Complementary'
	let triadic = document.createElement('option')
	triadic.value = 'triadic'
	triadic.innerText = 'Triadic'
	let tetradic = document.createElement('option')
	tetradic.value = 'tetradic'
	tetradic.innerText = 'Tetradic'
	let square = document.createElement('option')
	square.value = 'square'
	square.innerText = 'Square'
	let randomize = document.createElement('option')
	randomize.value = 'randomize'
	randomize.innerText = 'Randomize Colors'

	let confirmation = document.createElement('ul')
	confirmation.classList.add('confirmation')
	let confirm = document.createElement('li')
	confirm.classList.add('yes')
	confirm.innerText = 'Confirm'
	let cancel = document.createElement('li')
	cancel.classList.add('no')
	cancel.innerText = 'Cancel'

	confirmation.append(cancel, confirm)
	algChoices.append(
		randomize,
		monochromatic,
		analogous,
		complementary,
		splitComplementary,
		triadic,
		tetradic,
		square,
		random
	)
	algChoices.selectedIndex = local.settings.lastColorAlgorithmIndex

	let cookies = document.createElement('li')
	cookies.classList.add('horizontal')
	let cookiesChoices = document.createElement('div')
	let cookiesLabel = document.createElement('label')
	cookiesLabel.innerText = 'Cookies'
	let cookiesOkLabel = document.createElement('label')
	cookiesOkLabel.innerText = `That's fine!`
	cookiesOkLabel.setAttribute('for', 'cookies-ok')
	let cookiesNotOkLabel = document.createElement('label')
	cookiesNotOkLabel.innerText = `No thanks.`
	cookiesNotOkLabel.setAttribute('for', 'cookies-not-ok')
	let op1 = document.createElement('div')
	let op2 = document.createElement('div')
	op1.classList.add('op')
	op2.classList.add('op')
	let cookiesOk = document.createElement('input')
	cookiesOk.id = 'cookies-ok'
	cookiesOk.value = 'cookies-ok'
	cookiesOk.setAttribute('type', 'radio')
	cookiesOk.classList.add('true')
	let cookiesNotOk = document.createElement('input')
	cookiesNotOk.id = 'cookies-not-ok'
	cookiesNotOk.value = 'cookies-not-ok'
	cookiesNotOk.setAttribute('type', 'radio')
	cookiesNotOk.classList.add('false')
	if (local.settings.cookiesOk) cookiesOk.checked = true
	else cookiesNotOk.checked = true
	cookiesOk.addEventListener('change', () => {
		if (cookiesOk.checked) cookiesNotOk.checked = false
		else cookiesNotOk.checked = true
	})

	cookiesNotOk.addEventListener('change', () => {
		if (cookiesNotOk.checked) cookiesOk.checked = false
		else cookiesOk.checked = true
	})

	op1.append(cookiesOk, cookiesOkLabel)
	op2.append(cookiesNotOk, cookiesNotOkLabel)
	cookies.append(cookiesLabel, cookiesChoices)
	cookiesChoices.append(op1, op2)

	algorithm.append(algLabel, algChoices)
	options.append(algorithm, cookies)
	box.append(heading, options, confirmation)
	div.append(overlay, box)
	return div
}

export {
	local,
	session,
	uuid,
	random,
	hslToHex,
	deconstructHex,
	pageFactory,
	toolTip,
	popOver,
	confirmation,
	inputField,
	settingsPopover,
}
