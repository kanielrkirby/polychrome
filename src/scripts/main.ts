import '../styles/index.pcss'
import { local, pageFactory, confirmation, toolTip } from './utils'
import SavedPalettes from './SavedPalettes'
import Palette from './palette'
import Router from './routing'
import handleClicks from './handleClicks'
import handleDrag from './handleDrag'
import handleKeys from './handleKeys'
import handleTouches from './handleTouches'

export let palette = new Palette()
export let palettes = new SavedPalettes()
export let router = new Router([
	['', pageFactory('Home', document.getElementById('landing-page')!)],
	['palettes', pageFactory('Palettes', document.getElementById('palettes-page')!, palettes)],
	['create', pageFactory('Create', document.getElementById('create-page')!, palette)],
	['404', pageFactory('404 Not Found', document.getElementById('not-found-page')!)],
])

//* All Events/Inputs
router.routeToURL(location.pathname, true)
setTimeout(() => {
	;(document.querySelector(':root')! as HTMLElement).style.display = 'initial'
	if (window.innerHeight > window.innerWidth) document.body.classList.add('vertical')
	else document.body.classList.remove('vertical')
}, 200)

onpopstate = () => router.navigateTo(location.pathname, true, true)

handleClicks()
handleTouches()

handleDrag()

handleKeys()

//* Detectors for Plus Button
onmouseover = (e) => {
	if (!palette.plus.disabled) {
		const target = e.target as HTMLElement
		const swatch = target.closest('.swatch')
		if (swatch) {
			const detector = target.closest('.detector')
			if (detector && palette.slots.length < 8) {
				const left = target.closest('.left')
				let index = parseInt(swatch.getAttribute('data-color-index')!)
				if (left) index--
				palette.plus.show(index)
			} else palette.plus.hide()
		}
	}
}

if (local.info.firstVisit) {
	confirmation({ message: 'This site relies on local storage and cookies to save palettes.', value: 'cookies' }, [
		{
			message: `Sure, sounds good to me.`,
			value: 'yes',
			call() {
				local.info = { firstVisit: false }
				local.settings = { cookiesOk: true }
				let tip = toolTip('Thanks, enjoy the site! :)')
				document.body.append(tip)
			},
		},
		{
			message: `No thanks, I don't want to save palettes.`,
			value: 'no',
			call() {
				local.info = { firstVisit: false }
				local.settings = { cookiesOk: false }
				for (let i = 0; i < palettes.items.length; i++) palettes.removeItem(0)
				let tip = toolTip(`You won't be able to save your palettes. You can change this in settings.`, {
					duration: 2500,
				})
				document.body.append(tip)
			},
		},
	])
}

onresize = () => {
	if (window.innerHeight > window.innerWidth) document.body.classList.add('vertical')
	else document.body.classList.remove('vertical')
}

if (navigator.userAgent.includes('Android') || navigator.userAgent.includes('like Mac')) {
	document.body.classList.add('mobile')
}
