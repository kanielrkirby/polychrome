import { router, palette, palettes } from './main'
import { session, toolTip, popOver, confirmation, local, inputField, settingsPopover } from './utils'
export default function handleClicks() {
	//* Create Page Palette
	let cancelPalMouse = false
	;(document.querySelector('#palette')! as HTMLElement).ontouchend = () => paletteClick
	;(document.querySelector('#palette')! as HTMLElement).onclick = () => paletteClick
	async function paletteClick(e: MouseEvent) {
		let target = e.target as HTMLElement
		if ((e as PointerEvent).pointerType != 'mouse') {
			cancelPalMouse = true
			setTimeout(() => {
				cancelPalMouse = false
			}, 10)
		} else if (cancelPalMouse) return
		// Add Button
		let add = target.closest('.plus-container svg')
		if (add) {
			// Gets the data index of the add symbol and adds the slot hex to the URL
			const { ids } = router.deconstructURL(location.pathname)
			const addIndex = parseInt(add.getAttribute('data-color-index')!)
			let slot = palette.addSlot({ index: addIndex + 1 })
			ids!.splice(addIndex + 1, 0, slot.hex)
			history.replaceState('', '', ids!.join('-'))
			palette.plus.hide()
			session.create.push({
				undo() {
					palette.removeSlot(slot, { animations: false })
					ids!.splice(addIndex + 1, 1)
					history.replaceState('', '', ids!.join('-'))
				},
				redo() {
					palette.addSlot(slot, { animations: false })
					ids!.splice(addIndex + 1, 0, slot.hex)
					history.replaceState('', '', ids!.join('-'))
				},
			})
			if (palette.slots.length == 8) palette.plus.hide()
			return
		}

		// Lock Button
		let lock = target.closest('.lock') as HTMLElement
		if (lock) {
			let swatch = target.closest('.swatch')!
			let index = parseInt(swatch.getAttribute('data-color-index')!)
			let slot = palette.slots[index]
			slot.isLocked = !slot.isLocked
			lock.classList.toggle('locked')
			session.create.push({
				undo() {
					let slot = palette.slots[index]
					let swatch = document.getElementById(slot.id)
					slot.isLocked = !slot.isLocked
					swatch!.querySelector('.lock')!.classList.toggle('locked')
				},
				redo() {
					let slot = palette.slots[index]
					let swatch = document.getElementById(slot.id)
					slot.isLocked = !slot.isLocked
					swatch!.querySelector('.lock')!.classList.toggle('locked')
				},
			})
			return
		}

		// X Button
		if (target.closest('.x')) {
			let swatch = target.closest('.swatch')!
			let slot = palette.slots[parseInt(swatch.getAttribute('data-color-index')!)]
			let { ids } = router.deconstructURL(location.pathname)
			palette.removeSlot(slot)
			ids!.splice(slot.data, 1)
			history.replaceState('', '', ids!.join('-'))
			session.create.push({
				undo() {
					palette.addSlot(slot, { animations: false })
					ids!.splice(slot.data, 0, slot.hex)
					history.replaceState('', '', ids!.join('-'))
				},
				redo() {
					palette.removeSlot(slot, { animations: false })
					ids!.splice(slot.data, 1)
					history.replaceState('', '', ids!.join('-'))
				},
			})
			return
		}

		// Copy Button
		if (target.closest('.info')) {
			let swatch = target.closest('.swatch')!
			let slot = palette.slots[parseInt(swatch.getAttribute('data-color-index')!)]
			if (target.closest('.hex')) {
				let menu = popOver([{ id: '' }], { type: 'color-picker', hex: slot.hex })
				swatch.append(menu)
				return
			}
			if (target.closest('.icon')) {
				await navigator.clipboard.writeText(slot.hex).then(
					() => {
						let tip = toolTip('Copied hex to clipboard!', { pos: [e.x, e.y] })
						tip.classList.add('at-mouse-pos')
						document.body.append(tip)
					},
					() => {
						let tip = toolTip('Copy to clipboard failed.', { pos: [e.x, e.y] })
						tip.classList.add('at-mouse-pos')
						document.body.append(tip)
					}
				)
				return
			}
		}
	}

	//* Palettes Page Palette Container
	let cancelPalsMouse = false
	;(document.querySelector('.palettes-page .saved-palettes-wrapper') as HTMLElement)!.onclick = () => palettesClick
	;(document.querySelector('.palettes-page .saved-palettes-wrapper') as HTMLElement)!.ontouchend = () => palettesClick
	async function palettesClick(e: MouseEvent) {
		let target = e.target as HTMLElement
		if ((e as PointerEvent).pointerType != 'mouse') {
			cancelPalsMouse = true
			setTimeout(() => {
				cancelPalsMouse = false
			}, 10)
		} else if (cancelPalsMouse) return

		// Copy Swatch
		let swatch = target.closest('.swatch')
		if (swatch) {
			let pal = swatch.parentElement!.parentElement!
			await navigator.clipboard
				.writeText(
					palettes.items[parseInt(pal.getAttribute('data-palette-index')!)][
						parseInt(swatch.getAttribute('data-color-index')!)
					]
				)
				.then(
					() => {
						let tip = toolTip('Copied hex to clipboard!', { pos: [e.x, e.y] })
						tip.classList.add('at-mouse-pos')
						document.body.append(tip)
					},
					() => {
						let tip = toolTip('Copy to clipboard failed.', { pos: [e.x, e.y] })
						tip.classList.add('at-mouse-pos')
						document.body.append(tip)
					}
				)
			return
		}

		// Overlay
		if (target.closest('.clear-overlay')) {
			target.closest('.popover')!.remove()
			return
		}

		// Open Button
		if (target.closest('#palettes-open')) {
			router.navigateTo(
				'/create/' +
					local.savedPalettes.items[
						parseInt(target.closest('.palette-container')!.getAttribute('data-palette-index')!)
					].join('-')
			)
			return
		}

		// Copy Button
		if (target.closest('#palettes-copy')) {
			await navigator.clipboard
				.writeText(
					palettes.items[parseInt(target.closest('.palette-container')!.getAttribute('data-palette-index')!)].join('\n')
				)
				.then(
					() => {
						let tip = toolTip('Copied hex to clipboard!', { pos: [e.x, e.y] })
						tip.classList.add('at-mouse-pos')
						document.body.append(tip)
					},
					() => {
						let tip = toolTip('Copy to clipboard failed.', { pos: [e.x, e.y] })
						tip.classList.add('at-mouse-pos')
						document.body.append(tip)
					}
				)
			return
		}

		// Remove Button
		if (target.closest('#palettes-remove')) {
			let index = parseInt(target.closest('.palette-container')!.getAttribute('data-palette-index')!)
			let item = palettes.items[index]
			let cmd = {
				undo() {
					palettes.addItem(item, index)
				},
				redo() {
					palettes.removeItem(index)
				},
			}
			session.palettes.push(cmd)
			palettes.removeItem(index)
			let tip = toolTip(`Removed palette.`)
			document.body.append(tip)
			return
		}

		// More Button
		let more = target.closest('.more')
		if (more) {
			let menu = popOver(
				[
					{ content: 'Open', id: 'palettes-open' },
					{ content: 'Remove', id: 'palettes-remove' },
					{ content: 'Copy', id: 'palettes-copy' },
				],
				{ type: 'menu' }
			)
			more.parentElement!.append(menu)
			return
		}
	}

	//* Toolbar
	let cancelToolMouse = false
	;(document.querySelector('.toolbar') as HTMLElement)!.onclick = () => toolbarClick
	;(document.querySelector('.toolbar') as HTMLElement)!.ontouchend = () => toolbarClick
	async function toolbarClick(e: MouseEvent) {
		let target = e.target as HTMLElement
		if ((e as PointerEvent).pointerType != 'mouse') {
			cancelToolMouse = true
			setTimeout(() => {
				cancelToolMouse = false
			}, 10)
		} else if (cancelToolMouse) return

		// Undo Button
		if (target.closest('.undo')) {
			if (router.deconstructURL(location.pathname, true).base == 'create') session.create.undo()
			else session.palettes.undo()
			return
		}

		// Redo Button
		if (target.closest('.redo')) {
			if (router.deconstructURL(location.pathname, true).base == 'create') session.create.redo()
			else session.palettes.redo()
			return
		}

		// Copy Button
		if (target.closest('.copy')) {
			if (router.deconstructURL(location.pathname, true).base == 'create') {
				let colors = []
				for (let { hex } of palette.slots) colors.push(hex)
				await navigator.clipboard.writeText(colors.join('\n')).then(
					() => {
						let tip = toolTip('Copied palette!')
						document.body.append(tip)
					},
					() => {
						let tip = toolTip('Failed to copy.')
						document.body.append(tip)
					}
				)
			} else {
				let pals = []
				for (let pal of palettes.items) pals.push(pal.join('-'))
				await navigator.clipboard.writeText(pals.join(',\n')).then(
					() => {
						let tip = toolTip('Copied palettes to clipboard!')
						document.body.append(tip)
					},
					() => {
						let tip = toolTip('Copy to clipboard failed.')
						document.body.append(tip)
					}
				)
			}
			return
		}

		// Generate
		if (target.closest('.generate')) {
			let prevIds: string[] = []
			for (let { hex } of palette.slots) prevIds.push(hex)
			palette.generate()
			let ids: string[] = []
			for (let { hex } of palette.slots) ids.push(hex)
			history.replaceState('', '', '/create/' + ids.join('-'))
			if (prevIds)
				session.create.push({
					undo: () => {
						palette.generate(prevIds)
						history.replaceState('', '', '/create/' + prevIds.join('-'))
					},
					redo: () => {
						palette.generate(ids)
						history.replaceState('', '', '/create/' + ids.join('-'))
					},
				})
			return
		}

		// Save Button
		if (target.closest('.save')) {
			if (!local.settings.cookiesOk) {
				document.body.append(toolTip(`You'll need to enable cookies in settings for that feature.`))
				return
			}
			let array = []
			for (let { hex } of palette.slots) array.push(hex)
			palettes.addItem(array)
			let tip = toolTip('Saved palette!')
			document.body.append(tip)
			return
		}

		// Remove All Button
		if (target.closest('.remove-all')) {
			confirmation(
				{
					message: `Are you sure you want to delete all of your palettes? You won't be able to undo this.`,
					value: 'remove-all',
				},
				[
					{
						message: `Yes, delete away.`,
						value: 'yes',
						call() {
							for (let i = 0; palettes.items.length; i++) palettes.removeItem(0)
							let tip = toolTip('All palettes removed.')
							document.body.append(tip)
						},
					},
					{ message: `No, please don't delete my stuff!`, value: 'no' },
				]
			)
			return
		}

		// Import Button
		if (target.closest('.import')) {
			if (router.deconstructURL(location.pathname, true).base == 'create') {
				let field = inputField(`Paste hex code palette below!`, 'import-create')
				document.body.append(field)
			} else {
				if (!local.settings.cookiesOk) {
					document.body.append(toolTip(`You'll need to enable cookies in settings for that feature.`))
					return
				}
				let field = inputField(`Paste hex code palette below! Separate palettes by commas.`, 'import-palettes')
				document.body.append(field)
			}
			return
		}
	}

	let mainNav = document.querySelector('.main-nav')!
	let mainHeader = document.querySelector('.main-header')!
	//* Misc
	let cancelGlobalMouse = false
	window.onclick = () => globalClick
	window.ontouchend = () => globalClick
	async function globalClick(e: MouseEvent) {
		let target = e.target as HTMLElement
		if ((e as PointerEvent).pointerType != 'mouse') {
			cancelGlobalMouse = true
			setTimeout(() => {
				cancelGlobalMouse = false
			}, 10)
		} else if (cancelGlobalMouse) return
		// Links
		let a = target.closest('a')
		if (a) {
			e.preventDefault()
			let aLink = a.getAttribute('href')!
			mainNav.classList.remove('visible')
			document.querySelector('.overlay')?.remove()
			document.body.style.overflowY = ''
			if (aLink != location.pathname) router.navigateTo(aLink)
			return
		}

		if (target.closest('#nav-button')) {
			mainNav.classList.toggle('visible')
			if (mainNav.classList.contains('visible')) {
				let overlay = document.createElement('div')
				overlay.classList.add('overlay')
				mainHeader.append(overlay)
				document.body.style.overflowY = 'hidden'
				palette.plus.hide()
				overlay.addEventListener(
					'click',
					() => {
						overlay.remove()
						mainNav.classList.remove('visible')
						document.body.style.overflowY = ''
					},
					{ once: true }
				)
				document.body.style.overflowY = 'hidden'
			} else {
				mainHeader.querySelector('.overlay')?.remove()
				document.body.style.overflowY = ''
			}
		}

		// Settings Button
		if (target.closest('#settings')) {
			let settings = settingsPopover()
			document.body.append(settings)
			return
		}

		// Confirmation Screens
		let confirmationScreen = target.closest('.confirmation-screen')
		if (confirmationScreen) {
			// All overlays
			if (target.closest('.overlay')) {
				if (confirmationScreen == document.querySelector('.cookies')) {
					local.settings = { cookiesOk: true }
					local.info = { firstVisit: true }
				}
				confirmationScreen.remove()
			}

			// Remove All
			if (confirmationScreen == document.querySelector('.remove-all-confirmation')) {
				if (target.closest('.yes')) {
					for (let i = 0; palettes.items.length; i++) palettes.removeItem(0)
					confirmationScreen.remove()
					let tip = toolTip('All palettes removed.')
					document.body.append(tip)
				} else if (target.closest('.no')) confirmationScreen.remove()
				return
			}

			// Import Create
			if (confirmationScreen == document.querySelector('.import-create')) {
				let hexes = router.deconstructURL(location.pathname, true).ids!
				let confirm = target.closest('.yes')
				let cancel = target.closest('.no')
				if (confirm) {
					let input = confirmationScreen
						.querySelector('textarea')!
						.value.trim()
						.replaceAll(' ', '')
						.replaceAll('\n', '')
						.replaceAll('-', '')
					let isValid =
						/[g-z~`!#$%\^&*+=\[\]\\';,/{}|\\":<>\?]/g.test(input) || input.length == 0 || input.length % 6 != 0
							? false
							: true
					let message = 'Invalid values entered. Try again.'
					if (isValid) {
						message = 'Successfully imported values.'
						let newHexes = input.match(/.{1,6}/g)!
						palette.generate(newHexes)
						session.create.push({
							undo() {
								palette.generate(hexes)
							},
							redo() {
								palette.generate(newHexes)
							},
						})
					}
					let tip = toolTip(message)
					document.body.append(tip)
					confirmationScreen.remove()
				} else if (cancel) {
					confirmationScreen.remove()
				}
				return
			}

			// Import Palettes
			if (confirmationScreen == document.querySelector('.import-palettes')) {
				let confirm = target.closest('.yes')
				let cancel = target.closest('.no')
				if (confirm) {
					let input = confirmationScreen
						.querySelector('textarea')!
						.value.trim()
						.replaceAll(' ', '')
						.replaceAll('\n', '')
						.replaceAll('-', '')
						.replaceAll('#', '')
						.toLowerCase()
					let message = 'Invalid values entered. Try again.'
					let isValid =
						/[g-z~`!#$%\^&*+=\[\]\\';/{}|\\":<>\?]/g.test(input) ||
						input.replaceAll(',', '').length % 6 != 0 ||
						input.length == 0
							? false
							: true
					console.log(input.replaceAll(',', '').length % 6 != 0)
					let pals = input.split(',')
					for (let pal of pals) if (pal.length / 6 > 8 || !(pal.length >= 6)) isValid = false
					if (isValid) {
						let i = 0
						for (let pal of pals) {
							i++
							palettes.addItem(pal.match(/.{1,6}/g))
						}
						message = 'Successfully imported values.'
						session.palettes.push({
							undo() {
								for (let j = i; j > 0; j--) palettes.removeItem(palettes.items.length - 1)
							},
							redo() {
								for (let pal of pals) {
									palettes.addItem(pal.match(/.{1,6}/g))
								}
							},
						})
					}
					let tip = toolTip(message)
					document.body.append(tip)
					confirmationScreen.remove()
				} else if (cancel) {
					confirmationScreen.remove()
				}
				return
			}

			// Settings
			if (confirmationScreen == document.querySelector('.settings-popover')) {
				let confirm = target.closest('.yes')
				let cancel = target.closest('.no')
				if (confirm) {
					let pendingSettings = local.settings
					pendingSettings.lastColorAlgorithmIndex = (
						confirmationScreen.querySelector('#algorithm')! as HTMLSelectElement
					).selectedIndex
					pendingSettings.cookiesOk = (confirmationScreen.querySelector('#cookies-ok')! as HTMLInputElement).checked
					local.settings = pendingSettings
					let message = 'Changes saved.'
					confirmationScreen.remove()
					let tip = toolTip(message)
					document.body.append(tip)
				} else if (cancel) {
					let message = 'Changes discarded.'
					confirmationScreen.remove()
					let tip = toolTip(message)
					document.body.append(tip)
				}
				return
			}

			// Are cookies okay?
			if (confirmationScreen == document.querySelector('.cookies-confirmation')) {
				let confirm = target.closest('.yes')
				let cancel = target.closest('.no')
				if (confirm) {
					local.settings = { cookiesOk: true }
					confirmationScreen.remove()
					let tip = toolTip('Thanks, enjoy the site! :)')
					document.body.append(tip)
				} else if (cancel) {
					local.settings = { cookiesOk: false }
					confirmationScreen.remove()
					let tip = toolTip(`You won't be able to save your palettes. You can change this in settings.`, {
						duration: 2500,
					})
					document.body.append(tip)
				}
				return
			}
		}
	}
}
