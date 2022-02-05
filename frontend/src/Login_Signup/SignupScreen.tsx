import React from "react"
import "./SignupScreen.css"
import Icon from "@mdi/react"
import { mdiLogin, mdiAccountEdit, mdiFormTextboxPassword } from '@mdi/js';
import Recaptcha from "../vendor/Recaptcha";

interface SignupScreenState {
    diffPassword: boolean
}

export interface SignupScreenProps {
    getSignupInfo: (userName: string, password: string, captchaResponse: string) => void
    failedSignup: boolean
    usedUsername: boolean
    failedCaptcha: boolean
}

export default class SignupScreen extends React.Component<SignupScreenProps> {
    state: SignupScreenState = { diffPassword: false }
    diffPassTimeot: any
    recaptchaRef = React.createRef<Recaptcha>()

    cancelTimeout() {
        if (this.diffPassTimeot) {
            clearTimeout(this.diffPassTimeot)
            this.diffPassTimeot = undefined
        }
    }
    render() {
        const { getSignupInfo, failedSignup, usedUsername, failedCaptcha } = this.props
        const { diffPassword } = this.state

        const onSignupSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            const userName = data.get("userName") as string
            const password = data.get("password") as string
            const repPassword = data.get("repPassword") as string
            const captchaResponse = data.get("g-recaptcha-response") as string
            if (password === repPassword) {
                getSignupInfo(userName, password, captchaResponse)
                this.recaptchaRef.current?.reset()
            } else {
                this.cancelTimeout()
                this.setState({ diffPassword: true })
                this.diffPassTimeot = setTimeout(() => {
                    this.diffPassTimeot = undefined
                    this.setState({ diffPassword: false })
                }, 2000)
            }

        }
        const visibility = failedSignup || diffPassword || usedUsername || failedCaptcha ? "visible" : "hidden"
        return (
            <div className="signupBiggestContainer">
                <div className="signupContainer">
                    <h2 className="signupTitle">Chat-room</h2>
                    <form className="signupForm" onSubmit={onSignupSubmit}>
                        <div className="signupInputContainer">
                            <label className="signupInputLabel">
                                <Icon path={mdiAccountEdit} size={"1em"} />
                                <input className="signupInput" type="text" name="userName" required maxLength={20} placeholder="Username" autoComplete="off" />
                            </label>
                        </div>
                        <div className="signupInputContainer">
                            <label className="signupInputLabel">
                                <Icon path={mdiFormTextboxPassword} size={"1em"} />
                                <input className="signupInput" type="password" name="password" required maxLength={64} placeholder="Password" autoComplete="new-password" />
                            </label>
                        </div>
                        <div className="signupInputContainer">
                            <label className="signupInputLabel">
                                <Icon path={mdiFormTextboxPassword} size={"1em"} />
                                <input className="signupInput" type="password" name="repPassword" required maxLength={64} placeholder="Repeat password" autoComplete="new-password" />
                            </label>
                        </div>
                        <div className="recaptchaContainer">
                            <Recaptcha ref={this.recaptchaRef} theme="dark" />
                        </div>
                        <button type="submit" className="signupButton">
                            <Icon path={mdiLogin} size={"1em"} />
                            Sign-up
                        </button>
                    </form>
                    <div className="signupError" style={{ visibility }}>
                        {diffPassword ?
                            <span className="signupErrorMsg">
                                The passwords do not match
                            </span> :
                            usedUsername ?
                                <span className="signupErrorMsg">
                                    That user name is already taken
                                </span> :
                                failedCaptcha ?
                                    <span className="signupErrorMsg">
                                        Invalid Captcha
                                    </span> :
                                    <span className="signupErrorMsg">
                                        There was a problem with the Sign-up
                                    </span>}
                    </div>
                </div>
            </div>
        )
    }
}
