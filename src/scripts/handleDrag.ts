import { palette, router } from './main'
import { session } from './utils'

window.addEventListener('scroll', stopMotion)
window.addEventListener('touchmove', stopMotion)
function stopMotion(e: Event) {
	if (router.deconstructURL(location.pathname).base == 'create') {
		e.preventDefault()
		e.stopPropagation()
	}
}

window.ontouchstart = (e) => {
	//* If you click a swatch, add event listeners
	let swatch = (e.target as HTMLElement).closest('.create-page .swatch') as HTMLElement
	if (
		swatch &&
		!(e.target as HTMLElement).closest('.options div') &&
		!(e.target as HTMLElement).closest('.options svg')
	) {
		let vertical = false
		if (document.body.classList.contains('vertical')) vertical = true
		palette.plus.disabled = true
		palette.plus.hide()
		swatch.classList.add('is-dragging')
		let halfWidth = swatch.clientWidth / 2
		let halfHeight = swatch.clientHeight / 2
		let startX = e.touches[0].clientX
		let startY = e.touches[0].clientY
		let index = parseInt(swatch.getAttribute('data-color-index')!)
		let slot = palette.slots[index]
		let amount = 0
		let width
		//* Mouse tracking
		window.addEventListener('touchmove', dragHandler, { passive: false })
		//* When you release the click button, remove event listeners and finalize
		window.addEventListener(
			'touchend',
			() => {
				swatch.classList.remove('is-dragging')
				swatch.classList.add('is-released')
				removeEventListener('touchmove', dragHandler)
				swatch.style.translate = `${vertical ? '0 ' : ''}${amount * 100}%`
				function setPalette() {
					swatch.removeEventListener('transitionend', setPalette)
					swatch.removeEventListener('transitioncancel', setPalette)
					swatch.classList.remove('is-released')
					let next = swatch
					for (let i = 0; i < amount; i++) {
						palette.slots.splice(slot.data, 1)
						palette.slots.splice(slot.data + 1, 0, slot)
						slot.data++
						next = next.nextElementSibling as HTMLElement
						palette.slots[slot.data - 1].data--
					}
					for (let i = 0; i > amount; i--) {
						palette.slots.splice(slot.data, 1)
						palette.slots.splice(slot.data - 1, 0, slot)
						slot.data--
						next = next.previousElementSibling as HTMLElement
						palette.slots[slot.data + 1].data++
					}

					let copy = swatch.cloneNode(true)

					if (amount > 0) {
						next.after(copy)
						swatch.remove()
					} else if (amount < 0) {
						next.before(copy)
						swatch.remove()
					}
					swatch.style.translate = ''
					let arr = []
					for (let slot of palette.slots) {
						let swatch = document.getElementById(slot.id)!
						swatch.style.transition = 'transform 0s'
						swatch.style.translate = ''
						setTimeout(() => {
							swatch.style.transition = ''
						}, 1)
						arr.push(slot.hex)
					}
					swatch = copy as HTMLElement
					history.replaceState('', '', arr.join('-'))
					palette.plus.disabled = false
					if (amount)
						session.create.push({
							undo() {
								palette.plus.hide()
								let next = (swatch = document.getElementById(slot.id)!)
								for (let i = 0; i < -amount; i++) {
									palette.slots.splice(slot.data, 1)
									palette.slots.splice(slot.data + 1, 0, slot)
									slot.data++
									next = next.nextElementSibling as HTMLElement
									let index = parseInt(next.getAttribute('data-color-index')!)
									next.setAttribute('data-color-index', (index - 1).toString())
								}
								for (let i = 0; i > -amount; i--) {
									palette.slots.splice(slot.data, 1)
									palette.slots.splice(slot.data - 1, 0, slot)
									slot.data--
									next = next.previousElementSibling as HTMLElement
									let index = parseInt(next.getAttribute('data-color-index')!)
									next.setAttribute('data-color-index', (index + 1).toString())
								}
								copy = swatch.cloneNode(true)
								if (-amount > 0) {
									next.after(copy)
									swatch.remove()
								} else if (-amount < 0) {
									next.before(copy)
									swatch.remove()
								}
								let arr = []
								for (let slot of palette.slots) arr.push(slot.hex)
								history.replaceState('', '', arr.join('-'))
							},
							redo() {
								palette.plus.hide()
								let next = (swatch = document.getElementById(slot.id)!)
								for (let i = 0; i < amount; i++) {
									palette.slots.splice(slot.data, 1)
									palette.slots.splice(slot.data + 1, 0, slot)
									slot.data++
									next = next.nextElementSibling as HTMLElement
									index = parseInt(next.getAttribute('data-color-index')!)
									next.setAttribute('data-color-index', (index - 1).toString())
								}
								for (let i = 0; i > amount; i--) {
									palette.slots.splice(slot.data, 1)
									palette.slots.splice(slot.data - 1, 0, slot)
									slot.data--
									next = next.previousElementSibling as HTMLElement
									index = parseInt(next.getAttribute('data-color-index')!)
									next.setAttribute('data-color-index', (index + 1).toString())
								}
								copy = swatch.cloneNode(true)
								if (amount > 0) {
									next.after(copy)
									swatch.remove()
								} else if (amount < 0) {
									next.before(copy)
									swatch.remove()
								}
								let arr = []
								for (let slot of palette.slots) arr.push(slot.hex)
								history.replaceState('', '', arr.join('-'))
							},
						})
				}
				swatch.addEventListener('transitionend', setPalette)
				swatch.addEventListener('transitioncancel', setPalette)
			},
			{ once: true }
		)
		function dragHandler(e: TouchEvent) {
			e.preventDefault()
			// Dragged swatched
			if (vertical) {
				let t = e.touches[0].clientY - startY
				swatch.style.translate = '0 ' + t + 'px'
				// Swatches to right of dragged swatch
				let next = swatch
				let testCase = palette.slots.length - index - 1
				width = 0
				amount = 0
				if (t > 0) {
					for (let i = 0; i < testCase; i++) {
						width = (i * 2 + 1) * halfHeight
						next = next.nextElementSibling as HTMLElement
						if (t > width) {
							amount++
							if (next.style.translate != `0 -100%`) next.style.translate = `0 -100%`
						} else if (next.style.translate == `0 -100%`) next.style.translate = '0 0'
					}
				} else {
					// Swatches to left of dragged swatch
					for (let i = 0; i < index; i++) {
						width = (i * 2 + 1) * halfHeight
						next = next.previousElementSibling as HTMLElement
						if (-t > width) {
							amount--
							if (next.style.translate != `0 100%`) next.style.translate = `0 100%`
						} else if (next.style.translate == `0 100%`) next.style.translate = '0 0'
					}
				}
			} else {
				let t = e.touches[0].clientX - startX
				swatch.style.translate = t + 'px'
				// Swatches to right of dragged swatch
				let next = swatch
				let testCase = palette.slots.length - index - 1
				width = 0
				amount = 0
				if (t > 0) {
					for (let i = 0; i < testCase; i++) {
						width = (i * 2 + 1) * halfWidth
						next = next.nextElementSibling as HTMLElement
						if (t > width) {
							amount++
							if (next.style.translate != `-100%`) next.style.translate = `-100%`
						} else if (next.style.translate == `-100%`) next.style.translate = ''
					}
				} else {
					// Swatches to left of dragged swatch
					for (let i = 0; i < index; i++) {
						width = (i * 2 + 1) * halfWidth
						next = next.previousElementSibling as HTMLElement
						if (-t > width) {
							amount--
							if (next.style.translate != `100%`) next.style.translate = `100%`
						} else if (next.style.translate == `100%`) next.style.translate = ''
					}
				}
			}
		}
	}
}

export default function handleDrag() {
	onmousedown = (e) => {
		//* If you click a swatch, add event listeners
		let swatch = (e.target as HTMLElement).closest('.create-page .swatch') as HTMLElement
		if (
			swatch &&
			!(e.target as HTMLElement).closest('.options div') &&
			!(e.target as HTMLElement).closest('.options svg')
		) {
			let vertical = false
			if (document.body.classList.contains('vertical')) vertical = true
			palette.plus.disabled = true
			palette.plus.hide()
			swatch.classList.add('is-dragging')
			let halfWidth = swatch.clientWidth / 2
			let halfHeight = swatch.clientHeight / 2
			let startX = e.x
			let startY = e.y
			let index = parseInt(swatch.getAttribute('data-color-index')!)
			let slot = palette.slots[index]
			let amount = 0
			let width
			//* Mouse tracking
			addEventListener('mousemove', dragHandler)
			//* When you release the click button, remove event listeners and finalize
			addEventListener(
				'mouseup',
				() => {
					swatch.classList.remove('is-dragging')
					swatch.classList.add('is-released')
					removeEventListener('mousemove', dragHandler)
					swatch.style.translate = `${vertical ? '0 ' : ''}${amount * 100}%`
					function setPalette() {
						swatch.removeEventListener('transitionend', setPalette)
						swatch.removeEventListener('transitioncancel', setPalette)
						swatch.classList.remove('is-released')
						let next = swatch
						for (let i = 0; i < amount; i++) {
							palette.slots.splice(slot.data, 1)
							palette.slots.splice(slot.data + 1, 0, slot)
							slot.data++
							next = next.nextElementSibling as HTMLElement
							palette.slots[slot.data - 1].data--
						}
						for (let i = 0; i > amount; i--) {
							palette.slots.splice(slot.data, 1)
							palette.slots.splice(slot.data - 1, 0, slot)
							slot.data--
							next = next.previousElementSibling as HTMLElement
							palette.slots[slot.data + 1].data++
						}

						let copy = swatch.cloneNode(true)

						if (amount > 0) {
							next.after(copy)
							swatch.remove()
						} else if (amount < 0) {
							next.before(copy)
							swatch.remove()
						}
						swatch.style.translate = ''
						let arr = []
						for (let slot of palette.slots) {
							let swatch = document.getElementById(slot.id)!
							swatch.style.transition = 'transform 0s'
							swatch.style.translate = ''
							setTimeout(() => {
								swatch.style.transition = ''
							}, 1)
							arr.push(slot.hex)
						}
						swatch = copy as HTMLElement
						history.replaceState('', '', arr.join('-'))
						palette.plus.disabled = false
						if (amount)
							session.create.push({
								undo() {
									palette.plus.hide()
									let next = (swatch = document.getElementById(slot.id)!)
									for (let i = 0; i < -amount; i++) {
										palette.slots.splice(slot.data, 1)
										palette.slots.splice(slot.data + 1, 0, slot)
										slot.data++
										next = next.nextElementSibling as HTMLElement
										let index = parseInt(next.getAttribute('data-color-index')!)
										next.setAttribute('data-color-index', (index - 1).toString())
									}
									for (let i = 0; i > -amount; i--) {
										palette.slots.splice(slot.data, 1)
										palette.slots.splice(slot.data - 1, 0, slot)
										slot.data--
										next = next.previousElementSibling as HTMLElement
										let index = parseInt(next.getAttribute('data-color-index')!)
										next.setAttribute('data-color-index', (index + 1).toString())
									}
									copy = swatch.cloneNode(true)
									if (-amount > 0) {
										next.after(copy)
										swatch.remove()
									} else if (-amount < 0) {
										next.before(copy)
										swatch.remove()
									}
									let arr = []
									for (let slot of palette.slots) arr.push(slot.hex)
									history.replaceState('', '', arr.join('-'))
								},
								redo() {
									palette.plus.hide()
									let next = (swatch = document.getElementById(slot.id)!)
									for (let i = 0; i < amount; i++) {
										palette.slots.splice(slot.data, 1)
										palette.slots.splice(slot.data + 1, 0, slot)
										slot.data++
										next = next.nextElementSibling as HTMLElement
										index = parseInt(next.getAttribute('data-color-index')!)
										next.setAttribute('data-color-index', (index - 1).toString())
									}
									for (let i = 0; i > amount; i--) {
										palette.slots.splice(slot.data, 1)
										palette.slots.splice(slot.data - 1, 0, slot)
										slot.data--
										next = next.previousElementSibling as HTMLElement
										index = parseInt(next.getAttribute('data-color-index')!)
										next.setAttribute('data-color-index', (index + 1).toString())
									}
									copy = swatch.cloneNode(true)
									if (amount > 0) {
										next.after(copy)
										swatch.remove()
									} else if (amount < 0) {
										next.before(copy)
										swatch.remove()
									}
									let arr = []
									for (let slot of palette.slots) arr.push(slot.hex)
									history.replaceState('', '', arr.join('-'))
								},
							})
					}
					swatch.addEventListener('transitionend', setPalette)
					swatch.addEventListener('transitioncancel', setPalette)
				},
				{ once: true }
			)
			function dragHandler(e: MouseEvent) {
				// Dragged swatched
				if (vertical) {
					let t = e.y - startY
					swatch.style.translate = '0 ' + t + 'px'
					// Swatches to right of dragged swatch
					let next = swatch
					let testCase = palette.slots.length - index - 1
					width = 0
					amount = 0
					if (t > 0) {
						for (let i = 0; i < testCase; i++) {
							width = (i * 2 + 1) * halfHeight
							next = next.nextElementSibling as HTMLElement
							if (t > width) {
								amount++
								if (next.style.translate != `0 -100%`) next.style.translate = `0 -100%`
							} else if (next.style.translate == `0 -100%`) next.style.translate = ''
						}
					} else {
						// Swatches to left of dragged swatch
						for (let i = 0; i < index; i++) {
							width = (i * 2 + 1) * halfHeight
							next = next.previousElementSibling as HTMLElement
							if (-t > width) {
								amount--
								if (next.style.translate != `0 100%`) next.style.translate = `0 100%`
							} else if (next.style.translate == `0 100%`) next.style.translate = ''
						}
					}
				} else {
					let t = e.x - startX
					swatch.style.translate = t + 'px'
					// Swatches to right of dragged swatch
					let next = swatch
					let testCase = palette.slots.length - index - 1
					width = 0
					amount = 0
					if (t > 0) {
						for (let i = 0; i < testCase; i++) {
							width = (i * 2 + 1) * halfWidth
							next = next.nextElementSibling as HTMLElement
							if (t > width) {
								amount++
								if (next.style.translate != `-100%`) next.style.translate = `-100%`
							} else if (next.style.translate == `-100%`) next.style.translate = ''
						}
					} else {
						// Swatches to left of dragged swatch
						for (let i = 0; i < index; i++) {
							width = (i * 2 + 1) * halfWidth
							next = next.previousElementSibling as HTMLElement
							if (-t > width) {
								amount--
								if (next.style.translate != `100%`) next.style.translate = `100%`
							} else if (next.style.translate == `100%`) next.style.translate = ''
						}
					}
				}
			}
			ondragstart = () => false
		}
	}
}
