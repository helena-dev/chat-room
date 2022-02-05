import React from "react"

export interface RecaptchaProps {
    theme?: "light" | "dark";
    size?: "normal" | "compact";
    tabindex?: number;
    callback?: () => void;
    "expired-callback"?: () => void;
    "error-callback"?: () => void;
}

export default class Recaptcha extends React.Component<RecaptchaProps> {
    recaptchaRef = React.createRef<HTMLDivElement>()
    captchaID?: string
    componentDidMount() {
        this.captchaID = (window as any).grecaptcha.render(this.recaptchaRef.current, {
            sitekey: process.env.REACT_APP_RECAPTCHA_SITEKEY,
            ...this.props,
        })
    }

    componentWillUnmount() {
        this.reset()
    }

    public getResponse(): string {
        return (window as any).grecaptcha.getResponse(this.captchaID)
    }

    public reset() {
        (window as any).grecaptcha.reset(this.captchaID)
    }

    render() {
        return (
            <div ref={this.recaptchaRef}></div>
        )
    }
}
