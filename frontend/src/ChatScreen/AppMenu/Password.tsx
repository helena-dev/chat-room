import React from "react"
import Icon from "@mdi/react"
import { mdiFormTextboxPassword, mdiLogin } from '@mdi/js';
import "./Password.css"

export interface PasswordProps {
    changePassword: (arg0: string, arg1: string) => void
    differentPasswords: () => void
    changedPwd: boolean
}

export default class Password extends React.Component<PasswordProps> {
    oldPasswordRef = React.createRef<HTMLInputElement>()

    render() {
        const { changePassword, differentPasswords, changedPwd } = this.props
        const onPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            this.oldPasswordRef.current!.focus()
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            const oldPassword = data.get("oldPassword") as string
            const password = data.get("password") as string
            const repPassword = data.get("repPassword") as string
            if (password === repPassword) {
                changePassword(oldPassword, password)
            } else {
                differentPasswords()
            }

        }

        if(changedPwd) {
            this.oldPasswordRef.current!.blur()
        }

        return (
            <div className="passwordContainer">
                <h3 className="passwordTitle">Password</h3>
                <form className="passwordField" autoComplete="off" onSubmit={onPasswordSubmit}>
                    <div className="oldPasswordInputContainer">
                        <label className="passwordInputLabel">
                            <input ref={this.oldPasswordRef} className="passwordInput" type="password" name="oldPassword" required maxLength={64} placeholder="Old Password" />
                            <Icon path={mdiFormTextboxPassword} size={"1em"} />
                        </label>
                    </div>
                    <div className="passwordInputContainer">
                        <label className="passwordInputLabel">
                            <input className="passwordInput" type="password" name="password" required maxLength={64} placeholder="New Password" autoComplete="new-password" />
                            <Icon path={mdiFormTextboxPassword} size={"1em"} />
                        </label>
                    </div>
                    <div className="passwordInputContainer">
                        <label className="passwordInputLabel">
                            <input className="passwordInput" type="password" name="repPassword" required maxLength={64} placeholder="Repeat password" autoComplete="new-password" />
                            <Icon path={mdiFormTextboxPassword} size={"1em"} />
                        </label>
                    </div>
                    <button type="submit" className="passwordButton">
                        Change Password
                        <Icon path={mdiLogin} size={"1em"} />
                    </button>
                </form>
            </div>
        )
    }
}
