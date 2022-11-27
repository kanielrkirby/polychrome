import { palette, router } from './main'
import { session } from './utils'

let nav = document.querySelector('.main-nav')!
export default function handleKeys() {
	onkeydown = (e) => {
		if (document.querySelector('.confirmation-screen')) {
			if (e.key === 'Escape') {
				document.querySelector('.confirmation-screen')?.remove()
				return
			}
			return
		}
		if (e.metaKey || e.ctrlKey) {
			let { base } = router.deconstructURL(location.pathname, true)
			if (e.key === 'z' || e.key === 'Z') {
				if (base === 'palettes') {
					if (e.shiftKey) session.palettes.redo()
					else session.palettes.undo()
					return
				} else {
					if (e.shiftKey) session.create.redo()
					else session.create.undo()
					return
				}
			}
			//* CMD/Ctrl Number Locking
			if (base === 'create') {
				let number = parseInt(e.key)
				if (number >= 0 && number <= 9) {
					e.preventDefault()
					let slot = palette.slots[number - 1] || palette.slots[palette.slots.length - 1]
					let swatch = document.getElementById(slot.id)
					session.create.push({
						undo() {
							let slot = palette.slots[number - 1] || palette.slots[palette.slots.length - 1]
							let swatch = document.getElementById(slot.id)
							slot.isLocked = !slot.isLocked
							swatch!.querySelector('.lock')!.classList.toggle('locked')
						},
						redo() {
							let slot = palette.slots[number - 1] || palette.slots[palette.slots.length - 1]
							let swatch = document.getElementById(slot.id)
							slot.isLocked = !slot.isLocked
							swatch!.querySelector('.lock')!.classList.toggle('locked')
						},
					})
					slot.isLocked = !slot.isLocked
					swatch!.querySelector('.lock')!.classList.toggle('locked')
					return
				}
			}
		}
		if (e.key === ' ') {
			//* Space Generate
			let { base } = router.deconstructURL(location.pathname, true)
			if (base === 'create') {
				e.preventDefault()
				let prevIds: string[] = []
				for (let { hex } of palette.slots) prevIds.push(hex)
				palette.generate()
				let ids: string[] = []
				for (let { hex } of palette.slots) ids.push(hex)
				history.replaceState('', '', '/polychrome/create/' + ids.join('-'))
				session.create.push({
					undo: () => {
						palette.generate(prevIds)
						history.replaceState('', '', '/polychrome/create/' + prevIds.join('-'))
						palette.plus.hide()
					},
					redo: () => {
						palette.generate(ids)
						history.replaceState('', '', '/polychrome/create/' + ids.join('-'))
					},
				})
			}
			return
		}
		if (e.key === 'Escape') {
			nav.classList.remove('visible')
			document.querySelector('.overlay')?.remove()
			return
		}
		//! NOT DONE
		if (e.key === 'Enter') {
			let a: HTMLElement = document.activeElement as HTMLElement
			console.log(a)
			return
		}
		if (e.key === '/') {
			//! DEBUG
		}
	}
}
