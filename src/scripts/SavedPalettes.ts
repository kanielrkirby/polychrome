import { local, deconstructHex } from './utils'

let wrapper = document.querySelector('.saved-palettes-wrapper')!

export default class SavedPalettes {
	constructor() {
		this.items = local.savedPalettes.items
	}
	items: any[] = []
	draw(palettes?: string[][]) {
		while (wrapper.childElementCount > 0) wrapper.lastChild!.remove()
		if (palettes) {
			for (let i = 0; i < palettes.length; i++) {
				let palette = palettes[i]

				let container = document.createElement('div')
				container.setAttribute('data-palette-index', i.toString())
				container.classList.add('palette-container')

				let pal = document.createElement('div')
				pal.classList.add('palette')

				let options = document.createElement('div')
				options.classList.add('options')

				let more = document.createElement('div')
				more.classList.add('more')

				let moreSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
				moreSvg.setAttribute('viewBox', '0 0 100 100')

				let moreUse = document.createElementNS('http://www.w3.org/2000/svg', 'use')
				moreUse.setAttribute('href', '#icon-more-horizontal')

				for (let j = 0; j < palette.length; j++) {
					let hex = palette[j]
					let { lum } = deconstructHex(hex)
					let swatch = document.createElement('div')
					swatch.setAttribute('data-color-index', j.toString())
					swatch.classList.add('swatch')
					swatch.style.backgroundColor = '#' + hex
					if (lum < 0.5) swatch.classList.add('isLight')
					let text = document.createElement('h2')
					text.innerHTML = '#' + hex
					text.classList.add('text')

					swatch.append(text)
					pal.append(swatch)
				}
				moreSvg.append(moreUse)
				more.append(moreSvg)
				options.append(more)
				container.append(pal, options)
				wrapper.append(container)
			}
		}
		let emptyState = document.querySelector('.palettes-page .when-empty')!
		if (wrapper.childElementCount == 0) emptyState.classList.remove('hidden')
		else emptyState.classList.add('hidden')
	}
	addItem(palette: any, index?: number) {
		if (typeof index == 'number') this.items.splice(index, 0, palette)
		else this.items.push(palette)
		local.savedPalettes.items = this.items
		this.draw(this.items)
	}
	removeItem(index: number) {
		this.items.splice(index, 1)
		local.savedPalettes.items = this.items
		this.draw(this.items)
	}
}
