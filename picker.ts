namespace microcode {
    export type PickerButtonDef = {
        icon: string | Image
        label?: string
        style?: ButtonStyle
    }

    export class PickerButton extends Button {
        constructor(public picker: Picker, btn: PickerButtonDef) {
            super({
                parent: picker,
                style: btn.style || ButtonStyles.LightShadowedWhite,
                icon: btn.icon,
                label: btn.label,
                x: 0,
                y: 0,
                onClick: () =>
                    this.picker.onButtonClicked(this, <string>btn.icon),
            })
        }
    }

    class PickerGroup {
        public xfrm: Affine
        public buttons: Button[]
        public bounds: Bounds

        constructor(
            picker: Picker,
            public opts?: {
                btns?: PickerButtonDef[]
            }
        ) {
            this.opts = this.opts || {}
            this.buttons = []
            this.bounds = new Bounds()
            this.xfrm = new Affine()
            this.xfrm.parent = picker.xfrm
        }

        public destroy() {
            this.buttons.forEach(btn => btn.destroy())
            this.buttons = undefined
            this.opts = undefined
            this.bounds = undefined
        }

        public layout() {
            const cell = new Bounds()
            this.buttons.forEach(btn => cell.add(btn.bounds))
            this.buttons.forEach((btn, idx) => {
                btn.xfrm.parent = this.xfrm
                const row = Math.floor(idx / MAX_PER_ROW)
                btn.xfrm.localPos.x =
                    (idx % MAX_PER_ROW) * cell.width + (idx % MAX_PER_ROW)
                btn.xfrm.localPos.y = row * cell.height
            })
            this.bounds = new Bounds()
            this.buttons.forEach(btn =>
                this.bounds.add(Bounds.Translate(btn.bounds, btn.xfrm.localPos))
            )
        }

        public draw() {
            this.buttons.forEach(btn => btn.draw())
        }
    }

    export class Picker extends Component implements IPlaceable {
        public groups: PickerGroup[]
        private xfrm_: Affine
        private navigator: INavigator
        private prevState: CursorState
        private deleteBtn: Button
        private panel: Bounds
        private onClick: (btn: string, button?: Button) => void
        private onHide: () => void
        private onDelete: () => void
        private hideOnClick: boolean
        private title: string
        public visible: boolean

        public get xfrm() {
            return this.xfrm_
        }

        constructor(private cursor: Cursor) {
            super("picker")
            this.xfrm_ = new Affine()
            this.groups = []
            this.navigator = new RowNavigator()
        }

        public addGroup(opts: { btns: PickerButtonDef[] }) {
            this.groups.push(new PickerGroup(this, opts))
        }

        public onButtonClicked(button: PickerButton, icon: string) {
            const onClick = this.onClick
            if (this.hideOnClick) {
                if (onClick) {
                    onClick(icon, button)
                }
                this.cursor.cancelHandlerStack.pop()
                this.hide()
            } else if (onClick) {
                onClick(icon, button)
            }
        }

        private cancelClicked() {
            this.cursor.cancelHandlerStack.pop()
            this.hide()
        }

        show(
            opts: {
                title?: string
                onClick?: (btn: string, button: Button) => void
                onHide?: () => void
                onDelete?: () => void
                navigator?: () => INavigator
            },
            hideOnClick: boolean = true
        ) {
            this.onClick = opts.onClick
            this.onHide = opts.onHide
            this.onDelete = opts.onDelete
            if (opts.navigator) {
                this.navigator.clear()
                this.navigator = opts.navigator()
            } else {
                this.navigator.clear()
                this.navigator = new RowNavigator()
            }
            this.hideOnClick = hideOnClick
            this.title = opts.title
            this.prevState = this.cursor.saveState()
            this.cursor.navigator = this.navigator
            this.cursor.cancelHandlerStack.push(() => this.cancelClicked())
            if (this.onDelete) {
                this.deleteBtn = new Button({
                    parent: this,
                    style: ButtonStyles.RedBorderedWhite,
                    icon: "delete",
                    label: "delete",
                    x: 0,
                    y: 0,
                    onClick: () => {
                        this.hide()
                        this.onDelete()
                    },
                })
            }
            this.groups.forEach(group => {
                const btns = group.opts.btns || []
                btns.forEach(btn => {
                    const button = new PickerButton(this, btn)
                    group.buttons.push(button)
                })
            })
            this.layout()
            this.visible = true
        }

        hide() {
            this.visible = false
            this.navigator.clear()
            this.cursor.restoreState(this.prevState)
            this.groups.forEach(group => group.destroy())
            if (this.deleteBtn) {
                this.deleteBtn.destroy()
                this.deleteBtn = undefined
            }
            this.groups = []
            if (this.onHide) {
                this.onHide()
            }
        }

        draw() {
            if (this.visible) {
                const left = this.panel.left
                const right = this.panel.right - 1
                const top = this.panel.top
                const bottom = this.panel.bottom - 1
                Screen.fillBoundsXfrm(this.xfrm, this.panel, 12)
                Screen.outlineBoundsXfrm(this.xfrm, this.panel, 1, 15)
                if (this.title) {
                    Screen.print(this.title, left + 2, top + 4, 1, image.font8)
                }
                this.groups.forEach(group => group.draw())
                if (this.deleteBtn) this.deleteBtn.draw()
            }
        }

        private layout() {
            if (this.deleteBtn) {
                this.navigator.addButtons([this.deleteBtn])
            }

            this.panel = new Bounds()

            let top = 2
            if (this.deleteBtn || this.title) {
                top += this.deleteBtn ? this.deleteBtn.height : HEADER
            }
            this.groups.forEach((group, idx) => {
                group.layout()
                if (idx === 0) {
                    top += group.buttons[0].height >> 1
                } else {
                    top += 1
                }
                group.xfrm.localPos.y = top
                this.panel.add(Bounds.Translate(group.bounds, new Vec2(0, top)))
                top += group.bounds.height
                this.navigator.addButtons(group.buttons)
            })

            if (this.deleteBtn) {
                this.deleteBtn.xfrm.localPos.x =
                    this.panel.right - (this.deleteBtn.width >> 1) + 1
                this.deleteBtn.xfrm.localPos.y =
                    this.panel.top + (this.deleteBtn.height >> 1)
            }

            this.panel.grow(2)
            this.xfrm.localPos.x = -(this.panel.width >> 1)
            this.xfrm.localPos.y = -(this.panel.height >> 1)

            const btn = this.navigator.initialCursor(0, 0)
            this.cursor.moveTo(btn.xfrm.worldPos, btn.ariaId, btn.bounds)
        }
    }

    const HEADER = 16
    const MAX_PER_ROW = 5
}
