import React from "react"
import "./SignupScreen.css"
import Icon from "@mdi/react"
import { mdiLogin, mdiAccountEdit, mdiFormTextboxPassword } from '@mdi/js';

interface SignupScreenState {
    diffPassword: boolean
}

export interface SignupScreenProps {
    getSignupInfo: (userName: string, password: string) => void
    failedSignup: boolean
    usedUsername: boolean
}

export default class SignupScreen extends React.Component<SignupScreenProps> {
    state: SignupScreenState = { diffPassword: false }
    diffPassTimeot: any

    cancelTimeout() {
        if (this.diffPassTimeot) {
            clearTimeout(this.diffPassTimeot)
            this.diffPassTimeot = undefined
        }
    }
    render() {
        const { getSignupInfo, failedSignup, usedUsername } = this.props
        const { diffPassword } = this.state

        const onSignupSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            const userName = data.get("userName") as string
            const password = data.get("password") as string
            const repPassword = data.get("repPassword") as string
            if (password === repPassword) {
                getSignupInfo(userName, password)
            } else {
                this.cancelTimeout()
                this.setState({ diffPassword: true })
                this.diffPassTimeot = setTimeout(() => {
                    this.diffPassTimeot = undefined
                    this.setState({ diffPassword: false })
                }, 2000)
            }

        }
        const visibility = failedSignup || diffPassword || usedUsername ? "visible" : "hidden"
        return (
            <div className="loginBiggestContainer">
                <div className="loginContainer">
                    <h2 className="loginTitle">Chat-room</h2>
                    <form className="loginForm" onSubmit={onSignupSubmit}>
                        <div className="loginInputContainer">
                            <label className="loginInputLabel">
                                <Icon path={mdiAccountEdit} size={"1em"} />
                                <input className="loginInput" type="text" name="userName" required maxLength={20} placeholder="Username" autoComplete="off"/>
                            </label>
                        </div>
                        <div className="loginInputContainer">
                            <label className="loginInputLabel">
                                <Icon path={mdiFormTextboxPassword} size={"1em"} />
                                <input className="loginInput" type="password" name="password" required maxLength={64} placeholder="Password" autoComplete="new-password"/>
                            </label>
                        </div>
                        <div className="loginInputContainer">
                            <label className="loginInputLabel">
                                <Icon path={mdiFormTextboxPassword} size={"1em"} />
                                <input className="loginInput" type="password" name="repPassword" required maxLength={64} placeholder="Repeat password" autoComplete="new-password"/>
                            </label>
                        </div>
                        <button type="submit" className="loginButton">
                            <Icon path={mdiLogin} size={"1em"} />
                            Sign-up
                        </button>
                    </form>
                    <div className="loginError" style={{ visibility }}>
                        {diffPassword ?
                            <span className="loginErrorMsg">
                                The passwords do not match.
                            </span> :
                            usedUsername ?
                                <span className="loginErrorMsg">
                                    That user name is already taken.
                                </span> :
                                <span className="loginErrorMsg">
                                    There was a problem with the Sign-up.
                                </span>}
                    </div>
                </div>
            </div>
        )
    }
}
