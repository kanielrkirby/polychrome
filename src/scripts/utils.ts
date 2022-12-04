import { testSize } from './main'

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
					algorithm: 2,
					cookies: 0,
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

const random = (min: number, max: number) => Math.random() * (max - min) + min

function toolTip(message: string, options?: { pos?: [x: number, y: number]; duration?: number }) {
	const tip = document.createElement('div')
	tip.classList.add('tooltip', 'appearing')
	const text = document.createElement('h2')
	text.innerHTML = message
	tip.append(text)
	if (options?.pos && !(navigator.userAgent.includes('Android') || navigator.userAgent.includes('like Mac'))) {
		tip.style.left = options.pos[0] + 'px'
		tip.style.top = options.pos[1] + 'px'
		setTimeout(() => {
			if (tip.clientWidth + options.pos![0] > document.body.clientWidth) {
				tip.style.translate = '-100%'
				if (tip.clientHeight + options.pos![1] > document.body.clientHeight) tip.style.translate = '-100 -100%'
			} else if (tip.clientHeight + options.pos![1] > document.body.clientHeight) tip.style.translate = '0 -100%'
		}, 0)
	} else tip.classList.add('centered')
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

let cancelClick = false

function popOver(
	choices: { message: string; call?: Function; classes?: string[]; attributes?: string[][] }[],
	options?: { type?: string }
) {
	let div = document.createElement('div')
	div.classList.add('popover')
	let obs = new IntersectionObserver(
		(entries) => {
			let entry = entries[0]
			console.log(entry)
			if (!entry.isIntersecting && entry.intersectionRatio < 1) div.style.translate = '0 -100%'
		},
		{ root: document, threshold: 1 }
	)
	setTimeout(() => {
		obs.observe(div)
	}, 10)
	if (options?.type == 'tool-menu') div.classList.add('bottom')
	let overlay = document.createElement('div')
	overlay.classList.add('clear-overlay')
	document.body.append(overlay)
	let list = document.createElement('ul')
	list.classList.add('list')
	let remove = () => {
		overlay.remove()
		div.remove()
	}
	overlay.onclick = overlay.ontouchend = () => {
		if (cancelClick) return
		cancelClick = true
		setTimeout(() => {
			cancelClick = false
		}, 75)
		remove()
	}
	if (choices)
		for (let { message, classes, attributes, call } of choices) {
			let item = document.createElement('div')
			item.classList.add('choice')
			item.innerHTML = message
			if (classes) for (let className of classes) item.classList.add(className)
			if (attributes) for (let attribute of attributes) item.setAttribute(attribute[0], attribute[1])
			list.append(item)
			div.append(list)
			setTimeout(() => {
				item.onclick = item.ontouchend = () => {
					if (cancelClick) return
					cancelClick = true
					setTimeout(() => {
						cancelClick = false
					}, 75)
					if (call) call()
					remove()
				}
			}, 25)
		}
	return div
}

function confirmation(
	message: string,
	options?: {
		settings?: { message: string; value: string; choices: { message: string; value?: string | number }[] }[]
		confirmation?: {
			value?: string
			confirm: { message: string; call?: Function }
			cancel: { message: string; call?: Function }
		}
		choices?: { message: string; value: string; call?: Function }[]
		type?: string
	}
) {
	let div = document.createElement('div')
	div.classList.add('confirmation-screen')
	let h2 = document.createElement('h2')
	h2.innerHTML = message
	let overlay = document.createElement('div')
	overlay.classList.add('overlay')
	let remove = () => {
		document.querySelector('.main-nav')!.classList.remove('visible')
		div.remove()
		document.querySelector('.overlay')?.remove()
		setTimeout(testSize, 50)
	}
	overlay.onclick = overlay.ontouchend = remove
	let box = document.createElement('div')
	box.classList.add('box')
	box.append(h2)
	div.append(box, overlay)
	function confirmationElem() {
		if (options?.confirmation?.value) div.classList.add(options.confirmation.value)
		let confirmationElement = document.createElement('ul')
		let confirm = document.createElement('li')
		confirm.classList.add('yes')
		confirm.innerHTML = options?.confirmation?.confirm.message || 'Confirm'
		let cancel = document.createElement('li')
		cancel.classList.add('no')
		cancel.innerHTML = options?.confirmation?.cancel.message || 'Cancel'
		let call = () => {
			if (options?.confirmation?.confirm.call) options.confirmation.confirm.call()
			remove()
		}
		let call2 = () => {
			if (options?.confirmation?.cancel.call) options.confirmation.cancel.call()
			remove()
		}
		confirm.onclick = confirm.ontouchend = call
		cancel.onclick = cancel.ontouchend = call2
		confirmationElement.append(cancel, confirm)
		return confirmationElement
	}
	if (options?.type == 'input') {
		let field = document.createElement('textarea')
		box.append(field)
	}
	if (options) {
		if (options.settings) {
			let settings = document.createElement('ul')
			settings.classList.add('options')
			for (let { message, value, choices } of options.settings) {
				let settingElement = document.createElement('li')
				let settingHeading = document.createElement('label')
				settingHeading.innerText = message
				let settingChoices = document.createElement('select')
				settingChoices.id = value
				let i = 0
				for (let { message, value } of choices) {
					let choice = document.createElement('option')
					choice.innerText = message
					choice.id = (typeof value == 'number' ? value : i).toString()
					i++
					settingChoices.append(choice)
				}
				settingChoices.selectedIndex = local.settings[value]
				settingElement.append(settingHeading, settingChoices)
				settings.append(settingElement)
			}
			box.append(settings)
		}
	}
	box.append(confirmationElem())
	document.body.append(div)
}

export { local, session, random, deconstructHex, toolTip, popOver, confirmation }
